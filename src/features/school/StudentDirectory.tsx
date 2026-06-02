import React, { useEffect, useState } from 'react';
import { schoolService } from '../../lib/db';
import type { Student, Profile, StudentStatus } from '../../types';
import { exportStudentsToExcel } from '../../lib/exportExcel';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import {
  Search,
  GraduationCap,
  Plus,
  Download,
  Trash2,
  Edit2,
  AlertCircle,
  X
} from 'lucide-react';

const studentSchema = zod.object({
  student_id: zod.string().min(3, 'รหัสนักเรียนต้องมีอย่างน้อย 3 ตัวอักษร'),
  first_name: zod.string().min(1, 'กรุณากรอกชื่อ'),
  last_name: zod.string().min(1, 'กรุณากรอกนามสกุล'),
  class_level: zod.string().min(1, 'กรุณาเลือกหรือกรอกชั้นเรียน'),
  classroom: zod.string().min(1, 'กรุณากรอกห้องเรียน'),
  status: zod.enum(['active', 'suspended', 'graduated', 'transferred'] as const),
  guardian_name: zod.string().optional(),
  guardian_phone: zod.string().optional(),
});

type StudentFormInput = zod.infer<typeof studentSchema>;

interface StudentDirectoryProps {
  currentUser: Profile;
}

