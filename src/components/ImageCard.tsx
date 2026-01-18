'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { Image as ImageType } from '@/types';
import { deleteImage } from '@/actions/images';

interface ImageCardProps {
  image: ImageType;
  userId: string;
  onDeleted: (imageId: string) => void;
}

export default function ImageCard({ image, userId, onDeleted }: ImageCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Delete this image?')) return;
    
    setIsDeleting(true);
    try {
      const result = await deleteImage(image.id, userId);
      if (result.success) {
        onDeleted(image.id);
      } else {
        alert(result.error || 'Failed to delete');
      }
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete image');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(image.blob_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('Failed to copy URL');
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = image.blob_url;
    link.download = image.original_filename || 'processed-image.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate time remaining
  const getExpiryInfo = () => {
    if (!image.expires_at) return null;
    
    const expiresAt = new Date(image.expires_at);
    const now = new Date();
    const diffMs = expiresAt.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return { text: 'Expiring soon', urgent: true };
    if (diffDays === 1) return { text: '1 day left', urgent: true };
    return { text: `${diffDays} days left`, urgent: false };
  };

  const expiryInfo = getExpiryInfo();

  return (
    <div 
      className="group relative bg-white rounded-2xl border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-gray-300"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Image */}
      <div className="aspect-square bg-[repeating-conic-gradient(#f3f4f6_0%_25%,#ffffff_0%_50%)] bg-[length:20px_20px] relative">
        <Image
          src={image.blob_url}
          alt={image.original_filename || 'Processed image'}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-contain"
        />
      </div>

      {/* Overlay actions */}
      <div className={`
        absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent
        flex flex-col justify-end p-4
        transition-opacity duration-200
        ${showActions ? 'opacity-100' : 'opacity-0'}
      `}>
        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyUrl}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white/90 hover:bg-white text-gray-900 text-sm font-medium rounded-lg transition-colors"
          >
            {copied ? (
              <>
                <CheckIcon />
                Copied
              </>
            ) : (
              <>
                <LinkIcon />
                Copy URL
              </>
            )}
          </button>
          <button
            onClick={handleDownload}
            className="p-2 bg-white/90 hover:bg-white text-gray-900 rounded-lg transition-colors"
            title="Download"
          >
            <DownloadIcon />
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-2 bg-white/90 hover:bg-red-50 text-gray-900 hover:text-red-600 rounded-lg transition-colors disabled:opacity-50"
            title="Delete"
          >
            {isDeleting ? <SpinnerIcon /> : <TrashIcon />}
          </button>
        </div>
      </div>

      {/* Expiry badge */}
      {expiryInfo && (
        <div className={`
          absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-medium
          ${expiryInfo.urgent 
            ? 'bg-amber-100 text-amber-700' 
            : 'bg-gray-100 text-gray-600'
          }
        `}>
          {expiryInfo.text}
        </div>
      )}

      {/* Filename */}
      <div className="px-4 py-3 border-t border-gray-100">
        <p className="text-sm text-gray-600 truncate" title={image.original_filename || undefined}>
          {image.original_filename || 'Untitled'}
        </p>
      </div>
    </div>
  );
}

function LinkIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}
