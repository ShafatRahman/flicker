'use server';

import { createServiceClient } from '@/lib/supabase/server';
import type { Image, PublicImage } from '@/types';

const BUCKET_NAME = 'images';
const PAGE_SIZE = 12;

export async function saveImageMetadata(
  userId: string,
  blobUrl: string,
  originalFilename: string,
  fileSize: number,
  isClaimed: boolean = false
): Promise<Image> {
  const supabase = createServiceClient();

  const expiresAt = isClaimed
    ? null
    : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(); // 3 days

  const { data, error } = await supabase
    .from('images')
    .insert({
      user_id: userId,
      blob_url: blobUrl,
      original_filename: originalFilename,
      file_size: fileSize,
      expires_at: expiresAt,
      is_public: false, // Default to private
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to save image: ${error.message}`);
  return data;
}

export async function deleteImage(imageId: string, userId: string) {
  const supabase = createServiceClient();

  // Get image and verify ownership
  const { data: image, error: fetchError } = await supabase
    .from('images')
    .select('blob_url, user_id')
    .eq('id', imageId)
    .single();

  if (fetchError || !image) {
    return { success: false, error: 'Image not found' };
  }

  if (image.user_id !== userId) {
    return { success: false, error: 'Unauthorized' };
  }

  // Delete from Supabase Storage
  const path = getPathFromUrl(image.blob_url);
  if (path) {
    const { error: storageError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([path]);

    if (storageError) {
      console.error('Failed to delete from storage:', storageError);
    }
  }

  // Delete from database
  const { error: deleteError } = await supabase
    .from('images')
    .delete()
    .eq('id', imageId);

  if (deleteError) {
    return { success: false, error: 'Failed to delete image record' };
  }

  return { success: true };
}

export async function getUserImages(userId: string): Promise<Image[]> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('images')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch images: ${error.message}`);
  return data || [];
}

export async function toggleImageVisibility(imageId: string, userId: string, isPublic: boolean) {
  const supabase = createServiceClient();

  // Verify ownership
  const { data: image, error: fetchError } = await supabase
    .from('images')
    .select('user_id')
    .eq('id', imageId)
    .single();

  if (fetchError || !image) {
    return { success: false, error: 'Image not found' };
  }

  if (image.user_id !== userId) {
    return { success: false, error: 'Unauthorized' };
  }

  // Update visibility
  const { error: updateError } = await supabase
    .from('images')
    .update({ is_public: isPublic })
    .eq('id', imageId);

  if (updateError) {
    return { success: false, error: 'Failed to update visibility' };
  }

  return { success: true };
}

export async function getPublicImages(page: number = 0): Promise<{ images: PublicImage[]; hasMore: boolean }> {
  const supabase = createServiceClient();

  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data, error, count } = await supabase
    .from('images')
    .select(`
      *,
      user:users!images_user_id_fkey (
        email
      )
    `, { count: 'exact' })
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    console.error('Failed to fetch public images:', error);
    return { images: [], hasMore: false };
  }

  const totalCount = count || 0;
  const hasMore = from + PAGE_SIZE < totalCount;

  return { 
    images: data || [], 
    hasMore 
  };
}

export async function removeExpiration(userId: string) {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from('images')
    .update({ expires_at: null })
    .eq('user_id', userId);

  if (error) {
    return { success: false, error: 'Failed to remove expiration' };
  }

  return { success: true };
}

// Extract path from full URL for deletion
function getPathFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const match = urlObj.pathname.match(/\/storage\/v1\/object\/public\/images\/(.+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}
