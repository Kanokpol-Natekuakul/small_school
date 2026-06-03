import { supabase, isSupabaseBackend } from './supabase';
import type { DocumentAttachment } from '../types';

// Helper to generate UUIDs for mock data
const generateUUID = () =>
  Math.random().toString(36).substring(2, 15) +
  Math.random().toString(36).substring(2, 15);

// Allowed file types
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// In-memory store for mock mode
const mockFileStore = new Map<string, File>();
const mockAttachmentStore = new Map<string, DocumentAttachment>();

export const ALLOWED_EXTENSIONS = '.pdf,.jpg,.jpeg,.png,.doc,.docx';

export function validateFile(file: File): string | null {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return 'ประเภทไฟล์ไม่ถูกต้อง รองรับเฉพาะ PDF, รูปภาพ (JPG, PNG) และเอกสาร Word เท่านั้น';
  }
  if (file.size > MAX_FILE_SIZE) {
    return 'ขนาดไฟล์เกิน 10MB กรุณาเลือกไฟล์ที่มีขนาดเล็กกว่า';
  }
  return null;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function getFileTypeLabel(fileType: string): string {
  const typeMap: Record<string, string> = {
    'application/pdf': 'PDF',
    'image/jpeg': 'JPEG',
    'image/png': 'PNG',
    'application/msword': 'Word',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word',
  };
  return typeMap[fileType] || 'ไฟล์';
}

export const fileStorageService = {
  async uploadFile(file: File, documentId: string): Promise<DocumentAttachment> {
    const validationError = validateFile(file);
    if (validationError) {
      throw new Error(validationError);
    }

    if (isSupabaseBackend) {
      const filePath = `${documentId}/${generateUUID()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      const attachment: DocumentAttachment = {
        id: generateUUID(),
        document_id: documentId,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        file_url: urlData.publicUrl,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('document_attachments')
        .insert([attachment])
        .select()
        .single();

      if (error) throw error;
      return data as DocumentAttachment;
    } else {
      // Mock mode: store file in memory and create blob URL
      const attachmentId = 'att-' + generateUUID();
      const fileUrl = URL.createObjectURL(file);

      mockFileStore.set(attachmentId, file);

      const attachment: DocumentAttachment = {
        id: attachmentId,
        document_id: documentId,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        file_url: fileUrl,
        created_at: new Date().toISOString(),
      };

      mockAttachmentStore.set(attachmentId, attachment);
      return attachment;
    }
  },

  async deleteFile(attachmentId: string): Promise<void> {
    if (isSupabaseBackend) {
      const { data: attachment, error: fetchError } = await supabase
        .from('document_attachments')
        .select('file_url')
        .eq('id', attachmentId)
        .single();

      if (fetchError) throw fetchError;

      // Extract path from URL and delete from storage
      if (attachment?.file_url) {
        const urlParts = attachment.file_url.split('/documents/');
        if (urlParts.length > 1) {
          await supabase.storage.from('documents').remove([urlParts[1]]);
        }
      }

      const { error } = await supabase
        .from('document_attachments')
        .delete()
        .eq('id', attachmentId);

      if (error) throw error;
    } else {
      const attachment = mockAttachmentStore.get(attachmentId);
      if (attachment) {
        URL.revokeObjectURL(attachment.file_url);
      }
      mockFileStore.delete(attachmentId);
      mockAttachmentStore.delete(attachmentId);
    }
  },

  async getAttachments(documentId: string): Promise<DocumentAttachment[]> {
    if (isSupabaseBackend) {
      const { data, error } = await supabase
        .from('document_attachments')
        .select('*')
        .eq('document_id', documentId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as DocumentAttachment[];
    } else {
      const attachments: DocumentAttachment[] = [];
      mockAttachmentStore.forEach((attachment) => {
        if (attachment.document_id === documentId) {
          attachments.push(attachment);
        }
      });
      return attachments.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    }
  },
};
