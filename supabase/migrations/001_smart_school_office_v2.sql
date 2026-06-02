-- Smart School Office V.2 Schema Migration
-- Database initialization script

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Drop existing public tables if they exist to force recreating them with the updated schema (adds missing columns like 'email')
drop table if exists public.document_receivers cascade;
drop table if exists public.documents cascade;
drop table if exists public.students cascade;
drop table if exists public.profiles cascade;
drop table if exists public.departments cascade;
drop table if exists public.school_settings cascade;

-- Create Departments table
create table if not exists public.departments (
    id uuid default gen_random_uuid() primary key,
    code varchar(50) unique not null,
    name varchar(255) not null,
    description text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Profiles table
create table if not exists public.profiles (
    id uuid references auth.users on delete cascade primary key,
    full_name varchar(255) not null,
    role varchar(50) default 'general_staff'::character varying not null check (role in ('admin', 'director', 'registrar', 'teacher', 'general_staff')),
    department_id uuid references public.departments(id) on delete set null,
    phone varchar(50),
    avatar_url text,
    email varchar(255),
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);



-- Create Documents (Correspondence) table
create table if not exists public.documents (
    id uuid default gen_random_uuid() primary key,
    doc_no varchar(100) not null, -- เลขที่หนังสือ
    title varchar(500) not null,
    description text,
    category varchar(50) not null check (category in ('incoming', 'outgoing', 'circular')), -- ประเภท: รับ, ส่ง, เวียน
    priority varchar(50) default 'normal'::character varying not null check (priority in ('normal', 'urgent', 'very_urgent')), -- ระดับความเร่งด่วน
    status varchar(50) default 'draft'::character varying not null check (status in ('draft', 'pending_approval', 'approved', 'archived')), -- สถานะ
    sender varchar(255) not null,
    receiver varchar(255) not null,
    file_path text, -- ลิงก์ไฟล์ใน Supabase storage
    created_by uuid references public.profiles(id) on delete set null,
    updated_by uuid references public.profiles(id) on delete set null,
    doc_date date not null default current_date, -- วันที่ในหนังสือ
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Document Receivers table (For circular letters read tracking)
create table if not exists public.document_receivers (
    id uuid default gen_random_uuid() primary key,
    document_id uuid references public.documents(id) on delete cascade not null,
    profile_id uuid references public.profiles(id) on delete cascade not null,
    read_at timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(document_id, profile_id)
);

-- Create Students table
create table if not exists public.students (
    id uuid default gen_random_uuid() primary key,
    student_id varchar(50) unique not null, -- รหัสนักเรียน
    first_name varchar(255) not null,
    last_name varchar(255) not null,
    class_level varchar(50) not null, -- ชั้นเรียน เช่น ม.1, ม.6
    classroom varchar(50) not null, -- ห้อง เช่นห้อง 1, 2
    status varchar(50) default 'active'::character varying not null check (status in ('active', 'suspended', 'graduated', 'transferred')),
    guardian_name varchar(255),
    guardian_phone varchar(50),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create School Settings table
create table if not exists public.school_settings (
    key varchar(100) primary key,
    value jsonb not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create profile update function/trigger when user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role, avatar_url, phone, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'general_staff'),
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'phone',
    new.email
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    role = excluded.role,
    avatar_url = excluded.avatar_url,
    phone = excluded.phone,
    email = excluded.email,
    updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

-- Create helper to safely read role from JWT metadata (prevents RLS infinite recursion)
create or replace function public.get_user_role()
returns text as $$
  select coalesce(auth.jwt() -> 'user_metadata' ->> 'role', 'general_staff');
$$ language sql security definer;

-- Diagnostic function to check table counts
create or replace function public.get_db_diagnostic()
returns json as $$
declare
  auth_count integer;
  profile_count integer;
  dept_count integer;
  doc_count integer;
  receiver_count integer;
  student_count integer;
begin
  select count(*) into auth_count from auth.users;
  select count(*) into profile_count from public.profiles;
  select count(*) into dept_count from public.departments;
  select count(*) into doc_count from public.documents;
  select count(*) into receiver_count from public.document_receivers;
  select count(*) into student_count from public.students;
  return json_build_object(
    'auth_users_count', auth_count,
    'profiles_count', profile_count,
    'departments_count', dept_count,
    'documents_count', doc_count,
    'receivers_count', receiver_count,
    'students_count', student_count
  );
end;
$$ language plpgsql security definer;

-- Drop triggers if they exist to make the script repeatable
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists update_profiles_updated_at on public.profiles;
drop trigger if exists update_documents_updated_at on public.documents;
drop trigger if exists update_students_updated_at on public.students;

-- Trigger for new user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Automatically update timestamps
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger update_documents_updated_at
  before update on public.documents
  for each row execute procedure public.handle_updated_at();

create trigger update_students_updated_at
  before update on public.students
  for each row execute procedure public.handle_updated_at();

-- ENABLE ROW LEVEL SECURITY (RLS)
alter table public.departments enable row level security;
alter table public.profiles enable row level security;
alter table public.documents enable row level security;
alter table public.document_receivers enable row level security;
alter table public.students enable row level security;
alter table public.school_settings enable row level security;

-- Drop existing policies if they exist to make script repeatable
drop policy if exists "Allow read access to authenticated users on departments" on public.departments;
drop policy if exists "Allow all actions to admin on departments" on public.departments;
drop policy if exists "Allow read access to authenticated users on profiles" on public.profiles;
drop policy if exists "Allow users to create their own profile" on public.profiles;
drop policy if exists "Allow users to update their own profile" on public.profiles;
drop policy if exists "Allow all actions to admin on profiles" on public.profiles;
drop policy if exists "Allow read access to authenticated users on documents" on public.documents;
drop policy if exists "Allow create/update to staff on documents" on public.documents;
drop policy if exists "Allow read/write access to authenticated users on document_receivers" on public.document_receivers;
drop policy if exists "Allow read access to authenticated users on students" on public.students;
drop policy if exists "Allow write access to admin/registrar/teachers on students" on public.students;
drop policy if exists "Allow read access to authenticated users on school_settings" on public.school_settings;
drop policy if exists "Allow write access to admin/director on school_settings" on public.school_settings;

-- Policies for departments
create policy "Allow read access to authenticated users on departments"
  on public.departments for select to authenticated using (true);
create policy "Allow all actions to admin on departments"
  on public.departments for all to authenticated using (
    public.get_user_role() = 'admin'
  );

-- Policies for profiles
create policy "Allow read access to authenticated users on profiles"
  on public.profiles for select to authenticated using (true);
create policy "Allow users to create their own profile"
  on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "Allow users to update their own profile"
  on public.profiles for update to authenticated using (auth.uid() = id);
create policy "Allow all actions to admin on profiles"
  on public.profiles for all to authenticated using (
    public.get_user_role() = 'admin'
  );

-- Policies for documents
create policy "Allow read access to authenticated users on documents"
  on public.documents for select to authenticated using (true);
create policy "Allow create/update to staff on documents"
  on public.documents for all to authenticated using (true);

-- Policies for document_receivers
create policy "Allow read/write access to authenticated users on document_receivers"
  on public.document_receivers for all to authenticated using (true);

-- Policies for students
create policy "Allow read access to authenticated users on students"
  on public.students for select to authenticated using (true);
create policy "Allow write access to admin/registrar/teachers on students"
  on public.students for all to authenticated using (
    public.get_user_role() in ('admin', 'registrar', 'teacher')
  );

-- Policies for school_settings
create policy "Allow read access to authenticated users on school_settings"
  on public.school_settings for select to authenticated using (true);
create policy "Allow write access to admin/director on school_settings"
  on public.school_settings for all to authenticated using (
    public.get_user_role() in ('admin', 'director')
  );

-- Recreate profiles for any existing users in auth.users that don't have one yet
-- This MUST run at the very end, after all tables/triggers/policies are created
insert into public.profiles (id, full_name, role, avatar_url, phone, email)
select 
  id,
  coalesce(raw_user_meta_data->>'full_name', email),
  coalesce(raw_user_meta_data->>'role', 'general_staff'),
  raw_user_meta_data->>'avatar_url',
  raw_user_meta_data->>'phone',
  email
from auth.users
on conflict (id) do nothing;
