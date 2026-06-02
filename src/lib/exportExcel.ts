import * as XLSX from 'xlsx';
import type { Document, Student } from '../types';

export const exportDocumentsToExcel = (documents: Document[], filename: string) => {
  // Format Thai labels for Excel
  const formattedData = documents.map((doc, idx) => ({
    'ลำดับที่': idx + 1,
    'เลขที่หนังสือ': doc.doc_no,
    'ลงวันที่': doc.doc_date,
    'เรื่อง': doc.title,
    'ผู้ส่ง': doc.sender,
    'ผู้รับ': doc.receiver,
    'ระดับความเร่งด่วน': doc.priority === 'normal' ? 'ปกติ' : doc.priority === 'urgent' ? 'ด่วน' : 'ด่วนที่สุด',
    'สถานะเอกสาร': doc.status === 'draft' ? 'ร่าง' : doc.status === 'pending_approval' ? 'เสนอลงนาม' : doc.status === 'approved' ? 'ลงนามแล้ว' : 'ดำเนินการเสร็จสิ้น/จัดเก็บ',
  }));

  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'ทะเบียนหนังสือ');
  
  // Save/Download Excel file
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

export const exportStudentsToExcel = (students: Student[], filename: string) => {
  const formattedData = students.map((std, idx) => ({
    'ลำดับที่': idx + 1,
    'รหัสนักเรียน': std.student_id,
    'ชื่อ': std.first_name,
    'นามสกุล': std.last_name,
    'ชั้นเรียน': std.class_level,
    'ห้องเรียน': std.classroom,
    'ชื่อผู้ปกครอง': std.guardian_name || '-',
    'เบอร์โทรผู้ปกครอง': std.guardian_phone || '-',
    'สถานะ': std.status === 'active' ? 'ปกติ' : std.status === 'suspended' ? 'พักการเรียน' : std.status === 'graduated' ? 'จบการศึกษา' : 'ย้ายสถานศึกษา',
  }));

  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'รายชื่อนักเรียน');
  
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};
