import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FileUpload } from './FileUpload';

describe('FileUpload Component', () => {
  it('renders the drag-and-drop area correctly', () => {
    render(
      <FileUpload
        onFilesSelected={vi.fn()}
        selectedFiles={[]}
        onRemoveFile={vi.fn()}
      />
    );

    expect(screen.getByTestId('drag-drop-area')).toBeInTheDocument();
    expect(screen.getByText(/ลากไฟล์มาวางที่นี่ หรือ/i)).toBeInTheDocument();
  });

  it('rejects files with invalid types', () => {
    const onFilesSelectedMock = vi.fn();
    render(
      <FileUpload
        onFilesSelected={onFilesSelectedMock}
        selectedFiles={[]}
        onRemoveFile={vi.fn()}
      />
    );

    const input = screen.getByTestId('file-upload-input');
    const invalidFile = new File(['text'], 'test.txt', { type: 'text/plain' });

    fireEvent.change(input, { target: { files: [invalidFile] } });

    expect(onFilesSelectedMock).not.toHaveBeenCalled();
    expect(screen.getByTestId('upload-error')).toBeInTheDocument();
    expect(screen.getByText(/ประเภทไฟล์ไม่ถูกต้อง/i)).toBeInTheDocument();
  });

  it('rejects files with size exceeding 10MB', () => {
    const onFilesSelectedMock = vi.fn();
    render(
      <FileUpload
        onFilesSelected={onFilesSelectedMock}
        selectedFiles={[]}
        onRemoveFile={vi.fn()}
      />
    );

    const input = screen.getByTestId('file-upload-input');
    const largeFile = new File([''], 'large.pdf', { type: 'application/pdf' });
    Object.defineProperty(largeFile, 'size', { value: 11 * 1024 * 1024 }); // 11MB

    fireEvent.change(input, { target: { files: [largeFile] } });

    expect(onFilesSelectedMock).not.toHaveBeenCalled();
    expect(screen.getByTestId('upload-error')).toBeInTheDocument();
    expect(screen.getByText(/ขนาดไฟล์เกิน 10MB/i)).toBeInTheDocument();
  });

  it('displays selected files list and details', () => {
    const sampleFiles = [
      new File(['content'], 'agreement.pdf', { type: 'application/pdf' }),
      new File(['image'], 'avatar.png', { type: 'image/png' })
    ];

    render(
      <FileUpload
        onFilesSelected={vi.fn()}
        selectedFiles={sampleFiles}
        onRemoveFile={vi.fn()}
      />
    );

    expect(screen.getByTestId('selected-files-list')).toBeInTheDocument();
    const items = screen.getAllByTestId('selected-file-item');
    expect(items.length).toBe(2);
    expect(screen.getByText('agreement.pdf')).toBeInTheDocument();
    expect(screen.getByText('avatar.png')).toBeInTheDocument();
  });

  it('calls onRemoveFile when delete button is clicked', () => {
    const onRemoveFileMock = vi.fn();
    const sampleFiles = [
      new File(['content'], 'agreement.pdf', { type: 'application/pdf' })
    ];

    render(
      <FileUpload
        onFilesSelected={vi.fn()}
        selectedFiles={sampleFiles}
        onRemoveFile={onRemoveFileMock}
      />
    );

    const deleteBtn = screen.getByRole('button', { name: /ลบไฟล์ agreement.pdf/i });
    fireEvent.click(deleteBtn);

    expect(onRemoveFileMock).toHaveBeenCalledWith(0);
  });
});
