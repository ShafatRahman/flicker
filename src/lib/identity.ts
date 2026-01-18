'use client';

import { createClient } from '@/lib/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export function getSessionId(): string {
  if (typeof window === 'undefined') return '';

  let sessionId = localStorage.getItem('sessionId');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('sessionId', sessionId);
  }
  return sessionId;
}

export function setSessionId(id: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('sessionId', id);
}

export async function getAuthUser(): Promise<SupabaseUser | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function signOut(): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut({ scope: 'local' });
  if (error) {
    console.error('Sign out error:', error);
    throw error;
  }
  // Clear local session
  if (typeof window !== 'undefined') {
    localStorage.removeItem('sessionId');
    localStorage.removeItem('anonymousSessionId');
  }
}

export function getExpirationDate(): Date {
  const date = new Date();
  date.setDate(date.getDate() + 3); // 3 days from now
  return date;
}
