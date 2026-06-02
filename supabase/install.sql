-- ==============================================
-- SMART SCHOOL OFFICE V.2 COMPLETE INSTALLATION
-- Generated on 2026-06-02 15:14:47
-- ==============================================

-- MIGRATION: 001_smart_school_office_v2.sql
-- ----------------------------------------------
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
-- This MUST run after all tables/triggers/policies are created, but before seed data
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


-- ==============================================
-- SEED DATA
-- ==============================================
-- 1. ล้างตารางข้อมูลเดิมเพื่อความสะอาดในการนำเข้าข้อมูลใหม่
TRUNCATE TABLE public.document_receivers CASCADE;
TRUNCATE TABLE public.documents CASCADE;
TRUNCATE TABLE public.students CASCADE;
TRUNCATE TABLE public.departments CASCADE;

-- เคลียร์ไอดีผู้ใช้งานทดสอบที่อาจเคยถูกสร้างแบบข้ามขั้นตอนออก เพื่อแก้ไขโครงสร้างสคีมาของ Supabase
-- Demo auth accounts are not created here; add them in Supabase Auth or use supabase/scratch/seed_demo_auth_users.mjs.
-- Missing public.profiles rows are created automatically on first login when the updated RLS policy is installed.
DELETE FROM auth.users WHERE id IN (
  'a0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000004',
  'a0000000-0000-0000-0000-000000000005'
);

-- 2. สร้างฝ่ายงาน (Departments) ด้วย UUID คงที่
INSERT INTO public.departments (id, code, name, description) VALUES 
('d0000000-0000-0000-0000-000000000001', 'acad', 'ฝ่ายบริหารวิชาการ', 'ดูแลงานหลักสูตร การจัดการเรียนการสอน และงานทะเบียนนักเรียน'),
('d0000000-0000-0000-0000-000000000002', 'budget', 'ฝ่ายบริหารงบประมาณและแผนงาน', 'ดูแลงานการเงิน การบัญชี พัสดุ และแผนปฏิบัติราชการ'),
('d0000000-0000-0000-0000-000000000003', 'hr', 'ฝ่ายบริหารงานบุคคล', 'ดูแลงานบุคลากร อัตรากำลัง สวัสดิการ และการพัฒนาครู'),
('d0000000-0000-0000-0000-000000000004', 'general', 'ฝ่ายบริหารทั่วไปและสารบรรณ', 'ดูแลงานสารบรรณ อาคารสถานที่ ยานพาหนะ และงานประชาสัมพันธ์');

-- 3. ตั้งค่าโปรไฟล์โรงเรียนเริ่มต้น (School Settings)
INSERT INTO public.school_settings (key, value) VALUES (
  'school_profile', 
  jsonb_build_object(
    'name_th', 'โรงเรียนสมาร์ทวิทยา',
    'name_en', 'Smart Wittaya School',
    'code', '10100201',
    'address', '123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร 10110',
    'phone', '02-1234567',
    'email', 'info@smartwittaya.ac.th',
    'website', 'www.smartwittaya.ac.th',
    'director_name', 'ดร.สมชาย ใจดี',
    'academic_year', '2569',
    'semester', '1'
  )
) ON CONFLICT (key) DO UPDATE SET value = excluded.value;

-- 4. อัปเดตข้อมูลฝ่ายงาน (Department) และสิทธิ์ใช้งาน (Role) ในตาราง Profiles อิงตาม Email ของผู้ใช้ที่สมัครในระบบ
UPDATE public.profiles SET role = 'admin', department_id = 'd0000000-0000-0000-0000-000000000004' WHERE email = 'admin@school.go.th';
UPDATE public.profiles SET role = 'director', department_id = 'd0000000-0000-0000-0000-000000000004' WHERE email = 'director@school.go.th';
UPDATE public.profiles SET role = 'registrar', department_id = 'd0000000-0000-0000-0000-000000000001' WHERE email = 'registrar@school.go.th';
UPDATE public.profiles SET role = 'teacher', department_id = 'd0000000-0000-0000-0000-000000000001' WHERE email = 'teacher@school.go.th';
UPDATE public.profiles SET role = 'general_staff', department_id = 'd0000000-0000-0000-0000-000000000004' WHERE email = 'staff@school.go.th';

