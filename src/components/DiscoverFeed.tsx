'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { getPublicImages } from '@/actions/images';
import type { PublicImage } from '@/types';

export default function DiscoverFeed() {
  const [images, setImages] = useState<PublicImage[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const observerRef = useRef<HTMLDivElement>(null);

  const loadImages = useCallback(async (pageNum: number, reset: boolean = false, currentlyLoading: boolean = false) => {
    if (currentlyLoading && !reset) return;
    
    setIsLoading(true);
    try {
      const result = await getPublicImages(pageNum);
      
      if (pageNum === 0) {
        setImages(result.images);
      } else {
        setImages(prev => [...prev, ...result.images]);
      }
      setHasMore(result.hasMore);
    } catch (error) {
      console.error('Failed to load images:', error);
    } finally {
      setIsLoading(false);
      setInitialLoading(false);
    }
  }, []);

  // Initial load - runs every time component mounts
  useEffect(() => {
    setInitialLoading(true);
    setPage(0);
    loadImages(0, true, false);
  }, [loadImages]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          const newPage = page + 1;
          setPage(newPage);
          loadImages(newPage, false, isLoading);
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoading, page, loadImages]);

  if (initialLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">No public images yet</h3>
        <p className="text-gray-500">Be the first to share an image!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {images.map((image) => (
        <ImagePost key={image.id} image={image} />
      ))}

      {/* Infinite scroll trigger */}
      <div ref={observerRef} className="py-4 flex justify-center">
        {isLoading && (
          <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
        )}
        {!hasMore && images.length > 0 && (
          <p className="text-gray-400 text-sm">No more images to load</p>
        )}
      </div>
    </div>
  );
}

function ImagePost({ image }: { image: PublicImage }) {
  const userEmail = image.user?.email || 'Anonymous';
  const userInitial = userEmail.charAt(0).toUpperCase();
  const displayName = userEmail.split('@')[0];
  const timeAgo = getTimeAgo(new Date(image.created_at));

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold">
          {userInitial}
        </div>
        <div>
          <p className="font-semibold text-gray-900">{displayName}</p>
          <p className="text-xs text-gray-500">{timeAgo}</p>
        </div>
      </div>

      {/* Image */}
      <div className="bg-gray-100 relative w-full" style={{ minHeight: '300px', maxHeight: '600px', aspectRatio: '1' }}>
        <Image
          src={image.blob_url}
          alt={image.original_filename || 'Shared image'}
          fill
          sizes="(max-width: 672px) 100vw, 672px"
          className="object-contain"
        />
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 truncate">
            {image.original_filename || 'Untitled'}
          </p>
          <button
            onClick={() => {
              const link = document.createElement('a');
              link.href = image.blob_url;
              link.download = image.original_filename || 'image.png';
              link.click();
            }}
            className="text-blue-500 hover:text-blue-600 text-sm font-medium flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </button>
        </div>
      </div>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}
