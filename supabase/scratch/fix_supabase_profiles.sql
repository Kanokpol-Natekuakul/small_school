-- One-time patch for existing Supabase projects.
-- Run this in the Supabase SQL Editor if you already created auth users manually
-- and the matching public.profiles rows are still missing.

alter table public.profiles enable row level security;

drop policy if exists "Allow users to create their own profile" on public.profiles;
create policy "Allow users to create their own profile"
  on public.profiles for insert to authenticated with check (auth.uid() = id);

insert into public.profiles (id, full_name, role, department_id, avatar_url, phone, email)
select
  id,
  case lower(email)
    when 'admin@school.go.th' then 'ผู้ดูแลระบบ'
    when 'director@school.go.th' then 'ผู้อำนวยการ'
    when 'registrar@school.go.th' then 'งานทะเบียน'
    when 'teacher@school.go.th' then 'ครูประจำชั้น'
    when 'staff@school.go.th' then 'เจ้าหน้าที่'
    else coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', email, 'Supabase User')
  end,
  case lower(email)
    when 'admin@school.go.th' then 'admin'
    when 'director@school.go.th' then 'director'
    when 'registrar@school.go.th' then 'registrar'
    when 'teacher@school.go.th' then 'teacher'
    when 'staff@school.go.th' then 'general_staff'
    else
      case lower(coalesce(raw_user_meta_data->>'role', ''))
        when 'admin' then 'admin'
        when 'director' then 'director'
        when 'registrar' then 'registrar'
        when 'teacher' then 'teacher'
        when 'general_staff' then 'general_staff'
        else 'general_staff'
      end
  end,
  case lower(email)
    when 'admin@school.go.th' then 'd0000000-0000-0000-0000-000000000004'
    when 'director@school.go.th' then 'd0000000-0000-0000-0000-000000000004'
    when 'registrar@school.go.th' then 'd0000000-0000-0000-0000-000000000001'
    when 'teacher@school.go.th' then 'd0000000-0000-0000-0000-000000000001'
    when 'staff@school.go.th' then 'd0000000-0000-0000-0000-000000000004'
    else null
  end,
  raw_user_meta_data->>'avatar_url',
  raw_user_meta_data->>'phone',
  email
from auth.users
on conflict (id) do update set
  full_name = excluded.full_name,
  role = excluded.role,
  department_id = excluded.department_id,
  avatar_url = excluded.avatar_url,
  phone = excluded.phone,
  email = excluded.email;