-- 5. สร้างข้อมูลหนังสือราชการ (Documents) เชื่อมโยงกับ UUID ของผู้เขียนโดยอิงจากตาราง Profiles
INSERT INTO public.documents (id, doc_no, title, description, category, priority, status, sender, receiver, doc_date, created_by, updated_by, created_at, updated_at)
SELECT 
  'f0000000-0000-0000-0000-000000000001', 
  'ศธ ๐๔๐๐๒/๑๐๒๕', 
  'ขอความอนุเคราะห์ส่งบุคลากรเข้ารับการฝึกอบรมการใช้งานระบบสารบรรณอิเล็กทรอนิกส์', 
  'ฝึกอบรมความรู้แก่บุคลากรสายสนับสนุนงานสารบรรณ เพื่อการเปลี่ยนผ่านสู่สำนักงานดิจิทัล', 
  'incoming', 
  'urgent', 
  'approved', 
  'สำนักงานคณะกรรมการการศึกษาขั้นพื้นฐาน', 
  'ผู้อำนวยการโรงเรียนสมาร์ทวิทยา', 
  '2026-05-20', 
  id, 
  id, 
  '2026-05-22 08:30:00+00'::timestamptz, 
  '2026-05-22 08:30:00+00'::timestamptz
FROM public.profiles 
WHERE email = 'staff@school.go.th';

INSERT INTO public.documents (id, doc_no, title, description, category, priority, status, sender, receiver, doc_date, created_by, updated_by, created_at, updated_at)
SELECT 
  'f0000000-0000-0000-0000-000000000002', 
  'ศธ ๐๔๐๐๒/๒๕๓', 
  'แจ้งการจัดสรรงบประมาณโครงการพัฒนาทักษะดิจิทัลสำหรับนักเรียน ประจำปีงบประมาณ ๒๕๖๙', 
  'จัดสรรงบประมาณจำนวน 150,000 บาท เพื่อดำเนินการฝึกอบรมคอมพิวเตอร์และปัญญาประดิษฐ์เบื้องต้นให้กับนักเรียนช่วงชั้นที่ 3', 
  'incoming', 
  'very_urgent', 
  'pending_approval', 
  'สำนักงานเขตพื้นที่การศึกษามัธยมศึกษา', 
  'กลุ่มงานบริหารงบประมาณ', 
  '2026-06-01', 
  id, 
  id, 
  '2026-06-02 09:00:00+00'::timestamptz, 
  '2026-06-02 09:00:00+00'::timestamptz
FROM public.profiles 
WHERE email = 'staff@school.go.th';

INSERT INTO public.documents (id, doc_no, title, description, category, priority, status, sender, receiver, doc_date, created_by, updated_by, created_at, updated_at)
SELECT 
  'f0000000-0000-0000-0000-000000000003', 
  'รน.สว ๐๐๑/๒๕๖๙', 
  'ส่งรายงานผลการประเมินตนเองของสถานศึกษา (SAR) ประจำปีการศึกษา ๒๕๖๘', 
  'รายงานสรุปผลการบริหารจัดการเรียนการสอนและโครงการต่างๆ ในรอบปีการศึกษาที่ผ่านมา', 
  'outgoing', 
  'normal', 
  'approved', 
  'โรงเรียนสมาร์ทวิทยา', 
  'สำนักงานเขตพื้นที่การศึกษามัธยมศึกษา', 
  '2026-05-15', 
  id, 
  id, 
  '2026-05-15 15:00:00+00'::timestamptz, 
  '2026-05-15 15:00:00+00'::timestamptz
FROM public.profiles 
WHERE email = 'registrar@school.go.th';

INSERT INTO public.documents (id, doc_no, title, description, category, priority, status, sender, receiver, doc_date, created_by, updated_by, created_at, updated_at)
SELECT 
  'f0000000-0000-0000-0000-000000000004', 
  'รน.สว ๐๐๒/๒๕๖๙', 
  'คำสั่งโรงเรียนสมาร์ทวิทยา ที่ ๐๑๒/๒๕๖๙ เรื่อง แต่งตั้งคณะกรรมการดำเนินงานจัดกิจกรรมวันไหว้ครู', 
  'แต่งตั้งครูและบุคลากรทางการศึกษาปฏิบัติหน้าที่ในฝ่ายเตรียมงาน ฝ่ายพิธีการ และฝ่ายสวัสดิการ', 
  'circular', 
  'urgent', 
  'approved', 
  'กลุ่มงานบริหารทั่วไป', 
  'ข้าราชการครูและบุคลากรทางการศึกษาทุกท่าน', 
  '2026-05-28', 
  id, 
  id, 
  '2026-05-28 10:15:00+00'::timestamptz, 
  '2026-05-28 10:15:00+00'::timestamptz
