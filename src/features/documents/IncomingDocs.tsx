import React, { useEffect, useState } from 'react';
import { docService } from '../../lib/db';
import type { Document, Profile, DocPriority, DocStatus } from '../../types';
import { exportDocumentsToExcel } from '../../lib/exportExcel';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { usePagination } from '../../hooks/usePagination';
import { Pagination } from '../../components/Pagination';
import * as zod from 'zod';
import {
  Search,
  FileDown,
  Plus,
  Download,
  Trash2,
  Edit2,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';

const docSchema = zod.object({
  doc_no: zod.string().min(1, 'กรุณากรอกเลขที่หนังสือ'),
  title: zod.string().min(1, 'กรุณากรอกชื่อเรื่อง'),
  description: zod.string().optional(),
  priority: zod.enum(['normal', 'urgent', 'very_urgent'] as const),
  sender: zod.string().min(1, 'กรุณากรอกชื่อผู้ส่ง'),
  receiver: zod.string().min(1, 'กรุณากรอกชื่อผู้รับ'),
  doc_date: zod.string().min(1, 'กรุณาเลือกวันที่เอกสาร'),
  status: zod.enum(['draft', 'pending_approval', 'approved', 'archived'] as const),
});

type DocFormInput = zod.infer<typeof docSchema>;

interface IncomingDocsProps {
  currentUser: Profile;
}

export const IncomingDocs: React.FC<IncomingDocsProps> = ({ currentUser }) => {
  const [docs, setDocs] = useState<Document[]>([]);
  const [filteredDocs, setFilteredDocs] = useState<Document[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const {
    currentPage,
    itemsPerPage,
    paginatedItems,
    setCurrentPage,
    setItemsPerPage,
  } = usePagination(filteredDocs, 20);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<DocFormInput>({
    resolver: zodResolver(docSchema),
    defaultValues: {
      doc_no: '',
      title: '',
      description: '',
      priority: 'normal',
      sender: '',
      receiver: 'ผู้อำนวยการโรงเรียนสมาร์ทวิทยา',
      doc_date: new Date().toISOString().split('T')[0],
      status: 'pending_approval',
    }
  });

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      const data = await docService.getDocs('incoming');
      setDocs(data);
      setFilteredDocs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

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

    if (statusFilter !== 'all') {
      result = result.filter(d => d.status === statusFilter);
    }

    setFilteredDocs(result);
  }, [searchTerm, priorityFilter, statusFilter, docs]);

  const handleOpenRegister = () => {
    setEditingDoc(null);
    reset({
      doc_no: `ศธ ๐๔๐๐๒/${Math.floor(Math.random() * 1000) + 100}`,
      title: '',
      description: '',
      priority: 'normal',
      sender: '',
      receiver: 'ผู้อำนวยการโรงเรียนสมาร์ทวิทยา',
      doc_date: new Date().toISOString().split('T')[0],
      status: 'pending_approval',
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
      status: doc.status,
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (data: DocFormInput) => {
    try {
      if (editingDoc) {
        await docService.updateDoc(editingDoc.id, { ...data, category: 'incoming' });
      } else {
        await docService.createDoc({ ...data, category: 'incoming' });
      }
      setIsModalOpen(false);
      loadDocuments();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('คุณต้องการลบหนังสือลงรับเล่มนี้ใช่หรือไม่?')) {
      try {
        await docService.deleteDoc(id);
        loadDocuments();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSign = async (id: string) => {
    try {
      await docService.updateDoc(id, { status: 'approved' });
      loadDocuments();
    } catch (err) {
      console.error(err);
    }
  };

  const handleExport = () => {
    exportDocumentsToExcel(filteredDocs, 'ทะเบียนหนังสือรับ_SmartSchool');
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

  const getStatusBadge = (status: DocStatus) => {
    const badges = {
      draft: (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200/30 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5" />
          ฉบับร่าง
        </span>
      ),
      pending_approval: (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200/40 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mr-1.5 animate-pulse" />
          เสนอลงนาม
        </span>
      ),
      approved: (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/40 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
          ลงนามแล้ว
        </span>
      ),
      archived: (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200/40 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mr-1.5" />
          จัดเก็บเสร็จสิ้น
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
            <FileDown className="h-6 w-6 text-emerald-500" />
            ระบบทะเบียนหนังสือลงรับ (Incoming Documents)
          </h2>
          <p className="text-slate-500 text-xs mt-1">บริหารจัดการ ลงทะเบียน ค้นหา และลงนามรับรองหนังสือราชการขาเข้า</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>ส่งออก Excel</span>
          </button>
          
          {(currentUser.role === 'admin' || currentUser.role === 'general_staff') && (
            <button
              onClick={handleOpenRegister}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-500/10 flex items-center gap-2 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>ลงรับหนังสือใหม่</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters Card */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search */}
        <div className="relative md:col-span-2">
          <Search className="absolute inset-y-0 left-0 pl-3.5 flex items-center h-full text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="ค้นหาตาม เลขที่หนังสือ, ชื่อเรื่อง หรือผู้ส่ง..."
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

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-xs shrink-0 font-medium">สถานะ:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/40 cursor-pointer"
          >
            <option value="all">ทั้งหมด</option>
            <option value="pending_approval">เสนอลงนาม</option>
            <option value="approved">ลงนามแล้ว</option>
            <option value="archived">จัดเก็บแล้ว</option>
            <option value="draft">ฉบับร่าง</option>
          </select>
        </div>
      </div>

      {/* Mobile Card List */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {isLoading ? (
          <div className="py-20 text-center flex flex-col items-center">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
            <span className="text-slate-500 text-xs">กำลังค้นหาเอกสาร...</span>
          </div>
        ) : filteredDocs.length > 0 ? (
          paginatedItems.map((doc) => (
            <div key={doc.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-slate-400 font-bold bg-slate-50 border border-slate-200/60 px-2 py-0.5 rounded-lg">
                    {doc.doc_no}
                  </span>
                  <h4 className="font-bold text-slate-800 text-sm mt-1 leading-snug">{doc.title}</h4>
                  <p className="text-slate-500 text-[10px]">ลงวันที่: {doc.doc_date}</p>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 space-y-1 border-t border-slate-100 pt-3">
                <div>ผู้ส่ง: <strong className="text-slate-700 font-semibold">{doc.sender}</strong></div>
                <div>ผู้รับ: <strong className="text-slate-700 font-semibold">{doc.receiver}</strong></div>
                {doc.description && <div className="text-slate-400 mt-1 italic">{doc.description}</div>}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 w-full shrink-0">
                <div className="flex items-center gap-1.5">
                  {getPriorityBadge(doc.priority)}
                  {getStatusBadge(doc.status)}
                </div>

                <div className="flex items-center gap-2">
                  {currentUser.role === 'director' && doc.status === 'pending_approval' && (
                    <button
                      onClick={() => handleSign(doc.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-[10px] rounded-xl font-bold transition-all cursor-pointer shadow-xs"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span>อนุมัติ</span>
                    </button>
                  )}

                  {(currentUser.role === 'admin' || currentUser.role === 'general_staff') && (
                    <>
                      <button
                        onClick={() => handleOpenEdit(doc)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 text-[10px] rounded-xl font-bold transition-all cursor-pointer border border-blue-200/20"
                      >
                        <Edit2 className="h-3 w-3" />
                        <span>แก้ไข</span>
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-[10px] rounded-xl font-bold transition-all cursor-pointer border border-rose-200/20"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>ลบ</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-16 text-center bg-white border border-slate-200 rounded-2xl shadow-xs">
            <AlertCircle className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 font-medium">ไม่พบเอกสารลงรับตามเงื่อนไขที่กรอง</p>
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center flex flex-col items-center">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
            <span className="text-slate-500 text-xs">กำลังค้นหาเอกสาร...</span>
          </div>
        ) : filteredDocs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-4 w-36">เลขที่หนังสือ</th>
                  <th className="p-4 w-28">วันที่เอกสาร</th>
                  <th className="p-4">เรื่อง</th>
                  <th className="p-4">ผู้ส่ง / แหล่งที่มา</th>
                  <th className="p-4 w-24">ความเร่งด่วน</th>
                  <th className="p-4 w-28">สถานะ</th>
                  <th className="p-4 w-28 text-right">ดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paginatedItems.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-mono font-medium text-slate-900">{doc.doc_no}</td>
                    <td className="p-4 text-slate-500">{doc.doc_date}</td>
                    <td className="p-4">
                      <div className="font-bold text-slate-800 leading-snug">{doc.title}</div>
                      {doc.description && <p className="text-slate-400 text-[10px] mt-1 truncate max-w-sm">{doc.description}</p>}
                    </td>
                    <td className="p-4 text-slate-600 font-medium">{doc.sender}</td>
                    <td className="p-4">{getPriorityBadge(doc.priority)}</td>
                    <td className="p-4">{getStatusBadge(doc.status)}</td>
                    <td className="p-4 text-right space-x-1.5 shrink-0">
                      {currentUser.role === 'director' && doc.status === 'pending_approval' && (
                        <button
                          onClick={() => handleSign(doc.id)}
                          className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-lg transition-all text-[10px] cursor-pointer inline-flex items-center gap-1 shadow-xs"
                          title="ลงนามอนุมัติสั่งการ"
                        >
                          <CheckCircle className="h-3 w-3" />
                          อนุมัติ
                        </button>
                      )}
                      
                      {(currentUser.role === 'admin' || currentUser.role === 'general_staff') && (
                        <>
                          <button
                            onClick={() => handleOpenEdit(doc)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 rounded-lg transition-all inline-flex cursor-pointer"
                            title="แก้ไขข้อมูลหนังสือ"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(doc.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-lg transition-all inline-flex cursor-pointer"
                            title="ลบเอกสาร"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center">
            <AlertCircle className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 font-medium">ไม่พบเอกสารลงรับตามเงื่อนไขที่กรอง</p>
            <p className="text-slate-400 text-[10px] mt-1">สามารถกด "ลงรับหนังสือใหม่" เพื่อลงทะเบียนหนังสือราชการตัวแรกได้ทันที</p>
          </div>
        )}
      </div>

      {filteredDocs.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalItems={filteredDocs.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      )}

      {/* Register/Edit Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl relative flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <h3 className="font-bold text-slate-800 text-sm">
                {editingDoc ? '📝 แก้ไขข้อมูลหนังสือลงรับ' : '📥 ลงรับหนังสือราชการเล่มใหม่'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1 pl-0.5">เลขที่หนังสือ *</label>
                  <input
                    type="text"
                    {...register('doc_no')}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-xs"
                  />
                  {errors.doc_no && <p className="text-rose-500 text-[10px] mt-1">{errors.doc_no.message}</p>}
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1 pl-0.5">ลงวันที่ *</label>
                  <input
                    type="date"
                    {...register('doc_date')}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-xs cursor-pointer"
                  />
                  {errors.doc_date && <p className="text-rose-500 text-[10px] mt-1">{errors.doc_date.message}</p>}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1 pl-0.5">เรื่อง (ชื่อหัวข้อเอกสาร) *</label>
                <input
                  type="text"
                  placeholder="เช่น เรื่องขอรายงานสถิติข้อมูลนักเรียน หรือ นโยบายการยกระดับผลสัมฤทธิ์..."
                  {...register('title')}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-xs"
                />
                {errors.title && <p className="text-rose-500 text-[10px] mt-1">{errors.title.message}</p>}
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1 pl-0.5">รายละเอียดเพิ่มเติม / สรุปย่อ</label>
                <textarea
                  rows={3}
                  placeholder="ข้อมูลหรือข้อความสรุปย่อในหนังสือสำหรับนำเสนอผู้อำนวยการลงนามสั่งการ..."
                  {...register('description')}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-xs resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1 pl-0.5">ชื่อผู้ส่ง *</label>
                  <input
                    type="text"
                    placeholder="หน่วยงานภายนอก หรือ บุคลากรผู้เสนอ"
                    {...register('sender')}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-xs"
                  />
                  {errors.sender && <p className="text-rose-500 text-[10px] mt-1">{errors.sender.message}</p>}
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1 pl-0.5">ชื่อผู้รับ *</label>
                  <input
                    type="text"
                    {...register('receiver')}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-xs"
                  />
                  {errors.receiver && <p className="text-rose-500 text-[10px] mt-1">{errors.receiver.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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

                <div>
                  <label className="block font-semibold text-slate-600 mb-1 pl-0.5">สถานะตั้งต้น</label>
                  <select
                    {...register('status')}
                    className="w-full py-2.5 px-3 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer"
                  >
                    <option value="pending_approval">เสนอผู้อำนวยการลงนาม (Pending)</option>
                    <option value="approved">อนุมัติลงนามแล้ว (Approved)</option>
                    <option value="draft">บันทึกเป็นฉบับร่าง (Draft)</option>
                  </select>
                </div>
              </div>

              {/* Submit Buttons */}
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
                  {editingDoc ? 'บันทึกการแก้ไข' : 'ลงรับเอกสาร'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
