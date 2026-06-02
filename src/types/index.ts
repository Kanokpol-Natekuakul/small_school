// TypeScript Interfaces for Smart School Office V.2

export type UserRole = 'admin' | 'director' | 'registrar' | 'teacher' | 'general_staff';
export type DocCategory = 'incoming' | 'outgoing' | 'circular';
export type DocPriority = 'normal' | 'urgent' | 'very_urgent';
export type DocStatus = 'draft' | 'pending_approval' | 'approved' | 'archived';
export type StudentStatus = 'active' | 'suspended' | 'graduated' | 'transferred';

export interface Department {
  id: string;
  code: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  department_id?: string;
  phone?: string;
  avatar_url?: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  doc_no: string;
  title: string;
  description?: string;
  category: DocCategory;
  priority: DocPriority;
  status: DocStatus;
  sender: string;
  receiver: string;
  file_path?: string;
  created_by?: string;
  updated_by?: string;
  doc_date: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentReceiver {
  id: string;
  document_id: string;
  profile_id: string;
  read_at?: string;
  created_at: string;
}

export interface Student {
  id: string;
  student_id: string;
  first_name: string;
  last_name: string;
  class_level: string;
  classroom: string;
  status: StudentStatus;
  guardian_name?: string;
  guardian_phone?: string;
  created_at: string;
  updated_at: string;
}

export interface SchoolSettings {
  name_th: string;
  name_en: string;
  code: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  director_name: string;
  academic_year: string;
  semester: string;
}
