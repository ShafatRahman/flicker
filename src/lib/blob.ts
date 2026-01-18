'use client';

import { createClient } from '@/lib/supabase/client';

const BUCKET_NAME = 'images';

export async function uploadProcessedImage(
  blob: Blob,
  userId: string,
  originalFilename: string
): Promise<{ url: string; path: string }> {
  const supabase = createClient();
  
  const timestamp = Date.now();
  const safeName = originalFilename.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filePath = `${userId}/${timestamp}-${safeName}.png`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, blob, {
      contentType: 'image/png',
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path);

  return { 
    url: urlData.publicUrl,
    path: data.path 
  };
}

export async function deleteFromStorage(path: string): Promise<void> {
  const supabase = createClient();
  
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([path]);

  if (error) {
    throw new Error(`Failed to delete image: ${error.message}`);
  }
}

// Extract path from full URL for deletion
export function getPathFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    // URL format: https://xxx.supabase.co/storage/v1/object/public/images/userId/filename.png
    const match = urlObj.pathname.match(/\/storage\/v1\/object\/public\/images\/(.+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}
