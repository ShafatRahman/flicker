'use client';

import { removeBackground, type Config } from '@imgly/background-removal';

export const SUPPORTED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/bmp',
  'image/tiff',
  'image/gif',
];

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const WARN_FILE_SIZE = 25 * 1024 * 1024; // 25MB

export function validateFile(file: File): { valid: boolean; error?: string; warning?: string } {
  if (!SUPPORTED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Unsupported file type: ${file.type}. Supported: JPEG, PNG, WebP, BMP, TIFF, GIF`,
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File too large (${formatFileSize(file.size)}). Maximum size is 50MB.`,
    };
  }

  if (file.size > WARN_FILE_SIZE) {
    return {
      valid: true,
      warning: `Large file (${formatFileSize(file.size)}) - processing may take longer.`,
    };
  }

  return { valid: true };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export type ProgressCallback = (stage: string, progress: number) => void;

export async function processImage(
  file: File,
  onProgress?: ProgressCallback
): Promise<Blob> {
  // Step 1: Remove background (0-80% of progress)
  onProgress?.('Removing background...', 0);

  const config: Config = {
    progress: (_key: string, current: number, total: number) => {
      if (total > 0 && onProgress) {
        const progress = (current / total) * 0.8;
        onProgress('Removing background...', progress);
      }
    },
    output: {
      format: 'image/png',
      quality: 1,
    },
  };

  const noBgBlob = await removeBackground(file, config);

  // Step 2: Flip horizontally (80-100%)
  onProgress?.('Flipping image...', 0.8);
  const flippedBlob = await flipHorizontal(noBgBlob);

  onProgress?.('Complete', 1);
  return flippedBlob;
}

async function flipHorizontal(blob: Blob): Promise<Blob> {
  const img = await createImageBitmap(blob);
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  // Flip horizontally
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(img, 0, 0);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob from canvas'));
        }
      },
      'image/png',
      1
    );
  });
}
