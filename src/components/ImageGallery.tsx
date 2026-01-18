'use client';

import type { Image } from '@/types';
import ImageCard from './ImageCard';

interface ImageGalleryProps {
  images: Image[];
  userId: string;
  onImageDeleted: (imageId: string) => void;
}

export default function ImageGallery({ images, userId, onImageDeleted }: ImageGalleryProps) {
  if (images.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">No images yet</h3>
        <p className="text-gray-500">Upload an image to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
          Your Images
        </h3>
        <span className="text-sm text-gray-400">
          {images.length} {images.length === 1 ? 'image' : 'images'}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {images.map((image) => (
          <ImageCard
            key={image.id}
            image={image}
            userId={userId}
            onDeleted={onImageDeleted}
          />
        ))}
      </div>
    </div>
  );
}
