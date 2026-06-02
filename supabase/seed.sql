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


-- Recreate profiles for any existing users in auth.users that don't have one yet
-- This MUST run after all tables/triggers/policies are created, and after TRUNCATE, but before profile updates/seed data
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
