import React, { useEffect, useState } from 'react';
import { settingsService, authService } from '../../lib/db';
import { backendMode, backendModeLabel, hasSupabaseConfig, isSupabaseBackend } from '../../lib/supabase';
import type { Profile } from '../../types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import {
  Settings,
  Building,
  Save,
  CheckCircle,
  Database,
  Info,
  Lock
} from 'lucide-react';

const settingsSchema = zod.object({
  name_th: zod.string().min(1, 'กรุณากรอกชื่อโรงเรียน (ภาษาไทย)'),
  name_en: zod.string().min(1, 'กรุณากรอกชื่อโรงเรียน (ภาษาอังกฤษ)'),
  code: zod.string().min(1, 'กรุณากรอกรหัสโรงเรียน'),
  address: zod.string().min(1, 'กรุณากรอกที่อยู่โรงเรียน'),
  phone: zod.string().min(1, 'กรุณากรอกเบอร์โทรศัพท์'),
  email: zod.string().email('กรุณากรอกอีเมลที่ถูกต้อง'),
  website: zod.string().min(1, 'กรุณากรอกเว็บไซต์'),
  director_name: zod.string().min(1, 'กรุณากรอกชื่อผู้อำนวยการ'),
  academic_year: zod.string().min(1, 'กรุณากรอกปีการศึกษา'),
  semester: zod.string().min(1, 'กรุณากรอกภาคเรียน'),
});

type SettingsFormInput = zod.infer<typeof settingsSchema>;

