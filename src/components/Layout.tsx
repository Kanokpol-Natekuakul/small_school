import React, { useState } from 'react';
import type { Profile } from '../types';
import { authService } from '../lib/db';
import {
  LayoutDashboard,
  FileDown,
  FileUp,
  FileText,
  Users,
  GraduationCap,
  Settings,
  LogOut,
  Menu,
  X,
  Calendar,
  ChevronRight
} from 'lucide-react';

interface LayoutProps {
  currentUser: Profile;
  onLogout: () => void;
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  academicYear: string;
  children?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  currentUser,
  onLogout,
  currentTab,
  setCurrentTab,
  academicYear,
  children
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = [
    { id: 'dashboard', label: 'หน้าแรก / แดชบอร์ด', icon: LayoutDashboard, roles: ['admin', 'director', 'registrar', 'teacher', 'general_staff'] },
    { id: 'incoming', label: 'ทะเบียนหนังสือรับ', icon: FileDown, roles: ['admin', 'director', 'registrar', 'general_staff'] },
    { id: 'outgoing', label: 'ทะเบียนหนังสือส่ง', icon: FileUp, roles: ['admin', 'director', 'registrar', 'general_staff'] },
    { id: 'circular', label: 'หนังสือเวียน / ประกาศ', icon: FileText, roles: ['admin', 'director', 'registrar', 'teacher', 'general_staff'] },
    { id: 'staff', label: 'ทำเนียบบุคลากร', icon: Users, roles: ['admin', 'director', 'registrar', 'teacher', 'general_staff'] },
    { id: 'students', label: 'ทะเบียนนักเรียน', icon: GraduationCap, roles: ['admin', 'registrar', 'teacher'] },
    { id: 'settings', label: 'ตั้งค่าโรงเรียน', icon: Settings, roles: ['admin', 'director'] },
  ];

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: 'ผู้ดูแลระบบ (Admin)',
      director: 'ผู้อำนวยการ (Director)',
      registrar: 'นายทะเบียน (Registrar)',
      teacher: 'ครูผู้สอน (Teacher)',
      general_staff: 'เจ้าหน้าที่ทั่วไป (Staff)',
    };
    return labels[role] || role;
  };

  const handleNavClick = (tabId: string) => {
    setCurrentTab(tabId);
    setIsMobileMenuOpen(false);
  };

  const allowedNavItems = navigationItems.filter(item => item.roles.includes(currentUser.role));

  return (
    <div className="h-screen bg-slate-50 flex flex-col md:flex-row font-sans overflow-hidden">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-slate-900 text-white border-b border-slate-800 shadow-sm sticky top-0 shrink-0 z-20">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-emerald-400" />
          <span className="font-bold text-base tracking-wide">Smart School Office</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-1 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white"
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </header>

      {/* Mobile Sidebar Backdrop */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar - Desktop & Mobile Menu */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 bg-slate-900 text-slate-300 w-68 shrink-0 flex flex-col border-r border-slate-800 shadow-xl transition-all duration-300 md:translate-x-0 md:static md:h-screen
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Brand Logo & Close Button */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-950/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-bold text-white text-sm tracking-wide leading-tight">Smart School Office</h1>
              <span className="text-[10px] bg-slate-800 text-emerald-400 font-semibold px-2 py-0.5 rounded-full mt-1 inline-block">V.2.0</span>
            </div>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto space-y-1">
          {allowedNavItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`
                  w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all group cursor-pointer
                  ${isActive 
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/10' 
                    : 'hover:bg-slate-800 hover:text-white text-slate-400'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-slate-950' : 'text-slate-400 group-hover:text-emerald-400 transition-colors'}`} />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="h-4 w-4" />}
              </button>
            );
          })}
        </nav>

        {/* User Profile Area */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white text-sm uppercase ring-2 ring-emerald-500/20">
              {currentUser.full_name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-white text-xs truncate leading-normal">{currentUser.full_name}</p>
              <p className="text-xs text-slate-400 truncate leading-normal mt-0.5">{getRoleLabel(currentUser.role)}</p>
            </div>
          </div>

          <button
            onClick={() => {
              authService.logout();
              onLogout();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-800 hover:bg-rose-500/15 hover:text-rose-400 text-slate-300 font-medium text-xs rounded-xl border border-slate-700 hover:border-rose-500/30 transition-all cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {/* Desktop Topbar */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 bg-white border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2 text-slate-800">
            <h2 className="text-lg font-bold">
              {navigationItems.find(item => item.id === currentTab)?.label || 'ระบบงาน'}
            </h2>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 text-xs font-semibold">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <span>ปีการศึกษา {academicYear}</span>
            </div>
          </div>
        </header>

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/50">
          <div className="max-w-6xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
