'use client';

import Image from 'next/image';
import type { ProcessingStatus } from '@/types';

interface ProcessingProgressProps {
  items: ProcessingStatus[];
}

export default function ProcessingProgress({ items }: ProcessingProgressProps) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
        Processing
      </h3>
      <div className="space-y-2">
        {items.map((item) => (
          <ProcessingItem key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

function ProcessingItem({ item }: { item: ProcessingStatus }) {
  const getStageInfo = () => {
    switch (item.stage) {
      case 'queued':
        return { label: 'Waiting...', color: 'bg-gray-200' };
      case 'removing-bg':
        return { label: 'Removing background', color: 'bg-blue-500' };
      case 'flipping':
        return { label: 'Flipping image', color: 'bg-sky-500' };
      case 'uploading':
        return { label: 'Uploading', color: 'bg-blue-500' };
      case 'saving':
        return { label: 'Saving', color: 'bg-green-500' };
      case 'complete':
        return { label: 'Complete', color: 'bg-green-500' };
      case 'error':
        return { label: 'Failed', color: 'bg-red-500' };
      default:
        return { label: 'Processing', color: 'bg-gray-400' };
    }
  };

  const { label, color } = getStageInfo();
  const progress = Math.round(item.progress * 100);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 animate-fadeIn">
      <div className="flex items-center gap-4">
        {/* Thumbnail placeholder */}
        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden relative">
          {item.stage === 'complete' && item.result ? (
            <Image 
              src={item.result.blob_url} 
              alt="" 
              fill
              sizes="48px"
              className="object-cover"
            />
          ) : item.stage === 'error' ? (
            <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-gray-300 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-sm font-medium text-gray-900 truncate">
              {item.file.name}
            </p>
            <span className={`
              text-xs font-medium px-2 py-0.5 rounded-full
              ${item.stage === 'complete' ? 'bg-green-100 text-green-700' : ''}
              ${item.stage === 'error' ? 'bg-red-100 text-red-700' : ''}
              ${!['complete', 'error'].includes(item.stage) ? 'bg-gray-100 text-gray-600' : ''}
            `}>
              {label}
            </span>
          </div>

          {/* Progress bar */}
          {item.stage !== 'error' && (
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ease-out ${color}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {/* Error message */}
          {item.stage === 'error' && item.error && (
            <p className="text-xs text-red-600 mt-1">{item.error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