const passwordSchema = zod.object({
  password: zod.string().min(6, 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร'),
  confirmPassword: zod.string().min(1, 'กรุณายืนยันรหัสผ่านใหม่')
}).refine((data) => data.password === data.confirmPassword, {
  message: "รหัสผ่านไม่ตรงกัน",
  path: ["confirmPassword"]
});

type PasswordFormInput = zod.infer<typeof passwordSchema>;

interface SettingsProps {
  currentUser: Profile;
  onSettingsUpdated: (newYear: string) => void;
}

export const SettingsPage: React.FC<SettingsProps> = ({ currentUser, onSettingsUpdated }) => {
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isEditable = currentUser.role === 'admin' || currentUser.role === 'director';
  const backendStatusTone = isSupabaseBackend
    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
    : backendMode === 'supabase'
      ? 'bg-rose-50 border-rose-200 text-rose-700'
      : 'bg-amber-50 border-amber-200 text-amber-700';
  const backendStatusCopy = isSupabaseBackend
    ? 'โหมด Supabase ถูกใช้งานสำหรับ auth และข้อมูลทั้งหมด'
    : backendMode === 'supabase'
      ? 'ตั้งค่า Supabase mode แล้ว แต่ยังขาด env ที่จำเป็น'
      : backendMode === 'auto'
        ? 'โหมด auto กำลังใช้ฐานข้อมูลจำลองในเครื่อง'
        : 'กำลังใช้งานฐานข้อมูลจำลองในเครื่อง';

  const { register, handleSubmit, reset, formState: { errors } } = useForm<SettingsFormInput>({
    resolver: zodResolver(settingsSchema),
  });

  const [pwdSuccess, setPwdSuccess] = useState<string | null>(null);
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [isPwdSubmitting, setIsPwdSubmitting] = useState(false);

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPassword,
    formState: { errors: passwordErrors }
  } = useForm<PasswordFormInput>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: '',
      confirmPassword: ''
    }
  });

  const onPasswordSubmit = async (data: PasswordFormInput) => {
    try {
      setIsPwdSubmitting(true);
      setPwdSuccess(null);
      setPwdError(null);
      await authService.changePassword(data.password);
      setPwdSuccess('เปลี่ยนรหัสผ่านเสร็จสิ้น!');
      resetPassword();
      setTimeout(() => {
        setPwdSuccess(null);
      }, 3000);
    } catch (err: any) {
      console.error(err);
      setPwdError(err.message || 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน');
    } finally {
      setIsPwdSubmitting(false);
    }
  };

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const data = await settingsService.getSettings();
      reset(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const onSubmit = async (data: SettingsFormInput) => {
    try {
      setSuccessMsg(null);
      await settingsService.updateSettings(data);
      setSuccessMsg('บันทึกข้อมูลตั้งค่าโรงเรียนเสร็จสิ้น!');
      onSettingsUpdated(data.academic_year);
      
      setTimeout(() => {
        setSuccessMsg(null);
      }, 3000);
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-500 text-sm font-medium">กำลังโหลดข้อมูลตั้งค่าระบบ...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-slate-800 text-xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6 text-emerald-500" />
          ตั้งค่าระบบและข้อมูลโรงเรียน (School Configurations)
        </h2>
        <p className="text-slate-500 text-xs mt-1">ตั้งค่าชื่อสถานศึกษา ข้อมูลติดต่อ ปีการศึกษาปัจจุบัน และตรวจสอบสถานะฐานข้อมูล</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start">
        
        {/* Settings Form Card */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
          <h3 className="font-bold text-slate-800 text-base pb-3 border-b border-slate-100 flex items-center gap-2 mb-6">
            <Building className="h-4.5 w-4.5 text-slate-400" />
            ข้อมูลประวัติสถานศึกษา
          </h3>

          {successMsg && (
            <div className="mb-6 p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl flex items-center gap-2 text-emerald-700 text-xs font-semibold">
              <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-600 mb-1.5 pl-0.5">ชื่อสถานศึกษา (ภาษาไทย) *</label>
                <input
                  type="text"
                  disabled={!isEditable}
                  {...register('name_th')}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-xs disabled:bg-slate-50 disabled:text-slate-400"
                />
                {errors.name_th && <p className="text-rose-500 text-[10px] mt-1">{errors.name_th.message}</p>}
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1.5 pl-0.5">ชื่อสถานศึกษา (ภาษาอังกฤษ) *</label>
                <input
                  type="text"
                  disabled={!isEditable}
                  {...register('name_en')}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-xs disabled:bg-slate-50 disabled:text-slate-400"
                />
                {errors.name_en && <p className="text-rose-500 text-[10px] mt-1">{errors.name_en.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <label className="block font-semibold text-slate-600 mb-1.5 pl-0.5">รหัสโรงเรียน (SMIS) *</label>
                <input
                  type="text"
                  disabled={!isEditable}
                  {...register('code')}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-xs disabled:bg-slate-50 disabled:text-slate-400"
                />
                {errors.code && <p className="text-rose-500 text-[10px] mt-1">{errors.code.message}</p>}
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1.5 pl-0.5">ปีการศึกษาปัจจุบัน *</label>
                <input
                  type="text"
                  disabled={!isEditable}
                  {...register('academic_year')}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-xs disabled:bg-slate-50 disabled:text-slate-400"
                />
                {errors.academic_year && <p className="text-rose-500 text-[10px] mt-1">{errors.academic_year.message}</p>}
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1.5 pl-0.5">ภาคเรียนปัจจุบัน *</label>
                <input
                  type="text"
                  disabled={!isEditable}
                  {...register('semester')}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-xs disabled:bg-slate-50 disabled:text-slate-400"
                />
                {errors.semester && <p className="text-rose-500 text-[10px] mt-1">{errors.semester.message}</p>}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1.5 pl-0.5">ชื่อผู้อำนวยการสถานศึกษา *</label>
              <input
                type="text"
                disabled={!isEditable}
                {...register('director_name')}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-xs disabled:bg-slate-50 disabled:text-slate-400"
              />
              {errors.director_name && <p className="text-rose-500 text-[10px] mt-1">{errors.director_name.message}</p>}
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1.5 pl-0.5">ที่อยู่อย่างเป็นทางการ *</label>
              <textarea
                rows={3}
                disabled={!isEditable}
                {...register('address')}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-xs resize-none disabled:bg-slate-50 disabled:text-slate-400"
              />
              {errors.address && <p className="text-rose-500 text-[10px] mt-1">{errors.address.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-600 mb-1.5 pl-0.5">เบอร์โทรศัพท์ติดต่อ *</label>
                <input
                  type="text"
                  disabled={!isEditable}
                  {...register('phone')}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-xs disabled:bg-slate-50 disabled:text-slate-400"
                />
                {errors.phone && <p className="text-rose-500 text-[10px] mt-1">{errors.phone.message}</p>}
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1.5 pl-0.5">อีเมลกลาง *</label>
                <input
                  type="email"
                  disabled={!isEditable}
                  {...register('email')}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-xs disabled:bg-slate-50 disabled:text-slate-400"
                />
                {errors.email && <p className="text-rose-500 text-[10px] mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1.5 pl-0.5">เว็บไซต์ทางการ *</label>
                <input
                  type="text"
                  disabled={!isEditable}
                  {...register('website')}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-xs disabled:bg-slate-50 disabled:text-slate-400"
                />
                {errors.website && <p className="text-rose-500 text-[10px] mt-1">{errors.website.message}</p>}
              </div>
            </div>

            {isEditable && (
              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl transition-all shadow-md shadow-emerald-500/10 flex items-center gap-2 cursor-pointer"
                >
                  <Save className="h-4 w-4" />
                  <span>บันทึกการตั้งค่า</span>
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Database Status Card & User Credentials */}
        <div className="space-y-6">
          {/* Change Password Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-800 text-sm pb-3 border-b border-slate-100 flex items-center gap-2">
              <Lock className="h-4.5 w-4.5 text-slate-400" />
              เปลี่ยนรหัสผ่านบัญชีผู้ใช้
            </h3>

            {pwdSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-emerald-700 text-[10px] font-semibold">
                <CheckCircle className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                <span>{pwdSuccess}</span>
              </div>
            )}

            {pwdError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-rose-700 text-[10px] font-semibold">
                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full shrink-0" />
                <span>{pwdError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitPassword(onPasswordSubmit)} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1.5 pl-0.5">รหัสผ่านใหม่ *</label>
                <input
                  type="password"
                  placeholder="อย่างน้อย 6 ตัวอักษร"
                  {...registerPassword('password')}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-xs"
                />
                {passwordErrors.password && <p className="text-rose-500 text-[10px] mt-1">{passwordErrors.password.message}</p>}
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1.5 pl-0.5">ยืนยันรหัสผ่านใหม่ *</label>
                <input
                  type="password"
                  placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                  {...registerPassword('confirmPassword')}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-xs"
                />
                {passwordErrors.confirmPassword && <p className="text-rose-500 text-[10px] mt-1">{passwordErrors.confirmPassword.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isPwdSubmitting}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:bg-slate-400"
              >
                {isPwdSubmitting ? 'กำลังบันทึก...' : 'เปลี่ยนรหัสผ่าน'}
              </button>
            </form>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-800 text-sm pb-3 border-b border-slate-100 flex items-center gap-2">
              <Database className="h-4.5 w-4.5 text-slate-400" />
              สถานะการเชื่อมต่อฐานข้อมูล
            </h3>

            <div className={`p-4 border rounded-2xl space-y-2 ${backendStatusTone}`}>
              <div className="flex items-center gap-2 font-bold text-xs">
                <span className={`w-2.5 h-2.5 rounded-full ${isSupabaseBackend ? 'bg-emerald-500 animate-pulse' : backendMode === 'supabase' ? 'bg-rose-500' : 'bg-amber-400'}`} />
                <span>{backendModeLabel}</span>
              </div>
              <p className="text-[10px] leading-relaxed font-light">
                {backendStatusCopy}
              </p>
              <p className="text-[10px] leading-relaxed font-semibold">
                Supabase env: {hasSupabaseConfig ? 'ready' : 'missing'}
              </p>
            </div>

            {hasSupabaseConfig ? (
              <div className="hidden p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                  <span>เชื่อมต่อกับ Supabase สำเร็จ</span>
                </div>
                <p className="text-[10px] text-emerald-600 leading-relaxed font-light">
                  ระบบกำลังบันทึกข้อมูลและดึงข้อมูลจาก Cloud Database ของ Supabase โดยตรงในแบบ Real-time
                </p>
              </div>
            ) : (
              <div className="hidden p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-amber-700 font-bold text-xs">
                  <span className="w-2.5 h-2.5 bg-amber-400 rounded-full" />
                  <span>ใช้งานในโหมดจำลอง (Mock DB)</span>
                </div>
                <p className="text-[10px] text-amber-600 leading-relaxed font-light">
                  ข้อมูลที่บันทึกใหม่จะถูกเก็บไว้ในพื้นที่เบราว์เซอร์ (LocalStorage) ของคุณ และพร้อมสลับไปใช้ Supabase จริงทันทีเมื่อกรอก credentials ในไฟล์ `.env.local`
                </p>
              </div>
            )}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xs text-white space-y-3">
            <h4 className="font-bold text-xs flex items-center gap-1.5 text-emerald-400">
              <Info className="h-4 w-4" />
              วิธีตั้งค่าเชื่อมต่อฐานข้อมูลจริง
            </h4>
            <ol className="list-decimal pl-4 text-[10px] text-slate-400 space-y-2 font-light">
              <li>สร้างโปรเจกต์ใหม่บนเว็บไซต์ Supabase</li>
              <li>คัดลอกไฟล์ SQL ในโฟลเดอร์ <code className="text-emerald-300 font-mono text-[9px] bg-slate-800 px-1 py-0.5 rounded">supabase/install.sql</code> ไปรันใน SQL Editor</li>
              <li>ถ้าโปรเจกต์มีอยู่แล้วและต้องการแก้ล็อกอินอย่างเดียว ให้รัน <code className="text-emerald-300 font-mono text-[9px] bg-slate-800 px-1 py-0.5 rounded">supabase/scratch/fix_supabase_profiles.sql</code> หนึ่งครั้งก่อน</li>
              <li>สร้างบัญชี auth ใน Supabase Dashboard ได้เลย; พอล็อกอินครั้งแรก ระบบจะสร้างแถวใน <code className="text-emerald-300 font-mono text-[9px] bg-slate-800 px-1 py-0.5 rounded">public.profiles</code> ให้อัตโนมัติถ้ายังไม่มี</li>
              <li>ถ้าต้องการบัญชีเดโมครบชุดให้รัน <code className="text-emerald-300 font-mono text-[9px] bg-slate-800 px-1 py-0.5 rounded">supabase/scratch/seed_demo_auth_users.mjs</code> จากเครื่องที่มี service role key</li>
              <li>สร้างไฟล์ใหม่ชื่อ <code className="text-emerald-300 font-mono text-[9px] bg-slate-800 px-1 py-0.5 rounded">.env.local</code> ไว้ที่โฟลเดอร์หลักของโปรเจกต์นี้</li>
              <li>กำหนดค่าตัวแปร:
                <pre className="mt-1 bg-slate-950 p-2 rounded text-[8px] font-mono text-slate-300 select-all block leading-normal">
{`VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_BACKEND_MODE=auto`}
                </pre>
              </li>
              <li>บันทึกไฟล์และรันคำสั่ง <code className="text-emerald-300 font-mono text-[9px] bg-slate-800 px-1 py-0.5 rounded">npm run dev</code> ใหม่อีกครั้ง</li>
            </ol>
          </div>
        </div>

      </div>
    </div>
  );
};
