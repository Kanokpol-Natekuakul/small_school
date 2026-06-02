import React, { useEffect, useState } from 'react';
import { docService, schoolService } from '../../lib/db';
import type { Document, Profile, DocPriority } from '../../types';
import { exportDocumentsToExcel } from '../../lib/exportExcel';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import {
  Search,
  FileText,
  Plus,
  Download,
  Trash2,
  Edit2,
  Check,
  Eye,
  AlertCircle,
  X,
  Users
} from 'lucide-react';

const docSchema = zod.object({
  doc_no: zod.string().min(1, 'กรุณากรอกเลขที่ประกาศ/คำสั่ง'),
  title: zod.string().min(1, 'กรุณากรอกชื่อเรื่อง'),
  description: zod.string().optional(),
  priority: zod.enum(['normal', 'urgent', 'very_urgent'] as const),
  sender: zod.string().min(1, 'กรุณากรอกผู้ประกาศ'),
  receiver: zod.string().min(1, 'กรุณากรอกกลุ่มเป้าหมาย'),
  doc_date: zod.string().min(1, 'กรุณาเลือกวันที่เอกสาร'),
});

type DocFormInput = zod.infer<typeof docSchema>;

interface CircularDocsProps {
  currentUser: Profile;
}

export const CircularDocs: React.FC<CircularDocsProps> = ({ currentUser }) => {
  const [docs, setDocs] = useState<Document[]>([]);
  const [filteredDocs, setFilteredDocs] = useState<Document[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Read Tracking State
  const [userReads, setUserReads] = useState<Record<string, boolean>>({}); // docId -> hasRead
  const [trackingDoc, setTrackingDoc] = useState<Document | null>(null);
  const [trackingList, setTrackingList] = useState<{ profile: Profile; readAt?: string }[]>([]);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<DocFormInput>({
    resolver: zodResolver(docSchema),
    defaultValues: {
      doc_no: '',
      title: '',
      description: '',
      priority: 'normal',
      sender: 'กลุ่มงานบริหารทั่วไป',
      receiver: 'ข้าราชการครูและบุคลากรทางการศึกษาทุกท่าน',
      doc_date: new Date().toISOString().split('T')[0],
    }
  });

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      const data = await docService.getDocs('circular');
      setDocs(data);
      setFilteredDocs(data);

      // Load which documents this user has read
      const readsMap: Record<string, boolean> = {};
      await Promise.all(data.map(async (doc) => {
        const reads = await docService.getCircularReads(doc.id);
        const hasRead = reads.some(r => r.profile_id === currentUser.id && !!r.read_at);
        readsMap[doc.id] = hasRead;
      }));
      setUserReads(readsMap);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [currentUser]);

  // Filter application
  useEffect(() => {
    let result = docs;

    if (searchTerm) {
      result = result.filter(d => 
        d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.doc_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.sender.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (priorityFilter !== 'all') {
      result = result.filter(d => d.priority === priorityFilter);
    }

    setFilteredDocs(result);
  }, [searchTerm, priorityFilter, docs]);

  const handleOpenRegister = () => {
    setEditingDoc(null);
    reset({
      doc_no: `คำสั่งที่ ${Math.floor(Math.random() * 80) + 1}/${new Date().getFullYear() + 543}`,
      title: '',
      description: '',
      priority: 'normal',
      sender: 'กลุ่มงานบริหารทั่วไป',
      receiver: 'ข้าราชการครูและบุคลากรทางการศึกษาทุกท่าน',
      doc_date: new Date().toISOString().split('T')[0],
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (doc: Document) => {
    setEditingDoc(doc);
    reset({
      doc_no: doc.doc_no,
      title: doc.title,
      description: doc.description || '',
      priority: doc.priority,
      sender: doc.sender,
      receiver: doc.receiver,
      doc_date: doc.doc_date,
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (data: DocFormInput) => {
    try {
      if (editingDoc) {
        await docService.updateDoc(editingDoc.id, { ...data, category: 'circular', status: 'approved' });
      } else {
        await docService.createDoc({ ...data, category: 'circular', status: 'approved' });
      }
      setIsModalOpen(false);
      loadDocuments();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('คุณต้องการลบหนังสือเวียน/คำสั่งประกาศนี้ใช่หรือไม่?')) {
      try {
        await docService.deleteDoc(id);
        loadDocuments();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleAcknowledge = async (docId: string) => {
    try {
      await docService.markCircularAsRead(docId);
      loadDocuments();
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenTracking = async (doc: Document) => {
    try {
      setTrackingDoc(doc);
      const reads = await docService.getCircularReads(doc.id);
      const staffList = await schoolService.getStaff();
      
      const trackingData = staffList.map(staff => {
        const readRecord = reads.find(r => r.profile_id === staff.id);
        return {
          profile: staff,
          readAt: readRecord?.read_at,
        };
      });

      setTrackingList(trackingData);
      setIsTrackingModalOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExport = () => {
    exportDocumentsToExcel(filteredDocs, 'ทะเบียนหนังสือแจ้งเวียน_SmartSchool');
  };

  const getPriorityBadge = (priority: DocPriority) => {
    const badges = {
      normal: (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-50 text-slate-600 border border-slate-200/80 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5" />
          ปกติ
        </span>
      ),
      urgent: (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/50 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5" />
          ด่วน
        </span>
      ),
      very_urgent: (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200/50 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5 animate-pulse" />
          ด่วนที่สุด
        </span>
      ),
    };
    return badges[priority] || priority;
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-slate-800 text-xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-emerald-500" />
            ระบบประกาศและหนังสือเวียน (Circular Announcements)
          </h2>
          <p className="text-slate-500 text-xs mt-1">กระจายข่าวสาร คำสั่งโรงเรียน ประชาสัมพันธ์ และตรวจสอบการรับทราบของบุคลากร</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>ส่งออก Excel</span>
          </button>
          
          {(currentUser.role === 'admin' || currentUser.role === 'general_staff' || currentUser.role === 'director') && (
            <button
              onClick={handleOpenRegister}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-500/10 flex items-center gap-2 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>สร้างประกาศเวียนใหม่</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters Card */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search */}
        <div className="relative md:col-span-2">
          <Search className="absolute inset-y-0 left-0 pl-3.5 flex items-center h-full text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="ค้นหาตาม เลขคำสั่ง/ประกาศ, ชื่อเรื่อง หรือผู้ประกาศ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:bg-white text-xs"
          />
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-xs shrink-0 font-medium">ความเร่งด่วน:</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/40 cursor-pointer"
          >
            <option value="all">ทั้งหมด</option>
            <option value="normal">ปกติ</option>
            <option value="urgent">ด่วน</option>
            <option value="very_urgent">ด่วนที่สุด</option>
          </select>
        </div>
      </div>

      {/* Main Grid: Render Announcements in beautiful Cards */}
      {isLoading ? (
        <div className="py-20 text-center flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
          <span className="text-slate-500 text-xs">กำลังดึงข่าวประกาศ...</span>
        </div>
      ) : filteredDocs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredDocs.map((doc) => {
            const hasRead = userReads[doc.id] || false;
            return (
              <div
                key={doc.id}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-3xl p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition-all duration-300 relative overflow-hidden"
              >
                {/* Header info */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between w-full">
                    <span className="text-slate-400 font-mono text-[10px] bg-slate-50 border border-slate-200/60 px-2.5 py-0.5 rounded-lg">
                      {doc.doc_no}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {getPriorityBadge(doc.priority)}
                      {hasRead ? (
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 font-bold text-[10px] rounded-md border border-emerald-500/20 flex items-center gap-0.5">
                          <Check className="h-3 w-3" /> รับทราบแล้ว
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-rose-50 text-rose-500 font-bold text-[10px] rounded-md border border-rose-100">
                          ยังไม่ได้เปิดอ่าน
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="font-bold text-slate-800 text-sm md:text-base leading-snug hover:text-emerald-600 transition-colors">
                    {doc.title}
                  </h3>
                  <p className="text-slate-400 text-xs font-light leading-relaxed">
                    {doc.description || 'ไม่มีสรุปใจความสำคัญลงประกาศไว้'}
                  </p>
                  
                  <div className="pt-2 flex flex-wrap gap-y-1 gap-x-4 text-[10px] text-slate-400 border-t border-slate-100">
                    <span>ผู้ประกาศ: <strong className="text-slate-600 font-semibold">{doc.sender}</strong></span>
                    <span>ลงวันที่: <strong className="text-slate-600 font-semibold">{doc.doc_date}</strong></span>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => handleOpenTracking(doc)}
                    className="px-3 py-1.5 hover:bg-slate-100 border border-slate-200 text-slate-600 font-semibold text-[10px] rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="h-3 w-3" />
                    <span>ผู้รับทราบประกาศ</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {!hasRead && (
                      <button
                        onClick={() => handleAcknowledge(doc.id)}
                        className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-[10px] rounded-lg shadow-sm shadow-emerald-500/10 transition-all cursor-pointer"
                      >
                        รับทราบข้อความ
                      </button>
                    )}

                    {(currentUser.role === 'admin' || currentUser.role === 'general_staff') && (
                      <>
                        <button
                          onClick={() => handleOpenEdit(doc)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 rounded-lg transition-all cursor-pointer"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-lg transition-all cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center bg-white border border-slate-200 rounded-2xl shadow-xs">
          <AlertCircle className="h-10 w-10 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500 font-medium">ไม่พบเอกสารแจ้งเวียนคำสั่งโรงเรียน</p>
          <p className="text-slate-400 text-[10px] mt-1">สามารถกด "สร้างประกาศเวียนใหม่" เพื่อเริ่มสร้างคำสั่งประชาสัมพันธ์ได้ทันที</p>
        </div>
      )}

      {/* Register/Edit Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl relative flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <h3 className="font-bold text-slate-800 text-sm">
                {editingDoc ? '📝 แก้ไขข้อมูลประกาศเวียน' : '📤 สร้างหนังสือเวียน/ประกาศประชาสัมพันธ์ใหม่'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1 pl-0.5">เลขที่ประกาศ/คำสั่ง *</label>
                  <input
                    type="text"
                    {...register('doc_no')}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-xs"
                  />
                  {errors.doc_no && <p className="text-rose-500 text-[10px] mt-1">{errors.doc_no.message}</p>}
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1 pl-0.5">วันที่ประกาศ *</label>
                  <input
                    type="date"
                    {...register('doc_date')}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-xs cursor-pointer"
                  />
                  {errors.doc_date && <p className="text-rose-500 text-[10px] mt-1">{errors.doc_date.message}</p>}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1 pl-0.5">เรื่อง (หัวข้อหลัก) *</label>
                <input
                  type="text"
                  placeholder="เช่น กำหนดการสอบปลายภาคภาคเรียน หรือคำสั่งแต่งตั้ง..."
                  {...register('title')}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-xs"
                />
                {errors.title && <p className="text-rose-500 text-[10px] mt-1">{errors.title.message}</p>}
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1 pl-0.5">เนื้อหา/ใจความสำคัญประกาศ</label>
                <textarea
                  rows={4}
                  placeholder="พิมพ์ใจความสำคัญหรือข้อปฏิบัติสำหรับครูและนักเรียนโดยละเอียด..."
                  {...register('description')}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-xs resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1 pl-0.5">ผู้ประกาศ *</label>
                  <input
                    type="text"
                    {...register('sender')}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-xs"
                  />
                  {errors.sender && <p className="text-rose-500 text-[10px] mt-1">{errors.sender.message}</p>}
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1 pl-0.5">กลุ่มเป้าหมายผู้รับสาร *</label>
                  <input
                    type="text"
                    {...register('receiver')}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-xs"
                  />
                  {errors.receiver && <p className="text-rose-500 text-[10px] mt-1">{errors.receiver.message}</p>}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1 pl-0.5">ระดับความเร่งด่วน</label>
                <select
                  {...register('priority')}
                  className="w-full py-2.5 px-3 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer"
                >
                  <option value="normal">ปกติ</option>
                  <option value="urgent">ด่วน</option>
                  <option value="very_urgent">ด่วนที่สุด</option>
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
                  {editingDoc ? 'บันทึกการแก้ไข' : 'ประกาศคำสั่ง'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tracking modal Dialog */}
      {isTrackingModalOpen && trackingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl relative flex flex-col max-h-[75vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <div className="space-y-0.5">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <Users className="h-4.5 w-4.5 text-slate-400" />
                  รายนามบุคลากรผู้รับทราบ
                </h3>
                <p className="text-[10px] text-slate-400 font-medium truncate max-w-xs">{trackingDoc.title}</p>
              </div>
              <button
                onClick={() => setIsTrackingModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-3.5 text-xs">
              {trackingList.length > 0 ? (
                trackingList.map((item) => (
                  <div key={item.profile.id} className="flex items-center justify-between pb-2 border-b border-slate-100 last:border-b-0">
                    <div>
                      <p className="font-bold text-slate-800">{item.profile.full_name}</p>
                      <span className="text-[10px] text-slate-400 capitalize">{item.profile.role.replace('_', ' ')}</span>
                    </div>

                    {item.readAt ? (
                      <div className="text-right">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 font-bold text-[10px] rounded-md">รับทราบแล้ว</span>
                        <p className="text-[9px] text-slate-400 mt-1">{new Date(item.readAt).toLocaleString('th-TH')}</p>
                      </div>
                    ) : (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-400 font-semibold text-[10px] rounded-md">ยังไม่เปิดอ่าน</span>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-400">ไม่มีข้อมูลบุคลากรในทำเนียบ</div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 shrink-0">
              <button
                onClick={() => setIsTrackingModalOpen(false)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-center cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
