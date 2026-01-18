'use client';

import Image from 'next/image';
import type { ProcessingStatus } from '@/types';

interface ProcessingProgressProps {
  items: ProcessingStatus[];
}

export default function ProcessingProgress({ items }: ProcessingProgressProps) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
        Processing
      </h3>
      <div className="space-y-3">
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
        return { label: 'Queued', color: 'bg-gray-300' };
      case 'removing-bg':
        return { label: 'Removing background', color: 'bg-blue-500' };
      case 'flipping':
        return { label: 'Processing', color: 'bg-blue-500' };
      case 'uploading':
        return { label: 'Uploading', color: 'bg-blue-500' };
      case 'saving':
        return { label: 'Saving', color: 'bg-blue-500' };
      case 'complete':
        return { label: 'Done', color: 'bg-emerald-500' };
      case 'error':
        return { label: 'Failed', color: 'bg-red-500' };
      default:
        return { label: 'Processing', color: 'bg-gray-400' };
    }
  };

  const { label, color } = getStageInfo();
  const progress = Math.round(item.progress * 100);

  return (
    <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 p-4 animate-fadeIn">
      <div className="flex items-center gap-4">
        {/* Thumbnail placeholder */}
        <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden relative">
          {item.stage === 'complete' && item.result ? (
            <Image 
              src={item.result.blob_url} 
              alt="" 
              fill
              sizes="44px"
              className="object-cover"
            />
          ) : item.stage === 'error' ? (
            <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-900 truncate">
              {item.file.name}
            </p>
            <span className={`
              text-xs font-medium px-2.5 py-1 rounded-lg
              ${item.stage === 'complete' ? 'bg-emerald-50 text-emerald-700' : ''}
              ${item.stage === 'error' ? 'bg-red-50 text-red-700' : ''}
              ${!['complete', 'error'].includes(item.stage) ? 'bg-blue-50 text-blue-700' : ''}
            `}>
              {label}
            </span>
          </div>

          {/* Progress bar */}
          {item.stage !== 'error' && (
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ease-out ${color}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {/* Error message */}
          {item.stage === 'error' && item.error && (
            <p className="text-xs text-red-600 mt-1.5">{item.error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
