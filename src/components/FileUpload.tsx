import React, { useState, useRef } from 'react';
import { UploadCloud, File, AlertCircle, Trash2 } from 'lucide-react';
import { validateFile, formatFileSize, ALLOWED_EXTENSIONS } from '../lib/fileStorage';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  selectedFiles: File[];
  onRemoveFile: (index: number) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFilesSelected,
  selectedFiles,
  onRemoveFile,
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    setError(null);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      const validFiles: File[] = [];

      for (const file of filesArray) {
        const validationError = validateFile(file);
        if (validationError) {
          setError(validationError);
          return;
        }
        validFiles.push(file);
      }

      onFilesSelected([...selectedFiles, ...validFiles]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setError(null);

    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      const validFiles: File[] = [];

      for (const file of filesArray) {
        const validationError = validateFile(file);
        if (validationError) {
          setError(validationError);
          return;
        }
        validFiles.push(file);
      }

      onFilesSelected([...selectedFiles, ...validFiles]);
    }
  };

  const onButtonClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className="space-y-3">
      <label className="block font-semibold text-slate-600 mb-1 pl-0.5">แนบไฟล์เอกสาร</label>
      
      {/* Upload Drag Area */}
      <div
        data-testid="drag-drop-area"
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
          isDragActive
            ? 'border-emerald-500 bg-emerald-50/30'
            : 'border-slate-200 hover:border-slate-300 bg-slate-50/30 hover:bg-slate-50/80'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ALLOWED_EXTENSIONS}
          onChange={handleChange}
          className="hidden"
          data-testid="file-upload-input"
        />
        
        <UploadCloud className="h-8 w-8 text-slate-400 mx-auto mb-2.5" />
        <p className="text-xs text-slate-600 font-medium">
          ลากไฟล์มาวางที่นี่ หรือ <span className="text-emerald-600 hover:text-emerald-700 font-bold">คลิกเพื่อเลือกไฟล์</span>
        </p>
        <p className="text-[10px] text-slate-400 mt-1.5">
          รองรับ PDF, JPG, PNG, DOC, DOCX (สูงสุด 10MB)
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-1.5 text-[10px] text-rose-500 font-bold" data-testid="upload-error">
          <AlertCircle className="h-3.5 w-3.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2" data-testid="selected-files-list">
          {selectedFiles.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl shadow-xs"
              data-testid="selected-file-item"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <File className="h-4 w-4 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-700 truncate" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-[9px] text-slate-400">{formatFileSize(file.size)}</p>
                </div>
              </div>
              
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveFile(index);
                }}
                className="p-1.5 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-lg text-slate-400 hover:text-rose-500 transition-all cursor-pointer"
                aria-label={`ลบไฟล์ ${file.name}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
