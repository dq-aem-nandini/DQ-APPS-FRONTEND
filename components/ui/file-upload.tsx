// components/ui/file-upload.tsx
'use client';

import { Upload, X } from 'lucide-react';
import { useState } from 'react';
import { Label } from '@/components/ui/label';

interface FileUploadProps {
  onFileChange: (file: File | null) => void;
  accept?: string;
  label?: string;
}

export function FileUpload({ onFileChange, accept = '*', label }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = (file: File | null) => {
    setFile(file);
    onFileChange(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0]);
  };

  return (
    <div>
      {label && <Label className="mb-2">{label}</Label>}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept={accept}
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <Upload className="mx-auto h-10 w-10 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          {file ? file.name : 'Drag & drop or click to upload'}
        </p>
        {file && (
          <button
            type="button"
            onClick={() => handleFile(null)}
            className="mt-2 inline-flex items-center text-xs text-red-600 hover:text-red-800"
          >
            <X className="h-3 w-3 mr-1" /> Remove
          </button>
        )}
      </div>
    </div>
  );
}