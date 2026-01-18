import { createBrowserClient } from '@supabase/ssr';

function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL');
  }
  return url;
}

function getSupabasePublicKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_KEY;
  if (!key) {
    throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_KEY');
  }
  return key;
}

export function createClient() {
  return createBrowserClient(
    getSupabaseUrl(),
    getSupabasePublicKey()
  );
}