export const StudentDirectory: React.FC<StudentDirectoryProps> = ({ currentUser }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<StudentFormInput>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      student_id: '',
      first_name: '',
      last_name: '',
      class_level: 'ม.1',
      classroom: '1',
      status: 'active',
      guardian_name: '',
      guardian_phone: '',
    }
  });

  const loadStudents = async () => {
    try {
      setIsLoading(true);
      const data = await schoolService.getStudents();
      setStudents(data);
      setFilteredStudents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  // Filter application
  useEffect(() => {
    let result = students;

    if (searchTerm) {
      result = result.filter(s => 
        `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.student_id.includes(searchTerm)
      );
    }

    if (classFilter !== 'all') {
      result = result.filter(s => s.class_level === classFilter);
    }

    if (statusFilter !== 'all') {
      result = result.filter(s => s.status === statusFilter);
    }

    setFilteredStudents(result);
  }, [searchTerm, classFilter, statusFilter, students]);

  const handleOpenRegister = () => {
    setEditingStudent(null);
    reset({
      student_id: String(Math.floor(Math.random() * 9000) + 10000),
      first_name: '',
      last_name: '',
      class_level: 'ม.1',
      classroom: '1',
      status: 'active',
      guardian_name: '',
      guardian_phone: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    reset({
      student_id: student.student_id,
      first_name: student.first_name,
      last_name: student.last_name,
      class_level: student.class_level,
      classroom: student.classroom,
      status: student.status,
      guardian_name: student.guardian_name || '',
      guardian_phone: student.guardian_phone || '',
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (data: StudentFormInput) => {
    try {
      if (editingStudent) {
        await schoolService.updateStudent(editingStudent.id, data);
      } else {
        await schoolService.createStudent(data);
      }
      setIsModalOpen(false);
      loadStudents();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('คุณต้องการลบข้อมูลทะเบียนนักเรียนรายนี้ใช่หรือไม่?')) {
      try {
        await schoolService.deleteStudent(id);
        loadStudents();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleExport = () => {
    exportStudentsToExcel(filteredStudents, 'ทะเบียนรายชื่อนักเรียน_SmartSchool');
  };

  const getStatusBadge = (status: StudentStatus) => {
    const badges = {
      active: (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
          ปกติ
        </span>
      ),
      suspended: (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-100 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5" />
          พักการเรียน
        </span>
      ),
      graduated: (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5" />
          จบการศึกษา
        </span>
      ),
      transferred: (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200 shrink-0 font-light">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5" />
          ย้ายสถานศึกษา
        </span>
      ),
    };
    return badges[status] || status;
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-slate-800 text-xl font-bold flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-emerald-500" />
            ระบบงานทะเบียนนักเรียน (Student Records)
          </h2>
          <p className="text-slate-500 text-xs mt-1">จัดการแฟ้มประวัตินักเรียน ชั้นเรียน ห้องเรียน ข้อมูลผู้ปกครอง และสถานภาพการศึกษา</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>ส่งออก Excel</span>
          </button>
          
          {(currentUser.role === 'admin' || currentUser.role === 'registrar') && (
            <button
              onClick={handleOpenRegister}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-500/10 flex items-center gap-2 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>ขึ้นทะเบียนนักเรียนใหม่</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters Card */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col gap-4">
        {/* Search */}
        <div className="relative w-full">
          <Search className="absolute inset-y-0 left-0 pl-3.5 flex items-center h-full text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="ค้นหาด้วยรหัสนักเรียน หรือ ชื่อ-นามสกุล..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:bg-white text-xs"
          />
        </div>

        {/* Dynamic Class Selector (Swipable pills) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-none shrink-0">
          <span className="text-slate-400 text-xs shrink-0 font-bold uppercase tracking-wider">ระดับชั้น:</span>
          {['all', 'ม.1', 'ม.2', 'ม.3', 'ม.4', 'ม.5', 'ม.6'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setClassFilter(lvl)}
              className={`
                px-4 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer border
                ${classFilter === lvl
                  ? 'bg-emerald-500 text-slate-950 border-emerald-500 shadow-md shadow-emerald-500/10'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }
              `}
            >
              {lvl === 'all' ? 'ทั้งหมด' : lvl}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 w-full md:w-72">
          <span className="text-slate-400 text-xs shrink-0 font-bold uppercase tracking-wider">สถานภาพ:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/40 cursor-pointer"
          >
            <option value="all">ทั้งหมด</option>
            <option value="active">ปกติ</option>
            <option value="suspended">พักการเรียน</option>
            <option value="graduated">จบการศึกษา</option>
            <option value="transferred">ย้ายสถานศึกษา</option>
          </select>
        </div>
      </div>

      {/* Mobile Card List */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {isLoading ? (
          <div className="py-20 text-center flex flex-col items-center">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
            <span className="text-slate-500 text-xs">กำลังค้นหาบัญชีนักเรียน...</span>
          </div>
        ) : filteredStudents.length > 0 ? (
          filteredStudents.map((std) => (
            <div
              key={std.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col space-y-4"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-slate-400 font-bold bg-slate-50 border border-slate-200/60 px-2 py-0.5 rounded-lg">
                    รหัส: {std.student_id}
                  </span>
                  <h4 className="font-bold text-slate-800 text-sm mt-1">{std.first_name} {std.last_name}</h4>
                  <p className="text-slate-500 text-xs">ชั้น {std.class_level} / {std.classroom}</p>
                </div>
                {getStatusBadge(std.status)}
              </div>

              <div className="text-[10px] text-slate-500 space-y-1 border-t border-slate-100 pt-3 leading-normal">
                <div>ผู้ปกครอง: <strong className="text-slate-700 font-semibold">{std.guardian_name || '-'}</strong></div>
                <div>เบอร์ติดต่อ: <strong className="text-slate-700 font-semibold">{std.guardian_phone || '-'}</strong></div>
              </div>

              {(currentUser.role === 'admin' || currentUser.role === 'registrar') && (
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 w-full shrink-0">
                  <button
                    onClick={() => handleOpenEdit(std)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 text-[10px] rounded-xl font-bold transition-all cursor-pointer border border-blue-200/20"
                  >
                    <Edit2 className="h-3 w-3" />
                    <span>แก้ไข</span>
                  </button>
                  <button
                    onClick={() => handleDelete(std.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-[10px] rounded-xl font-bold transition-all cursor-pointer border border-rose-200/20"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>ลบ</span>
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="py-16 text-center bg-white border border-slate-200 rounded-2xl shadow-xs">
            <AlertCircle className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 font-medium">ไม่พบบัญชีทะเบียนรายชื่อนักเรียน</p>
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center flex flex-col items-center">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
            <span className="text-slate-500 text-xs">กำลังค้นหาบัญชีนักเรียน...</span>
          </div>
        ) : filteredStudents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-4 w-32">รหัสนักเรียน</th>
                  <th className="p-4">ชื่อ - นามสกุล</th>
                  <th className="p-4 w-28">ระดับชั้นเรียน</th>
                  <th className="p-4">ผู้ปกครอง / เบอร์ติดต่อ</th>
                  <th className="p-4 w-28">สถานภาพ</th>
                  {(currentUser.role === 'admin' || currentUser.role === 'registrar') && (
                    <th className="p-4 w-24 text-right">ดำเนินการ</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredStudents.map((std) => (
                  <tr key={std.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-mono font-semibold text-slate-900">{std.student_id}</td>
                    <td className="p-4 font-bold text-slate-800">{std.first_name} {std.last_name}</td>
                    <td className="p-4">ชั้น {std.class_level} / {std.classroom}</td>
                    <td className="p-4 space-y-0.5">
                      <div className="font-semibold text-slate-700">{std.guardian_name || '-'}</div>
                      {std.guardian_phone && <p className="text-slate-400 text-[10px]">{std.guardian_phone}</p>}
                    </td>
                    <td className="p-4">{getStatusBadge(std.status)}</td>
                    {(currentUser.role === 'admin' || currentUser.role === 'registrar') && (
                      <td className="p-4 text-right space-x-1 shrink-0">
                        <button
                          onClick={() => handleOpenEdit(std)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 rounded-lg transition-all inline-flex cursor-pointer"
                          title="แก้ไขข้อมูลนักเรียน"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(std.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-lg transition-all inline-flex cursor-pointer"
                          title="ลบนักเรียน"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center">
            <AlertCircle className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 font-medium">ไม่พบบัญชีทะเบียนรายชื่อนักเรียน</p>
          </div>
        )}
      </div>

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl relative flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <h3 className="font-bold text-slate-800 text-sm">
                {editingStudent ? '📝 แก้ไขแฟ้มประวัตินักเรียน' : '🎓 ขึ้นทะเบียนจัดประวัตินักเรียนใหม่'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className="block font-semibold text-slate-600 mb-1 pl-0.5">รหัสนักเรียน *</label>
                  <input
                    type="text"
                    {...register('student_id')}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-xs"
                  />
                  {errors.student_id && <p className="text-rose-500 text-[10px] mt-1">{errors.student_id.message}</p>}
                </div>

                <div className="col-span-1">
                  <label className="block font-semibold text-slate-600 mb-1 pl-0.5">ระดับชั้นเรียน *</label>
                  <select
                    {...register('class_level')}
                    className="w-full py-2.5 px-3 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer"
                  >
                    <option value="ม.1">ม.1</option>
                    <option value="ม.2">ม.2</option>
                    <option value="ม.3">ม.3</option>
                    <option value="ม.4">ม.4</option>
                    <option value="ม.5">ม.5</option>
                    <option value="ม.6">ม.6</option>
                  </select>
                </div>

                <div className="col-span-1">
                  <label className="block font-semibold text-slate-600 mb-1 pl-0.5">ห้องเรียน *</label>
                  <input
                    type="text"
                    placeholder="เช่น 1, 2"
                    {...register('classroom')}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-xs"
                  />
                  {errors.classroom && <p className="text-rose-500 text-[10px] mt-1">{errors.classroom.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1 pl-0.5">ชื่อจริง *</label>
                  <input
                    type="text"
                    {...register('first_name')}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-xs"
                  />
                  {errors.first_name && <p className="text-rose-500 text-[10px] mt-1">{errors.first_name.message}</p>}
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1 pl-0.5">นามสกุล *</label>
                  <input
                    type="text"
                    {...register('last_name')}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-xs"
                  />
                  {errors.last_name && <p className="text-rose-500 text-[10px] mt-1">{errors.last_name.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1 pl-0.5">ชื่อผู้ปกครอง</label>
                  <input
                    type="text"
                    {...register('guardian_name')}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1 pl-0.5">เบอร์ติดต่อผู้ปกครอง</label>
                  <input
                    type="text"
                    placeholder="เช่น 08x-xxx-xxxx"
                    {...register('guardian_phone')}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1 pl-0.5">สถานภาพทางวิชาการ</label>
                <select
                  {...register('status')}
                  className="w-full py-2.5 px-3 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer"
                >
                  <option value="active">ปกติ (Active)</option>
                  <option value="suspended">พักการเรียน (Suspended)</option>
                  <option value="graduated">จบการศึกษา (Graduated)</option>
                  <option value="transferred">ย้ายสถานศึกษา (Transferred)</option>
                </select>
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
                  {editingStudent ? 'บันทึกการแก้ไข' : 'ขึ้นทะเบียนนักเรียน'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
