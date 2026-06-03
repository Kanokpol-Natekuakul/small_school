import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fileStorageService, validateFile, formatFileSize } from './fileStorage';

// Mock Supabase backend module to run fileStorageService in mock mode
vi.mock('./supabase', () => ({
  isSupabaseBackend: false,
  supabase: {},
  backendRuntimeMode: 'mock'
}));

describe('fileStorageService & validateFile tests', () => {
  beforeEach(() => {
    // Revoke any created URLs or reset memory mapping if needed,
    // but in test isolation we just want basic CRUD behavior verification.
  });

  describe('validateFile', () => {
    it('allows valid MIME types', () => {
      const validPdf = new File(['pdf-content'], 'test.pdf', { type: 'application/pdf' });
      expect(validateFile(validPdf)).toBeNull();

      const validPng = new File(['png-content'], 'test.png', { type: 'image/png' });
      expect(validateFile(validPng)).toBeNull();
    });

    it('rejects invalid MIME types', () => {
      const invalidTxt = new File(['text'], 'test.txt', { type: 'text/plain' });
      expect(validateFile(invalidTxt)).not.toBeNull();
    });

    it('rejects files exceeding max size (10MB)', () => {
      const largeFile = new File([''], 'large.pdf', { type: 'application/pdf' });
      // Stub the size to 11MB
      Object.defineProperty(largeFile, 'size', { value: 11 * 1024 * 1024 });
      
      expect(validateFile(largeFile)).toContain('ขนาดไฟล์เกิน 10MB');
    });
  });

  describe('formatFileSize', () => {
    it('formats bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 B');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1024 * 1024 * 1.5)).toBe('1.5 MB');
    });
  });

  describe('fileStorageService CRUD', () => {
    it('uploads a file and gets attachments in mock mode', async () => {
      const pdf = new File(['content'], 'agreement.pdf', { type: 'application/pdf' });
      const docId = 'doc-123';

      const attachment = await fileStorageService.uploadFile(pdf, docId);

      expect(attachment.id).toBeDefined();
      expect(attachment.document_id).toBe(docId);
      expect(attachment.file_name).toBe('agreement.pdf');
      expect(attachment.file_url).toContain('blob:');

      const attachments = await fileStorageService.getAttachments(docId);
      expect(attachments.length).toBe(1);
      expect(attachments[0].id).toBe(attachment.id);
    });

    it('deletes an uploaded file attachment', async () => {
      const png = new File(['content'], 'logo.png', { type: 'image/png' });
      const docId = 'doc-456';

      const attachment = await fileStorageService.uploadFile(png, docId);
      let attachments = await fileStorageService.getAttachments(docId);
      expect(attachments.length).toBe(1);

      await fileStorageService.deleteFile(attachment.id);

      attachments = await fileStorageService.getAttachments(docId);
      expect(attachments.length).toBe(0);
    });
  });
});
