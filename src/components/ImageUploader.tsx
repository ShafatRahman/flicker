'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { SUPPORTED_TYPES, MAX_FILE_SIZE, formatFileSize } from '@/lib/image-processing';

interface ImageUploaderProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

export default function ImageUploader({ onFilesSelected, disabled }: ImageUploaderProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (disabled) return;
      
      const validFiles = acceptedFiles.filter((file) => {
        if (!SUPPORTED_TYPES.includes(file.type)) {
          console.warn(`Unsupported file type: ${file.type}`);
          return false;
        }
        if (file.size > MAX_FILE_SIZE) {
          console.warn(`File too large: ${file.name}`);
          return false;
        }
        return true;
      });

      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
      }
    },
    [onFilesSelected, disabled]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.bmp', '.gif'],
    },
    disabled,
    multiple: false,
    maxFiles: 1,
  });

  return (
    <div
      {...getRootProps()}
      className={`
        relative overflow-hidden
        border-2 border-dashed rounded-2xl
        transition-all duration-300 ease-out
        ${isDragActive 
          ? 'border-blue-400 bg-gradient-to-br from-blue-50 to-indigo-50 scale-[1.02]' 
          : 'border-gray-200 bg-gradient-to-br from-gray-50/50 to-white hover:border-blue-300 hover:from-blue-50/30 hover:to-white'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <input {...getInputProps()} />
      
      <div className="px-8 py-12 text-center">
        {/* Icon */}
        <div className={`
          mx-auto w-14 h-14 rounded-xl flex items-center justify-center mb-5
          transition-all duration-300
          ${isDragActive ? 'bg-blue-100 scale-110' : 'bg-gray-100'}
        `}>
          <svg 
            className={`w-7 h-7 transition-colors duration-200 ${isDragActive ? 'text-blue-600' : 'text-gray-400'}`}
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
            />
          </svg>
        </div>

        {/* Text */}
        <div className="space-y-1.5">
          <p className="text-base font-semibold text-gray-900 tracking-tight">
            {isDragActive ? 'Drop your image here' : 'Drop an image or click to upload'}
          </p>
          <p className="text-sm text-gray-500">
            PNG, JPG, WebP up to {formatFileSize(MAX_FILE_SIZE)}
          </p>
        </div>

        {/* Button */}
        <div className="mt-5">
          <span className="btn-gradient inline-flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Choose file
          </span>
        </div>
      </div>

      {/* Animated gradient overlay when dragging */}
      {isDragActive && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-purple-500/5" />
        </div>
      )}
    </div>
  );
}
