import { supabase, isSupabaseBackend, createTempClient, backendRuntimeMode } from './supabase';
import type { User } from '@supabase/supabase-js';
import type { Department, Profile, Document, Student, SchoolSettings, DocumentReceiver, UserRole, DocCategory } from '../types';

// Helper to generate UUIDs for mock data
const generateUUID = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
const legacyCurrentUserStorageKey = 'sso_current_user';
const currentUserStorageKey = `sso_current_user_${backendRuntimeMode}`;
const SUPABASE_DEFAULT_ROLE: UserRole = 'general_staff';
const SUPABASE_DEMO_PROFILE_DEFAULTS: Record<string, { fullName: string; role: UserRole }> = {
  'admin@school.go.th': { fullName: 'ผู้ดูแลระบบ', role: 'admin' },
  'director@school.go.th': { fullName: 'ผู้อำนวยการ', role: 'director' },
  'registrar@school.go.th': { fullName: 'งานทะเบียน', role: 'registrar' },
  'teacher@school.go.th': { fullName: 'ครูประจำชั้น', role: 'teacher' },
  'staff@school.go.th': { fullName: 'เจ้าหน้าที่', role: 'general_staff' }
};

const getStoredCurrentUser = (): Profile | null => {
  const user = localStorage.getItem(currentUserStorageKey);
  return user ? JSON.parse(user) : null;
};

const setStoredCurrentUser = (profile: Profile): void => {
  localStorage.setItem(currentUserStorageKey, JSON.stringify(profile));
  localStorage.removeItem(legacyCurrentUserStorageKey);
};

const clearStoredCurrentUser = (): void => {
  localStorage.removeItem(currentUserStorageKey);
  localStorage.removeItem(legacyCurrentUserStorageKey);
};

const readMetadataString = (metadata: User['user_metadata'] | undefined, key: string): string | undefined => {
  const value = metadata?.[key];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
};

const resolveSupabaseRole = (role: string | undefined, email: string): UserRole => {
  if (role === 'admin' || role === 'director' || role === 'registrar' || role === 'teacher' || role === 'general_staff') {
    return role;
  }
  const demoDefault = SUPABASE_DEMO_PROFILE_DEFAULTS[email.toLowerCase()];
  return demoDefault?.role || SUPABASE_DEFAULT_ROLE;
};

const buildSupabaseProfile = (user: User): Omit<Profile, 'created_at' | 'updated_at'> => {
  const metadata = user.user_metadata as Record<string, unknown> | undefined;
  const email = typeof user.email === 'string' && user.email.trim().length > 0
    ? user.email.trim()
    : readMetadataString(metadata, 'email') || '';
  const demoDefault = SUPABASE_DEMO_PROFILE_DEFAULTS[email.toLowerCase()];
  const fullName =
    readMetadataString(metadata, 'full_name') ||
    readMetadataString(metadata, 'name') ||
    readMetadataString(metadata, 'display_name') ||
    demoDefault?.fullName ||
    email ||
    'Supabase User';

  return {
    id: user.id,
    full_name: fullName,
    role: resolveSupabaseRole(readMetadataString(metadata, 'role'), email),
    department_id: readMetadataString(metadata, 'department_id'),
    phone: readMetadataString(metadata, 'phone'),
    avatar_url: readMetadataString(metadata, 'avatar_url'),
    email
  };
};

const getSupabaseProfileById = async (id: string): Promise<Profile | null> => {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
  if (error || !data) return null;
  return data as Profile;
};

const loadOrCreateSupabaseProfile = async (user: User): Promise<Profile> => {
  const existingProfile = await getSupabaseProfileById(user.id);
  if (existingProfile) {
    return existingProfile;
  }

  const profilePayload = buildSupabaseProfile(user);
  const { data, error } = await supabase.from('profiles').insert([profilePayload]).select('*').single();
  if (error || !data) {
    const fallbackProfile = await getSupabaseProfileById(user.id);
    if (fallbackProfile) {
      return fallbackProfile;
    }

    throw new Error(
      'Could not create the matching profile row in public.profiles. Make sure the updated supabase/install.sql has been applied so authenticated users can create their own profile row.'
    );
  }

  return data as Profile;
};

