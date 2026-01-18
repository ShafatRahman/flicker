import { createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

const BUCKET_NAME = 'images';

export async function GET(request: Request) {
  // Verify cron secret (Vercel sets this automatically)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();

  // Find expired images
  const { data: expiredImages, error: fetchError } = await supabase
    .from('images')
    .select('id, blob_url')
    .lt('expires_at', new Date().toISOString())
    .not('expires_at', 'is', null);

  if (fetchError) {
    console.error('Failed to fetch expired images:', fetchError);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  if (!expiredImages?.length) {
    return NextResponse.json({ deleted: 0, message: 'No expired images found' });
  }

  // Extract paths from URLs and delete from Supabase Storage
  const pathsToDelete: string[] = [];
  for (const image of expiredImages) {
    const path = getPathFromUrl(image.blob_url);
    if (path) {
      pathsToDelete.push(path);
    }
  }

  if (pathsToDelete.length > 0) {
    const { error: storageError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove(pathsToDelete);

    if (storageError) {
      console.error('Failed to delete from storage:', storageError);
      // Continue anyway - files might already be deleted
    }
  }

  // Delete from database
  const ids = expiredImages.map((img) => img.id);
  const { error: deleteError } = await supabase
    .from('images')
    .delete()
    .in('id', ids);

  if (deleteError) {
    console.error('Failed to delete from database:', deleteError);
    return NextResponse.json(
      { error: 'Database delete error', deleted: 0 },
      { status: 500 }
    );
  }

  console.log(`Cleanup: Deleted ${expiredImages.length} expired images`);
  return NextResponse.json({ deleted: expiredImages.length });
}

// Extract path from full URL for deletion
function getPathFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    // URL format: https://xxx.supabase.co/storage/v1/object/public/images/userId/filename.png
    const match = urlObj.pathname.match(/\/storage\/v1\/object\/public\/images\/(.+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}
