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
        transition-all duration-200 ease-in-out
        ${isDragActive 
          ? 'border-blue-400 bg-blue-50 scale-[1.01]' 
          : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-gray-50'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <input {...getInputProps()} />
      
      <div className="px-8 py-16 text-center">
        {/* Icon */}
        <div className={`
          mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-6
          transition-colors duration-200
          ${isDragActive ? 'bg-blue-100' : 'bg-gray-100'}
        `}>
          <svg 
            className={`w-8 h-8 transition-colors duration-200 ${isDragActive ? 'text-blue-600' : 'text-gray-400'}`}
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
        <div className="space-y-2">
          <p className="text-lg font-medium text-gray-900">
            {isDragActive ? 'Drop your image here' : 'Drop an image or click to upload'}
          </p>
          <p className="text-sm text-gray-500">
            PNG, JPG, WebP up to {formatFileSize(MAX_FILE_SIZE)}
          </p>
        </div>

        {/* Button */}
        <div className="mt-6">
          <span 
            className="btn-gradient inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Select image
          </span>
        </div>
      </div>

      {/* Animated border gradient when dragging */}
      {isDragActive && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-sky-500/10 to-blue-500/10 animate-pulse" />
        </div>
      )}
    </div>
  );
}
