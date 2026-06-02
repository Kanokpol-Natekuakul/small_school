import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { authService } from '../../lib/db';
import type { UserRole } from '../../types';
import { LogIn, Key, Mail, ShieldAlert, GraduationCap } from 'lucide-react';

const loginSchema = zod.object({
  email: zod.string().email('กรุณากรอกอีเมลที่ถูกต้อง'),
  password: zod.string().min(6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'),
});

type LoginFormInput = zod.infer<typeof loginSchema>;

interface LoginProps {
  onLoginSuccess: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<LoginFormInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    }
  });

  const handleLogin = async (data: LoginFormInput) => {
    setIsLoading(true);
    setError(null);
    try {
      await authService.login(data.email, data.password);
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Login Assist
  const handleQuickLogin = (role: UserRole) => {
    const emailMap: Record<UserRole, string> = {
      admin: 'admin@school.go.th',
      director: 'director@school.go.th',
      registrar: 'registrar@school.go.th',
      teacher: 'teacher@school.go.th',
      general_staff: 'staff@school.go.th',
    };
    setValue('email', emailMap[role]);
    setValue('password', 'password123');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-emerald-100/40 via-sky-50 to-indigo-100/40 p-4 relative overflow-hidden font-sans">
      {/* Background ambient glowing mesh */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-300/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-300/20 rounded-full blur-[100px]" />

      <div className="w-full max-w-md bg-white/70 backdrop-blur-xl p-8 rounded-3xl shadow-xl shadow-indigo-950/5 relative z-10 border border-white/60 flex flex-col items-center">
        
        {/* Header/Logo */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 mb-3 text-emerald-600 shadow-inner">
            <GraduationCap className="h-10 w-10 animate-bounce-subtle" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight leading-none mb-1">
            Smart School Office
          </h1>
          <span className="text-[10px] bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            Version 2.0
          </span>
          <p className="text-slate-500 text-xs mt-2.5 font-light leading-relaxed">
            ระบบบริหารจัดการโรงเรียนและงานสารบรรณยุคใหม่
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="w-full mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-rose-600 text-xs font-semibold">
            <ShieldAlert className="h-4 w-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit(handleLogin)} className="w-full space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 pl-0.5">
              อีเมลผู้ใช้งาน (Email)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <Mail className="h-4.5 w-4.5" />
              </span>
              <input
                type="email"
                placeholder="email@school.go.th"
                {...register('email')}
                className="w-full pl-10 pr-4 py-3 bg-white/60 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all text-xs"
              />
            </div>
            {errors.email && (
              <p className="text-rose-500 text-xs mt-1 pl-0.5 font-light">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 pl-0.5">
              รหัสผ่าน (Password)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <Key className="h-4.5 w-4.5" />
              </span>
              <input
                type="password"
                placeholder="••••••••"
                {...register('password')}
                className="w-full pl-10 pr-4 py-3 bg-white/60 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all text-xs"
              />
            </div>
            {errors.password && (
              <p className="text-rose-500 text-xs mt-1 pl-0.5 font-light">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 flex items-center justify-center gap-2 text-xs mt-6 disabled:opacity-50"
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                เข้าสู่ระบบ
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="w-full flex items-center gap-3 my-6">
          <div className="h-px bg-slate-200 grow" />
          <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">เข้าสู่ระบบด่วน (Quick Test)</span>
          <div className="h-px bg-slate-200 grow" />
        </div>

        {/* Quick select buttons */}
        <div className="w-full grid grid-cols-2 gap-2">
          <button
            onClick={() => handleQuickLogin('admin')}
            className="px-3.5 py-2 bg-slate-50/50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 rounded-xl text-slate-700 text-xs transition-all text-left flex flex-col justify-between cursor-pointer"
          >
            <span className="font-bold text-slate-800">แอดมิน</span>
            <span className="text-[9px] text-slate-400 mt-0.5">Sirichai Admin</span>
          </button>
          <button
            onClick={() => handleQuickLogin('director')}
            className="px-3.5 py-2 bg-slate-50/50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-xl text-slate-700 text-xs transition-all text-left flex flex-col justify-between cursor-pointer"
          >
            <span className="font-bold text-slate-800">ผู้อำนวยการ</span>
            <span className="text-[9px] text-slate-400 mt-0.5">Dr. Somchai</span>
          </button>
          <button
            onClick={() => handleQuickLogin('registrar')}
            className="px-3.5 py-2 bg-slate-50/50 hover:bg-purple-50 border border-slate-200 hover:border-purple-200 rounded-xl text-slate-700 text-xs transition-all text-left flex flex-col justify-between cursor-pointer"
          >
            <span className="font-bold text-slate-800">งานทะเบียน</span>
            <span className="text-[9px] text-slate-400 mt-0.5">Napaporn</span>
          </button>
          <button
            onClick={() => handleQuickLogin('teacher')}
            className="px-3.5 py-2 bg-slate-50/50 hover:bg-amber-50 border border-slate-200 hover:border-amber-200 rounded-xl text-slate-700 text-xs transition-all text-left flex flex-col justify-between cursor-pointer"
          >
            <span className="font-bold text-slate-800">อาจารย์ผู้สอน</span>
            <span className="text-[9px] text-slate-400 mt-0.5">Manas</span>
          </button>
        </div>
      </div>
    </div>
  );
};
