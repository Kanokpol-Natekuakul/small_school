import React, { useEffect, useState } from 'react';
import { docService, schoolService } from '../../lib/db';
import type { Document, Profile } from '../../types';
import {
  FileDown,
  FileUp,
  FileText,
  Users,
  GraduationCap,
  Clock,
  CheckCircle,
  ArrowUpRight
} from 'lucide-react';

interface DashboardProps {
  currentUser: Profile;
  setCurrentTab: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ currentUser, setCurrentTab }) => {
  const [stats, setStats] = useState({
    incomingCount: 0,
    outgoingCount: 0,
    circularCount: 0,
    studentsCount: 0,
    staffCount: 0,
    pendingDocs: 0,
  });
  const [recentUrgentDocs, setRecentUrgentDocs] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        const [docs, students, staff] = await Promise.all([
          docService.getDocs(),
          schoolService.getStudents(),
          schoolService.getStaff(),
        ]);

        const incoming = docs.filter(d => d.category === 'incoming');
        const outgoing = docs.filter(d => d.category === 'outgoing');
        const circular = docs.filter(d => d.category === 'circular');
        const pending = docs.filter(d => d.status === 'pending_approval');
        const urgent = docs.filter(d => d.priority === 'urgent' || d.priority === 'very_urgent');

        setStats({
          incomingCount: incoming.length,
          outgoingCount: outgoing.length,
          circularCount: circular.length,
          studentsCount: students.length,
          staffCount: staff.length,
          pendingDocs: pending.length,
        });

        setRecentUrgentDocs(urgent.slice(0, 3));
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-500 text-sm font-medium">กำลังโหลดข้อมูลภาพรวม...</p>
      </div>
    );
  }

  const statCards = [
    { label: 'หนังสือรับทั้งหมด', count: stats.incomingCount, icon: FileDown, color: 'text-blue-500 bg-blue-50 border-blue-100', tab: 'incoming' },
    { label: 'หนังสือส่งทั้งหมด', count: stats.outgoingCount, icon: FileUp, color: 'text-violet-500 bg-violet-50 border-violet-100', tab: 'outgoing' },
    { label: 'ประกาศ/หนังสือเวียน', count: stats.circularCount, icon: FileText, color: 'text-emerald-500 bg-emerald-50 border-emerald-100', tab: 'circular' },
    { label: 'จำนวนนักเรียนทั้งหมด', count: stats.studentsCount, icon: GraduationCap, color: 'text-amber-500 bg-amber-50 border-amber-100', tab: 'students' },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-950 p-6 md:p-8 rounded-3xl border border-white/5 shadow-xl">
        <div className="absolute top-[-50%] right-[-20%] w-[50%] h-[150%] bg-emerald-500/10 rounded-full blur-[80px]" />
        <div className="relative z-10 space-y-2">
          <span className="text-emerald-400 text-xs font-bold tracking-wider uppercase bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
            สถิติระบบสารบรรณและข้อมูลโรงเรียน
          </span>
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            สวัสดีครับ, คุณ{currentUser.full_name} 👋
          </h2>
          <p className="text-slate-400 text-sm md:text-base max-w-xl font-light">
            ยินดีต้อนรับสู่ระบบงานสารบรรณ Smart School Office V.2 ระบบลงรับเอกสารและติดตามผลงานฝ่ายจัดการศึกษา
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <button
              key={idx}
              onClick={() => setCurrentTab(card.tab)}
              className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs text-left group hover:shadow-md hover:border-slate-300 transition-all duration-300 cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center justify-between w-full">
                <div className={`p-2.5 rounded-xl border ${card.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div className="mt-4">
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{card.label}</p>
                <p className="text-2xl md:text-3xl font-extrabold text-slate-800 mt-1 leading-none">
                  {card.count}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Grid: Urgent Docs vs Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        
        {/* Urgent/Pending Action Docs */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-rose-50 border border-rose-100 text-rose-500 rounded-lg">
                  <Clock className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-slate-800 text-base">หนังสือเร่งด่วน / รอสั่งการ</h3>
              </div>
              {stats.pendingDocs > 0 && (
                <span className="text-xs bg-rose-500 text-white font-semibold px-2 py-0.5 rounded-full animate-pulse">
                  {stats.pendingDocs} รายการใหม่
                </span>
              )}
            </div>

            <div className="mt-4 space-y-3.5">
              {recentUrgentDocs.length > 0 ? (
                recentUrgentDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl flex items-start justify-between gap-3 hover:bg-slate-100/50 transition-colors"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-rose-100 text-rose-600 font-bold px-2 py-0.5 rounded-md uppercase">
                          {doc.priority === 'very_urgent' ? 'ด่วนที่สุด' : 'ด่วน'}
                        </span>
                        <span className="text-slate-400 text-xs font-mono">{doc.doc_no}</span>
                      </div>
                      <h4 className="text-slate-800 text-sm font-bold truncate pr-2">{doc.title}</h4>
                      <p className="text-slate-400 text-xs truncate">ผู้ส่ง: {doc.sender}</p>
                    </div>
                    <button
                      onClick={() => setCurrentTab(doc.category)}
                      className="px-3 py-1.5 bg-white hover:bg-emerald-500 border border-slate-200 hover:border-emerald-500 text-slate-700 hover:text-slate-950 font-semibold text-xs rounded-lg transition-all shrink-0 cursor-pointer"
                    >
                      ดูรายละเอียด
                    </button>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center flex flex-col items-center">
                  <CheckCircle className="h-10 w-10 text-emerald-400 mb-2" />
                  <p className="text-slate-500 text-sm font-medium">ไม่มีหนังสือเร่งด่วนค้างคาในขณะนี้</p>
                  <p className="text-slate-400 text-xs mt-1">การจัดการงานสารบรรณของคุณเป็นปัจจุบันเรียบร้อย</p>
                </div>
              )}
            </div>
          </div>

          {recentUrgentDocs.length > 0 && (
            <button
              onClick={() => setCurrentTab('incoming')}
              className="w-full text-center text-xs text-emerald-600 font-bold hover:text-emerald-700 mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 group cursor-pointer"
            >
              <span>ดูข้อมูลหนังสือราชการทั้งหมด</span>
              <ArrowUpRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          )}
        </div>

        {/* Info & Activity Sidebar */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
          <h3 className="font-bold text-slate-800 text-base pb-3 border-b border-slate-100 flex items-center gap-2">
            <Users className="h-4.5 w-4.5 text-slate-400" />
            ฝ่ายงาน & ข้อมูลการบริหาร
          </h3>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-12 bg-emerald-500 rounded-full shrink-0 mt-0.5" />
              <div>
                <h4 className="text-slate-700 font-bold text-sm">ฝ่ายบริหารทั่วไปและสารบรรณ</h4>
                <p className="text-slate-400 text-xs mt-0.5 font-light leading-relaxed">รับผิดชอบงานจัดเก็บ ทะเบียน รวบรวมคำสั่งโรงเรียน และกระจายข่าวประกาศเวียนราชการ</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-1.5 h-12 bg-blue-500 rounded-full shrink-0 mt-0.5" />
              <div>
                <h4 className="text-slate-700 font-bold text-sm">ฝ่ายบริหารงานบุคคล</h4>
                <p className="text-slate-400 text-xs mt-0.5 font-light leading-relaxed">ทำเนียบข้าราชการครู การขอขั้น เงินเดือน ประวัติส่วนตัวครู และสวัสดิการบุคลากร</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-1.5 h-12 bg-amber-500 rounded-full shrink-0 mt-0.5" />
              <div>
                <h4 className="text-slate-700 font-bold text-sm">ฝ่ายบริหารวิชาการและทะเบียน</h4>
                <p className="text-slate-400 text-xs mt-0.5 font-light leading-relaxed">หลักสูตรวิชาการ ประเมินผลการเรียน จัดการข้อมูลรายชื่อและทะเบียนนักเรียนแยกห้องเรียน</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