FROM public.profiles 
WHERE email = 'admin@school.go.th';

INSERT INTO public.documents (id, doc_no, title, description, category, priority, status, sender, receiver, doc_date, created_by, updated_by, created_at, updated_at)
SELECT 
  'f0000000-0000-0000-0000-000000000005', 
  'รน.สว ๐๐๓/๒๕๖๙', 
  'ประกาศเรื่องการสวมใส่เครื่องแบบนักเรียนและกฎระเบียบวินัยสำหรับปีการศึกษาใหม่', 
  'ประชาสัมพันธ์แจ้งเตือนระเบียบวินัยการเข้าเรียน การแต่งกาย และทรงผมของนักเรียนตามฉบับปรับปรุงใหม่ปี 2569', 
  'circular', 
  'normal', 
  'approved', 
  'กลุ่มงานงานปกครองและกิจการนักเรียน', 
  'นักเรียน ผู้ปกครอง และครูที่ปรึกษาทุกห้องเรียน', 
  '2026-05-30', 
  id, 
  id, 
  '2026-05-30 11:00:00+00'::timestamptz, 
  '2026-05-30 11:00:00+00'::timestamptz
FROM public.profiles 
WHERE email = 'teacher@school.go.th';

-- 6. บันทึกประวัติการอ่านหนังสือเวียนประชาสัมพันธ์
INSERT INTO public.document_receivers (id, document_id, profile_id, read_at, created_at)
SELECT 
  'c0000000-0000-0000-0000-000000000001', 
  'f0000000-0000-0000-0000-000000000004', 
  id, 
  '2026-05-28 11:20:00+00'::timestamptz, 
  '2026-05-28 10:15:00+00'::timestamptz
FROM public.profiles 
WHERE email = 'director@school.go.th';

INSERT INTO public.document_receivers (id, document_id, profile_id, read_at, created_at)
SELECT 
  'c0000000-0000-0000-0000-000000000002', 
  'f0000000-0000-0000-0000-000000000004', 
  id, 
  '2026-05-28 13:45:00+00'::timestamptz, 
  '2026-05-28 10:15:00+00'::timestamptz
FROM public.profiles 
WHERE email = 'registrar@school.go.th';

-- 7. สร้างรายชื่อนักเรียนในฐานข้อมูล (Students)
INSERT INTO public.students (id, student_id, first_name, last_name, class_level, classroom, status, guardian_name, guardian_phone, created_at, updated_at) VALUES 
('b0000000-0000-0000-0000-000000000001', '15001', 'กิตติศักดิ์', 'รักดี', 'ม.1', '1', 'active', 'สมชาย รักดี', '081-111-1111', now(), now()),
('b0000000-0000-0000-0000-000000000002', '15002', 'จิราพร', 'สุวรรณ', 'ม.1', '1', 'active', 'ประเสริถ สุวรรณ', '082-222-2222', now(), now()),
('b0000000-0000-0000-0000-000000000003', '15003', 'ณัฐพล', 'แสงจันทร์', 'ม.1', '2', 'active', 'ชูชาติ แสงจันทร์', '083-333-3333', now(), now()),
('b0000000-0000-0000-0000-000000000004', '14001', 'ธนารีย์', 'งามจิต', 'ม.3', '1', 'active', 'เพ็ญศรี งามจิต', '084-444-4444', now(), now()),
('b0000000-0000-0000-0000-000000000005', '14002', 'ปกรณ์', 'มีสุข', 'ม.3', '2', 'active', 'ประวิทย์ มีสุข', '085-555-5555', now(), now()),
('b0000000-0000-0000-0000-000000000006', '13001', 'วิภาวี', 'ดวงใจ', 'ม.4', '1', 'active', 'สายใจ ดวงใจ', '086-666-6666', now(), now()),
('b0000000-0000-0000-0000-000000000007', '11001', 'อนันต์', 'มั่นคง', 'ม.6', '1', 'active', 'สุรพล มั่นคง', '087-777-7777', now(), now()),
('b0000000-0000-0000-0000-000000000008', '11002', 'เบญจวรรณ', 'วิริยะ', 'ม.6', '2', 'active', 'สุนทร วิริยะ', '088-888-8888', now(), now());


