import React, { useEffect, useState } from 'react';
import { schoolService, settingsService } from '../../lib/db';
import type { Profile, Department } from '../../types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import {
  Search,
  Users,
  Phone,
  Building,
  Plus,
  Edit2,
  Trash2,
  X
} from 'lucide-react';

const staffSchema = zod.object({
  full_name: zod.string().min(1, 'กรุณากรอกชื่อ-นามสกุล'),
  email: zod.string().email('กรุณากรอกอีเมลที่ถูกต้อง'),
  phone: zod.string().min(1, 'กรุณากรอกเบอร์โทรศัพท์'),
  role: zod.enum(['admin', 'director', 'registrar', 'teacher', 'general_staff'] as const),
  department_id: zod.string().min(1, 'กรุณาเลือกฝ่ายงาน'),
});

type StaffFormInput = zod.infer<typeof staffSchema>;

interface StaffDirectoryProps {
  currentUser: Profile;
}

export const StaffDirectory: React.FC<StaffDirectoryProps> = ({ currentUser }) => {
  const [staff, setStaff] = useState<Profile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<Profile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<StaffFormInput>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      role: 'teacher',
      department_id: '',
    }
  });

  const isEditable = currentUser.role === 'admin';

  const loadStaffData = async () => {
    try {
      setIsLoading(true);
      const [staffData, deptData] = await Promise.all([
        schoolService.getStaff(),
        settingsService.getDepartments()
      ]);
      setStaff(staffData);
      setFilteredStaff(staffData);
      setDepartments(deptData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStaffData();
  }, []);

  useEffect(() => {
    let result = staff;
    if (searchTerm) {
      result = result.filter(s => 
        s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.phone && s.phone.includes(searchTerm)) ||
        (s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    if (deptFilter !== 'all') {
      result = result.filter(s => s.department_id === deptFilter);
    }
    setFilteredStaff(result);
  }, [searchTerm, deptFilter, staff]);

  const handleOpenRegister = () => {
    setEditingStaff(null);
    reset({
      full_name: '',
      email: '',
      phone: '',
      role: 'teacher',
      department_id: departments[0]?.id || '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (person: Profile) => {
    setEditingStaff(person);
    reset({
      full_name: person.full_name,
      email: person.email || '',
      phone: person.phone || '',
      role: person.role,
      department_id: person.department_id || '',
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (data: StaffFormInput) => {
    try {
      if (editingStaff) {
        await schoolService.updateStaff(editingStaff.id, data);
      } else {
        await schoolService.createStaff(data);
      }
      setIsModalOpen(false);
      loadStaffData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (id === currentUser.id) {
      alert('คุณไม่สามารถลบบัญชีผู้ใช้ที่กำลังล็อกอินอยู่ได้ครับ');
      return;
    }
    if (confirm('คุณต้องการลบรายชื่อบุคลากรรายนี้ออกจากทำเนียบใช่หรือไม่?')) {
      try {
        await schoolService.deleteStaff(id);
        loadStaffData();
      } catch (err) {
        console.error(err);
      }
    }
  };

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

  const getDeptName = (deptId?: string) => {
    if (!deptId) return 'ไม่ระบุฝ่ายงาน';
    const dept = departments.find(d => d.id === deptId);
    return dept ? dept.name : 'ไม่ระบุฝ่ายงาน';
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-slate-800 text-xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-emerald-500" />
            ทำเนียบบุคลากรและข้าราชการครู (Staff Directory)
          </h2>
          <p className="text-slate-500 text-xs mt-1">ทะเบียนเบอร์ติดต่อ และข้อมูลฝ่ายงานสังเคราะห์ของคณะครูบุคลากรโรงเรียน</p>
        </div>

        {isEditable && (
          <button
            onClick={handleOpenRegister}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-500/10 flex items-center gap-2 cursor-pointer self-start md:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>เพิ่มบุคลากรใหม่</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative md:col-span-2">
          <Search className="absolute inset-y-0 left-0 pl-3.5 flex items-center h-full text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="ค้นหาบุคลากรด้วย ชื่อ, อีเมล หรือเบอร์โทรศัพท์..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:bg-white text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-xs shrink-0 font-medium">สังกัดฝ่ายงาน:</span>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/40 cursor-pointer"
          >
            <option value="all">ทั้งหมด</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Staff Cards Grid */}
      {isLoading ? (
        <div className="py-20 text-center flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
          <span className="text-slate-500 text-xs">กำลังโหลดทำเนียบบุคลากร...</span>
        </div>
      ) : filteredStaff.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStaff.map((person) => (
            <div
              key={person.id}
              className="bg-white border border-slate-200 hover:border-slate-300 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-4"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center font-bold text-lg shrink-0 shadow-inner">
                  {person.full_name.charAt(0)}
                </div>
                
                <div className="space-y-1 min-w-0">
                  <h3 className="font-bold text-slate-800 text-sm truncate leading-snug">{person.full_name}</h3>
                  <p className="text-[10px] text-slate-400 truncate leading-snug">{person.email || 'ไม่มีอีเมลผู้ใช้'}</p>
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-md">
                      {getRoleLabel(person.role)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-[10px] text-slate-500 leading-normal">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Building className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="truncate" title={getDeptName(person.department_id)}>{getDeptName(person.department_id)}</span>
                </div>
                <div className="flex items-center gap-1.5 justify-end">
                  <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>{person.phone || 'ไม่มีเบอร์โทร'}</span>
                </div>
              </div>

              {isEditable && (
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 w-full shrink-0">
                  <button
                    onClick={() => handleOpenEdit(person)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 text-[10px] rounded-xl font-bold transition-all cursor-pointer border border-blue-200/20"
                  >
                    <Edit2 className="h-3 w-3" />
                    <span>แก้ไข</span>
                  </button>
                  <button
                    onClick={() => handleDelete(person.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-[10px] rounded-xl font-bold transition-all cursor-pointer border border-rose-200/20"
                    disabled={person.id === currentUser.id}
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>ลบ</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center bg-white border border-slate-200 rounded-2xl shadow-xs">
          <p className="text-slate-500 font-medium">ไม่พบบุคลากรตามเงื่อนไขที่ค้นหา</p>
        </div>
      )}

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl relative flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <h3 className="font-bold text-slate-800 text-sm">
                {editingStaff ? '📝 แก้ไขข้อมูลบุคลากร' : '📥 ลงทะเบียนบุคลากรภายในโรงเรียนคนใหม่'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1 pl-0.5">ชื่อจริง - นามสกุล *</label>
                <input
                  type="text"
                  placeholder="เช่น นายมนัส สอนดี"
                  {...register('full_name')}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-xs"
                />
                {errors.full_name && <p className="text-rose-500 text-[10px] mt-1">{errors.full_name.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1 pl-0.5">อีเมลผู้ใช้งาน (Email Login) *</label>
                  <input
                    type="email"
                    placeholder="name@school.go.th"
                    {...register('email')}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-xs"
                  />
                  {errors.email && <p className="text-rose-500 text-[10px] mt-1">{errors.email.message}</p>}
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1 pl-0.5">เบอร์โทรศัพท์มือถือ *</label>
                  <input
                    type="text"
                    placeholder="เช่น 08x-xxx-xxxx"
                    {...register('phone')}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-xs"
                  />
                  {errors.phone && <p className="text-rose-500 text-[10px] mt-1">{errors.phone.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1 pl-0.5">บทบาทและระดับสิทธิ์ใช้งาน *</label>
                  <select
                    {...register('role')}
                    className="w-full py-2.5 px-3 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer"
                  >
                    <option value="teacher">อาจารย์ผู้สอน (Teacher)</option>
                    <option value="general_staff">เจ้าหน้าที่ทั่วไป (Staff)</option>
                    <option value="registrar">นายทะเบียนโรงเรียน (Registrar)</option>
                    <option value="director">ผู้อำนวยการโรงเรียน (Director)</option>
                    <option value="admin">ผู้ดูแลระบบสารบรรณ (Admin)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1 pl-0.5">สังกัดฝ่ายงานหลัก *</label>
                  <select
                    {...register('department_id')}
                    className="w-full py-2.5 px-3 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                  {errors.department_id && <p className="text-rose-500 text-[10px] mt-1">{errors.department_id.message}</p>}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
                >
                  {editingStaff ? 'บันทึกการแก้ไข' : 'ขึ้นทะเบียนบุคลากร'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
