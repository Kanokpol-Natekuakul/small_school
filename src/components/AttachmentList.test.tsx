import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AttachmentList } from './AttachmentList';
import type { DocumentAttachment } from '../types';

describe('AttachmentList Component', () => {
  const sampleAttachments: DocumentAttachment[] = [
    {
      id: 'att-1',
      document_id: 'doc-123',
      file_name: 'test.pdf',
      file_size: 1024 * 500, // 500 KB
      file_type: 'application/pdf',
      file_url: 'http://example.com/test.pdf',
      created_at: '2026-05-20T10:00:00Z',
    },
    {
      id: 'att-2',
      document_id: 'doc-123',
      file_name: 'photo.jpg',
      file_size: 1024 * 1024, // 1 MB
      file_type: 'image/jpeg',
      file_url: 'http://example.com/photo.jpg',
      created_at: '2026-05-20T10:00:00Z',
    }
  ];

  it('renders empty state when no attachments exist', () => {
    render(<AttachmentList attachments={[]} />);
    expect(screen.getByText('ไม่มีไฟล์แนบในเอกสารฉบับนี้')).toBeInTheDocument();
  });

  it('renders list of attachments with correct details', () => {
    render(<AttachmentList attachments={sampleAttachments} />);

    expect(screen.getByTestId('attachment-list')).toBeInTheDocument();
    const items = screen.getAllByTestId('attachment-item');
    expect(items.length).toBe(2);

    expect(screen.getByText('test.pdf')).toBeInTheDocument();
    expect(screen.getByText('500 KB')).toBeInTheDocument();
    expect(screen.getByText('ประเภท: PDF')).toBeInTheDocument();

    expect(screen.getByText('photo.jpg')).toBeInTheDocument();
    expect(screen.getByText('1 MB')).toBeInTheDocument();
    expect(screen.getByText('ประเภท: JPEG')).toBeInTheDocument();
  });

  it('provides a download link with correct URL and download attribute', () => {
    render(<AttachmentList attachments={sampleAttachments} />);

    const downloadLinks = screen.getAllByTestId('attachment-download-btn');
    expect(downloadLinks[0]).toHaveAttribute('href', 'http://example.com/test.pdf');
    expect(downloadLinks[0]).toHaveAttribute('download', 'test.pdf');
  });

  it('hides delete button when canDelete is false', () => {
    render(<AttachmentList attachments={sampleAttachments} canDelete={false} />);
    expect(screen.queryByTestId('attachment-delete-btn')).not.toBeInTheDocument();
  });

  it('calls onDelete callback when delete button is clicked and confirmed', () => {
    const onDeleteMock = vi.fn();
    // Mock window.confirm to auto-approve deletion
    const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => true);

    render(
      <AttachmentList
        attachments={sampleAttachments}
        canDelete={true}
        onDelete={onDeleteMock}
      />
    );

    const deleteBtns = screen.getAllByTestId('attachment-delete-btn');
    fireEvent.click(deleteBtns[0]);

    expect(confirmSpy).toHaveBeenCalled();
    expect(onDeleteMock).toHaveBeenCalledWith('att-1');

    confirmSpy.mockRestore();
  });
});