// ==========================================
// MOCK DATA INITIALIZATION SEED
// ==========================================

const MOCK_DEPARTMENTS: Department[] = [
  { id: 'dept-acad', code: 'acad', name: 'ฝ่ายบริหารวิชาการ', description: 'ดูแลงานหลักสูตร การจัดการเรียนการสอน และงานทะเบียนนักเรียน', created_at: new Date().toISOString() },
  { id: 'dept-budget', code: 'budget', name: 'ฝ่ายบริหารงบประมาณและแผนงาน', description: 'ดูแลงานการเงิน การบัญชี พัสดุ และแผนปฏิบัติราชการ', created_at: new Date().toISOString() },
  { id: 'dept-hr', code: 'hr', name: 'ฝ่ายบริหารงานบุคคล', description: 'ดูแลงานบุคลากร อัตรากำลัง สวัสดิการ และการพัฒนาครู', created_at: new Date().toISOString() },
  { id: 'dept-general', code: 'general', name: 'ฝ่ายบริหารทั่วไปและสารบรรณ', description: 'ดูแลงานสารบรรณ อาคารสถานที่ ยานพาหนะ และงานประชาสัมพันธ์', created_at: new Date().toISOString() }
];

const MOCK_PROFILES: Profile[] = [
  { id: 'user-admin', full_name: 'ศิริชัย เลิศแอดมิน', role: 'admin', department_id: 'dept-general', phone: '081-234-5678', avatar_url: '', email: 'admin@school.go.th', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'user-director', full_name: 'ดร.สมชาย ใจดี', role: 'director', department_id: 'dept-general', phone: '089-876-5432', avatar_url: '', email: 'director@school.go.th', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'user-registrar', full_name: 'นภาพร เรียนรู้', role: 'registrar', department_id: 'dept-acad', phone: '086-543-2109', avatar_url: '', email: 'registrar@school.go.th', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'user-teacher', full_name: 'มนัส สอนดี', role: 'teacher', department_id: 'dept-acad', phone: '084-321-0987', avatar_url: '', email: 'teacher@school.go.th', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'user-staff', full_name: 'สมศรี จัดการเอกสาร', role: 'general_staff', department_id: 'dept-general', phone: '085-456-7890', avatar_url: '', email: 'staff@school.go.th', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

const MOCK_SCHOOL_SETTINGS: SchoolSettings = {
  name_th: 'โรงเรียนสมาร์ทวิทยา',
  name_en: 'Smart Wittaya School',
  code: '10100201',
  address: '123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร 10110',
  phone: '02-1234567',
  email: 'info@smartwittaya.ac.th',
  website: 'www.smartwittaya.ac.th',
  director_name: 'ดร.สมชาย ใจดี',
  academic_year: '2569',
  semester: '1'
};

const MOCK_DOCUMENTS: Document[] = [
  {
    id: 'doc-1',
    doc_no: 'ศธ ๐๔๐๐๒/๑๐๒๕',
    title: 'ขอความอนุเคราะห์ส่งบุคลากรเข้ารับการฝึกอบรมการใช้งานระบบสารบรรณอิเล็กทรอนิกส์',
    description: 'ฝึกอบรมความรู้แก่บุคลากรสายสนับสนุนงานสารบรรณ เพื่อการเปลี่ยนผ่านสู่สำนักงานดิจิทัล',
    category: 'incoming',
    priority: 'urgent',
    status: 'approved',
    sender: 'สำนักงานคณะกรรมการการศึกษาขั้นพื้นฐาน',
    receiver: 'ผู้อำนวยการโรงเรียนสมาร์ทวิทยา',
    doc_date: '2026-05-20',
    created_by: 'user-staff',
    created_at: '2026-05-22T08:30:00Z',
    updated_at: '2026-05-22T08:30:00Z'
  },
  {
    id: 'doc-2',
    doc_no: 'ศธ ๐๔๐๐๒/๒๕๓',
    title: 'แจ้งการจัดสรรงบประมาณโครงการพัฒนาทักษะดิจิทัลสำหรับนักเรียน ประจำปีงบประมาณ ๒๕๖๙',
    description: 'จัดสรรงบประมาณจำนวน 150,000 บาท เพื่อดำเนินการฝึกอบรมคอมพิวเตอร์และปัญญาประดิษฐ์เบื้องต้นให้กับนักเรียนช่วงชั้นที่ 3',
    category: 'incoming',
    priority: 'very_urgent',
    status: 'pending_approval',
    sender: 'สำนักงานเขตพื้นที่การศึกษามัธยมศึกษา',
    receiver: 'กลุ่มงานบริหารงบประมาณ',
    doc_date: '2026-06-01',
    created_by: 'user-staff',
    created_at: '2026-06-02T09:00:00Z',
    updated_at: '2026-06-02T09:00:00Z'
  },
  {
    id: 'doc-3',
    doc_no: 'รน.สว ๐๐๑/๒๕๖๙',
    title: 'ส่งรายงานผลการประเมินตนเองของสถานศึกษา (SAR) ประจำปีการศึกษา ๒๕๖๘',
    description: 'รายงานสรุปผลการบริหารจัดการเรียนการสอนและโครงการต่างๆ ในรอบปีการศึกษาที่ผ่านมา',
    category: 'outgoing',
    priority: 'normal',
    status: 'approved',
    sender: 'โรงเรียนสมาร์ทวิทยา',
    receiver: 'สำนักงานเขตพื้นที่การศึกษามัธยมศึกษา',
    doc_date: '2026-05-15',
    created_by: 'user-registrar',
    created_at: '2026-05-15T15:00:00Z',
    updated_at: '2026-05-15T15:00:00Z'
  },
  {
    id: 'doc-4',
    doc_no: 'รน.สว ๐๐๒/๒๕๖๙',
    title: 'คำสั่งโรงเรียนสมาร์ทวิทยา ที่ ๐๑๒/๒๕๖๙ เรื่อง แต่งตั้งคณะกรรมการดำเนินงานจัดกิจกรรมวันไหว้ครู',
    description: 'แต่งตั้งครูและบุคลากรทางการศึกษาปฏิบัติหน้าที่ในฝ่ายเตรียมงาน ฝ่ายพิธีการ และฝ่ายสวัสดิการ',
    category: 'circular',
    priority: 'urgent',
    status: 'approved',
    sender: 'กลุ่มงานบริหารทั่วไป',
    receiver: 'ข้าราชการครูและบุคลากรทางการศึกษาทุกท่าน',
    doc_date: '2026-05-28',
    created_by: 'user-admin',
    created_at: '2026-05-28T10:15:00Z',
    updated_at: '2026-05-28T10:15:00Z'
  },
  {
    id: 'doc-5',
    doc_no: 'รน.สว ๐๐๓/๒๕๖๙',
    title: 'ประกาศเรื่องการสวมใส่เครื่องแบบนักเรียนและกฎระเบียบวินัยสำหรับปีการศึกษาใหม่',
    description: 'ประชาสัมพันธ์แจ้งเตือนระเบียบวินัยการเข้าเรียน การแต่งกาย และทรงผมของนักเรียนตามฉบับปรับปรุงใหม่ปี 2569',
    category: 'circular',
    priority: 'normal',
    status: 'approved',
    sender: 'กลุ่มงานงานปกครองและกิจการนักเรียน',
    receiver: 'นักเรียน ผู้ปกครอง และครูที่ปรึกษาทุกห้องเรียน',
    doc_date: '2026-05-30',
    created_by: 'user-teacher',
    created_at: '2026-05-30T11:00:00Z',
    updated_at: '2026-05-30T11:00:00Z'
  }
];

const MOCK_STUDENTS: Student[] = [
  { id: 'std-1', student_id: '15001', first_name: 'กิตติศักดิ์', last_name: 'รักดี', class_level: 'ม.1', classroom: '1', status: 'active', guardian_name: 'สมชาย รักดี', guardian_phone: '081-111-1111', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'std-2', student_id: '15002', first_name: 'จิราพร', last_name: 'สุวรรณ', class_level: 'ม.1', classroom: '1', status: 'active', guardian_name: 'ประเสริถ สุวรรณ', guardian_phone: '082-222-2222', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'std-3', student_id: '15003', first_name: 'ณัฐพล', last_name: 'แสงจันทร์', class_level: 'ม.1', classroom: '2', status: 'active', guardian_name: 'ชูชาติ แสงจันทร์', guardian_phone: '083-333-3333', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'std-4', student_id: '14001', first_name: 'ธนารีย์', last_name: 'งามจิต', class_level: 'ม.3', classroom: '1', status: 'active', guardian_name: 'เพ็ญศรี งามจิต', guardian_phone: '084-444-4444', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'std-5', student_id: '14002', first_name: 'ปกรณ์', last_name: 'มีสุข', class_level: 'ม.3', classroom: '2', status: 'active', guardian_name: 'ประวิทย์ มีสุข', guardian_phone: '085-555-5555', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'std-6', student_id: '13001', first_name: 'วิภาวี', last_name: 'ดวงใจ', class_level: 'ม.4', classroom: '1', status: 'active', guardian_name: 'สายใจ ดวงใจ', guardian_phone: '086-666-6666', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'std-7', student_id: '11001', first_name: 'อนันต์', last_name: 'มั่นคง', class_level: 'ม.6', classroom: '1', status: 'active', guardian_name: 'สุรพล มั่นคง', guardian_phone: '087-777-7777', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'std-8', student_id: '11002', first_name: 'เบญจวรรณ', last_name: 'วิริยะ', class_level: 'ม.6', classroom: '2', status: 'active', guardian_name: 'สุนทร วิริยะ', guardian_phone: '088-888-8888', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

const MOCK_RECEIVERS: DocumentReceiver[] = [
  { id: 'rec-1', document_id: 'doc-4', profile_id: 'user-director', read_at: '2026-05-28T11:20:00Z', created_at: '2026-05-28T10:15:00Z' },
  { id: 'rec-2', document_id: 'doc-4', profile_id: 'user-registrar', read_at: '2026-05-28T13:45:00Z', created_at: '2026-05-28T10:15:00Z' }
];

// Helper to load or initialize LocalStorage
const getLocalStorage = <T>(key: string, initialData: T): T => {
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(initialData));
    return initialData;
  }
  return JSON.parse(data) as T;
};

const setLocalStorage = <T>(key: string, data: T): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Initialize Mock database
const initMockDB = () => {
  getLocalStorage('sso_departments', MOCK_DEPARTMENTS);
  getLocalStorage('sso_profiles', MOCK_PROFILES);
  getLocalStorage('sso_school_settings', MOCK_SCHOOL_SETTINGS);
  getLocalStorage('sso_documents', MOCK_DOCUMENTS);
  getLocalStorage('sso_students', MOCK_STUDENTS);
  getLocalStorage('sso_receivers', MOCK_RECEIVERS);
};

initMockDB();

// ==========================================
// DB API SERVICES (HYBRID APPROACH)
// ==========================================

export const authService = {
  async login(email: string, password?: string, roleForMock: UserRole = 'general_staff'): Promise<Profile> {
    if (isSupabaseBackend) {
      const { data: { user }, error } = await supabase.auth.signInWithPassword({
        email,
        password: password || 'password123'
      });
      if (error || !user) {
        const errorMessage = error?.message || 'Login failed';
        if (errorMessage.toLowerCase().includes('invalid login credentials')) {
          throw new Error(
            'Invalid login credentials. If this is a fresh Supabase project, run supabase/scratch/seed_demo_auth_users.mjs first or switch VITE_BACKEND_MODE=mock.'
          );
        }
        throw new Error(errorMessage);
      }
      try {
        const profile = await loadOrCreateSupabaseProfile(user);
        setStoredCurrentUser(profile);
        return profile;
      } catch (profileError) {
        clearStoredCurrentUser();
        await supabase.auth.signOut().catch(() => undefined);
        throw profileError instanceof Error
          ? profileError
          : new Error('User profile not found and could not be created automatically.');
      }
    } else {
      // Mock Login lookup by email or role
      const profiles = getLocalStorage<Profile[]>('sso_profiles', MOCK_PROFILES);
      
      // 1. Try direct email match first
      let profile = profiles.find(p => p.email === email);
      
      // 2. Fallback to role abbreviations
      if (!profile) {
        profile = profiles.find(p => {
          if (email.includes('admin') && p.role === 'admin') return true;
          if (email.includes('director') && p.role === 'director') return true;
          if (email.includes('registrar') && p.role === 'registrar') return true;
          if (email.includes('teacher') && p.role === 'teacher') return true;
          if (email.includes('staff') && p.role === 'general_staff') return true;
          return false;
        });
      }

      if (!profile) {
        // Find default or fallback
        profile = profiles.find(p => p.role === roleForMock) || profiles[4];
      }
      setStoredCurrentUser(profile);
      return profile;
    }
  },

  async logout(): Promise<void> {
    clearStoredCurrentUser();
    if (isSupabaseBackend) {
      try {
        await supabase.auth.signOut();
      } catch (error) {
        console.error('Failed to sign out from Supabase', error);
      }
    }
  },

  getCurrentUser(): Profile | null {
    return getStoredCurrentUser();
  },

  async restoreCurrentUser(): Promise<Profile | null> {
    if (!isSupabaseBackend) {
      return getStoredCurrentUser();
    }

    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (!session?.user?.id) {
      clearStoredCurrentUser();
      return null;
    }

    try {
      const profile = await loadOrCreateSupabaseProfile(session.user);
      setStoredCurrentUser(profile);
      return profile;
    } catch (error) {
      clearStoredCurrentUser();
      await supabase.auth.signOut().catch(() => undefined);
      console.error('Failed to restore Supabase session profile', error);
      return null;
    }
  },

  async changePassword(password: string): Promise<void> {
    if (isSupabaseBackend) {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
    } else {
      console.log('Mock Change Password to:', password);
    }
  }
};

export const docService = {
  async getDocs(category?: DocCategory): Promise<Document[]> {
    if (isSupabaseBackend) {
      let query = supabase.from('documents').select('*').order('created_at', { ascending: false });
      if (category) {
        query = query.eq('category', category);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as Document[];
    } else {
      const docs = getLocalStorage<Document[]>('sso_documents', MOCK_DOCUMENTS);
      let sorted = [...docs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      if (category) {
        sorted = sorted.filter(d => d.category === category);
      }
      return sorted;
    }
  },

  async createDoc(doc: Omit<Document, 'id' | 'created_at' | 'updated_at'>): Promise<Document> {
    const currentUser = authService.getCurrentUser();
    if (isSupabaseBackend) {
      const { data, error } = await supabase.from('documents').insert([{
        ...doc,
        created_by: currentUser?.id,
        updated_by: currentUser?.id
      }]).select().single();
      if (error) throw error;
      return data as Document;
    } else {
      const docs = getLocalStorage<Document[]>('sso_documents', MOCK_DOCUMENTS);
      const newDoc: Document = {
        ...doc,
        id: 'doc-' + generateUUID(),
        created_by: currentUser?.id || 'user-staff',
        updated_by: currentUser?.id || 'user-staff',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      docs.push(newDoc);
      setLocalStorage('sso_documents', docs);
      return newDoc;
    }
  },

  async updateDoc(id: string, updates: Partial<Omit<Document, 'id' | 'created_at' | 'updated_at'>>): Promise<Document> {
    const currentUser = authService.getCurrentUser();
    if (isSupabaseBackend) {
      const { data, error } = await supabase.from('documents').update({
        ...updates,
        updated_by: currentUser?.id
      }).eq('id', id).select().single();
      if (error) throw error;
      return data as Document;
    } else {
      const docs = getLocalStorage<Document[]>('sso_documents', MOCK_DOCUMENTS);
      const index = docs.findIndex(d => d.id === id);
      if (index === -1) throw new Error('Document not found');
      
      const updatedDoc: Document = {
        ...docs[index],
        ...updates,
        updated_by: currentUser?.id || 'user-staff',
        updated_at: new Date().toISOString()
      };
      docs[index] = updatedDoc;
      setLocalStorage('sso_documents', docs);
      return updatedDoc;
    }
  },

  async deleteDoc(id: string): Promise<void> {
    if (isSupabaseBackend) {
      const { error } = await supabase.from('documents').delete().eq('id', id);
      if (error) throw error;
    } else {
      const docs = getLocalStorage<Document[]>('sso_documents', MOCK_DOCUMENTS);
      const filtered = docs.filter(d => d.id !== id);
      setLocalStorage('sso_documents', filtered);
    }
  },

  async getCircularReads(docId: string): Promise<DocumentReceiver[]> {
    if (isSupabaseBackend) {
      const { data, error } = await supabase.from('document_receivers').select('*').eq('document_id', docId);
      if (error) throw error;
      return data as DocumentReceiver[];
    } else {
      const receivers = getLocalStorage<DocumentReceiver[]>('sso_receivers', MOCK_RECEIVERS);
      return receivers.filter(r => r.document_id === docId);
    }
  },

  async markCircularAsRead(docId: string): Promise<DocumentReceiver> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) throw new Error('Authentication required');
    
    if (isSupabaseBackend) {
      const { data, error } = await supabase.from('document_receivers').upsert({
        document_id: docId,
        profile_id: currentUser.id,
        read_at: new Date().toISOString()
      }, { onConflict: 'document_id,profile_id' }).select().single();
      if (error) throw error;
      return data as DocumentReceiver;
    } else {
      const receivers = getLocalStorage<DocumentReceiver[]>('sso_receivers', MOCK_RECEIVERS);
      const existingIndex = receivers.findIndex(r => r.document_id === docId && r.profile_id === currentUser.id);
      
      if (existingIndex !== -1) {
        if (!receivers[existingIndex].read_at) {
          receivers[existingIndex].read_at = new Date().toISOString();
        }
        setLocalStorage('sso_receivers', receivers);
        return receivers[existingIndex];
      } else {
        const newRecord: DocumentReceiver = {
          id: 'rec-' + generateUUID(),
          document_id: docId,
          profile_id: currentUser.id,
          read_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        };
        receivers.push(newRecord);
        setLocalStorage('sso_receivers', receivers);
        return newRecord;
      }
    }
  }
};

export const schoolService = {
  async getStaff(): Promise<Profile[]> {
    if (isSupabaseBackend) {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: true });
      if (error) throw error;
      return data as Profile[];
    } else {
      return getLocalStorage<Profile[]>('sso_profiles', MOCK_PROFILES);
    }
  },

  async createStaff(staff: Omit<Profile, 'id' | 'created_at' | 'updated_at'>): Promise<Profile> {
    if (isSupabaseBackend) {
      const tempClient = createTempClient();
      const { data, error } = await tempClient.auth.signUp({
        email: staff.email || '',
        password: 'password123', // Initial temporary password
        options: {
          data: {
            full_name: staff.full_name,
            role: staff.role,
            phone: staff.phone
          }
        }
      });
      if (error) throw error;
      if (!data.user) throw new Error('Failed to create auth user');

      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({ department_id: staff.department_id })
        .eq('id', data.user.id)
        .select()
        .single();

      if (updateError) throw updateError;
      return updatedProfile as Profile;
    } else {
      const profiles = getLocalStorage<Profile[]>('sso_profiles', MOCK_PROFILES);
      const newStaff: Profile = {
        ...staff,
        id: 'user-' + generateUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      profiles.push(newStaff);
      setLocalStorage('sso_profiles', profiles);
      return newStaff;
    }
  },

  async updateStaff(id: string, updates: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>): Promise<Profile> {
    if (isSupabaseBackend) {
      const { data, error } = await supabase.from('profiles').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data as Profile;
    } else {
      const profiles = getLocalStorage<Profile[]>('sso_profiles', MOCK_PROFILES);
      const index = profiles.findIndex(p => p.id === id);
      if (index === -1) throw new Error('Staff profile not found');
      
      const updatedProfile: Profile = {
        ...profiles[index],
        ...updates,
        updated_at: new Date().toISOString()
      };
      profiles[index] = updatedProfile;
      setLocalStorage('sso_profiles', profiles);
      return updatedProfile;
    }
  },

  async deleteStaff(id: string): Promise<void> {
    if (isSupabaseBackend) {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) throw error;
    } else {
      const profiles = getLocalStorage<Profile[]>('sso_profiles', MOCK_PROFILES);
      const filtered = profiles.filter(p => p.id !== id);
      setLocalStorage('sso_profiles', filtered);
    }
  },

  async getStudents(): Promise<Student[]> {
    if (isSupabaseBackend) {
      const { data, error } = await supabase.from('students').select('*').order('student_id', { ascending: true });
      if (error) throw error;
      return data as Student[];
    } else {
      return getLocalStorage<Student[]>('sso_students', MOCK_STUDENTS);
    }
  },

  async createStudent(student: Omit<Student, 'id' | 'created_at' | 'updated_at'>): Promise<Student> {
    if (isSupabaseBackend) {
      const { data, error } = await supabase.from('students').insert([student]).select().single();
      if (error) throw error;
      return data as Student;
    } else {
      const students = getLocalStorage<Student[]>('sso_students', MOCK_STUDENTS);
      const newStudent: Student = {
        ...student,
        id: 'std-' + generateUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      students.push(newStudent);
      setLocalStorage('sso_students', students);
      return newStudent;
    }
  },

  async updateStudent(id: string, updates: Partial<Omit<Student, 'id' | 'created_at' | 'updated_at'>>): Promise<Student> {
    if (isSupabaseBackend) {
      const { data, error } = await supabase.from('students').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data as Student;
    } else {
      const students = getLocalStorage<Student[]>('sso_students', MOCK_STUDENTS);
      const index = students.findIndex(s => s.id === id);
      if (index === -1) throw new Error('Student not found');
      
      const updatedStudent: Student = {
        ...students[index],
        ...updates,
        updated_at: new Date().toISOString()
      };
      students[index] = updatedStudent;
      setLocalStorage('sso_students', students);
      return updatedStudent;
    }
  },

  async deleteStudent(id: string): Promise<void> {
    if (isSupabaseBackend) {
      const { error } = await supabase.from('students').delete().eq('id', id);
      if (error) throw error;
    } else {
      const students = getLocalStorage<Student[]>('sso_students', MOCK_STUDENTS);
      const filtered = students.filter(s => s.id !== id);
      setLocalStorage('sso_students', filtered);
    }
  }
};

export const settingsService = {
  async getSettings(): Promise<SchoolSettings> {
    if (isSupabaseBackend) {
      const { data, error } = await supabase.from('school_settings').select('*').eq('key', 'school_profile').single();
      if (error) throw error;
      return data.value as SchoolSettings;
    } else {
      return getLocalStorage<SchoolSettings>('sso_school_settings', MOCK_SCHOOL_SETTINGS);
    }
  },

  async updateSettings(settings: SchoolSettings): Promise<SchoolSettings> {
    if (isSupabaseBackend) {
      const { data, error } = await supabase.from('school_settings').upsert({
        key: 'school_profile',
        value: settings
      }).select().single();
      if (error) throw error;
      return data.value as SchoolSettings;
    } else {
      setLocalStorage('sso_school_settings', settings);
      return settings;
    }
  },

  async getDepartments(): Promise<Department[]> {
    if (isSupabaseBackend) {
      const { data, error } = await supabase.from('departments').select('*').order('code', { ascending: true });
      if (error) throw error;
      return data as Department[];
    } else {
      return getLocalStorage<Department[]>('sso_departments', MOCK_DEPARTMENTS);
    }
  }
};
