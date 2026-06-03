import React from 'react';
import { Download, Trash2, FileText, Image, File } from 'lucide-react';
import { formatFileSize, getFileTypeLabel } from '../lib/fileStorage';
import type { DocumentAttachment } from '../types';

interface AttachmentListProps {
  attachments: DocumentAttachment[];
  onDelete?: (attachmentId: string) => void;
  canDelete?: boolean;
}

export const AttachmentList: React.FC<AttachmentListProps> = ({
  attachments,
  onDelete,
  canDelete = false,
}) => {
  const getIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <Image className="h-4.5 w-4.5 text-blue-500" />;
    }
    if (fileType === 'application/pdf') {
      return <FileText className="h-4.5 w-4.5 text-rose-500" />;
    }
    return <File className="h-4.5 w-4.5 text-emerald-500" />;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear() + 543; // Buddhist Era
    return `${day}/${month}/${year}`;
  };

  if (attachments.length === 0) {
    return (
      <div className="text-center py-6 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
        <p className="text-xs text-slate-400 font-medium">ไม่มีไฟล์แนบในเอกสารฉบับนี้</p>
      </div>
    );
  }

  return (
    <div className="space-y-2" data-testid="attachment-list">
      <h5 className="text-xs font-semibold text-slate-500 pl-0.5">เอกสารแนบ ({attachments.length} ไฟล์)</h5>
      
      <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl bg-white shadow-xs overflow-hidden">
        {attachments.map((att) => (
          <div
            key={att.id}
            className="flex items-center justify-between p-3.5 hover:bg-slate-50/40 transition-colors"
            data-testid="attachment-item"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl shrink-0">
                {getIcon(att.file_type)}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-700 truncate max-w-xs md:max-w-md" title={att.file_name}>
                  {att.file_name}
                </p>
                <div className="flex items-center gap-2 mt-0.5 text-[9px] text-slate-400 font-medium">
                  <span>{formatFileSize(att.file_size)}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                  <span>ประเภท: {getFileTypeLabel(att.file_type)}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                  <span>แนบเมื่อ: {formatDate(att.created_at)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 ml-3">
              {/* Download link */}
              <a
                href={att.file_url}
                download={att.file_name}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 hover:bg-emerald-50 border border-transparent hover:border-emerald-100 rounded-lg text-slate-400 hover:text-emerald-600 transition-all cursor-pointer"
                title="ดาวน์โหลดไฟล์"
                data-testid="attachment-download-btn"
              >
                <Download className="h-3.5 w-3.5" />
              </a>

              {/* Delete button */}
              {canDelete && onDelete && (
                <button
                  onClick={() => {
                    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบไฟล์แนบนี้?')) {
                      onDelete(att.id);
                    }
                  }}
                  className="p-1.5 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-lg text-slate-400 hover:text-rose-500 transition-all cursor-pointer"
                  title="ลบไฟล์แนบ"
                  data-testid="attachment-delete-btn"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
