'use server';

import { createServiceClient } from '@/lib/supabase/server';
import type { User } from '@/types';

export async function getOrCreateUser(sessionId: string): Promise<User> {
  const supabase = createServiceClient();

  // Try to find existing user by session_id
  const { data: existingUser } = await supabase
    .from('users')
    .select('*')
    .eq('session_id', sessionId)
    .single();

  if (existingUser) return existingUser;

  // Create new user
  const { data: newUser, error } = await supabase
    .from('users')
    .insert({ session_id: sessionId })
    .select()
    .single();

  if (error) throw new Error(`Failed to create user: ${error.message}`);
  return newUser;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const supabase = createServiceClient();

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  return user;
}

export async function linkEmailToUser(sessionId: string, email: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceClient();

  // Check if email is already in use by another user
  const { data: existingEmail } = await supabase
    .from('users')
    .select('id, session_id')
    .eq('email', email)
    .single();

  if (existingEmail && existingEmail.session_id !== sessionId) {
    return { success: false, error: 'Email is already in use by another account' };
  }

  // Update user with email and mark as verified
  const { error: updateError } = await supabase
    .from('users')
    .update({ 
      email,
      email_verified: true 
    })
    .eq('session_id', sessionId);

  if (updateError) {
    return { success: false, error: 'Failed to link email. Please try again.' };
  }

  // Get user id to update their images
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('session_id', sessionId)
    .single();

  if (user) {
    // Remove expiration from all user's images
    const { error: updateImagesError } = await supabase
      .from('images')
      .update({ expires_at: null })
      .eq('user_id', user.id);

    if (updateImagesError) {
      console.error('Error removing image expiration:', updateImagesError);
    }
  }

  return { success: true };
}

export async function mergeAnonymousToAuthUser(
  anonymousSessionId: string, 
  authUserId: string, 
  email: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceClient();

  // Find the anonymous user
  const { data: anonymousUser } = await supabase
    .from('users')
    .select('id')
    .eq('session_id', anonymousSessionId)
    .single();

  // Find or create auth user
  let { data: authUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (!authUser) {
    // Create new user for the auth user
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        session_id: authUserId,
        email,
        email_verified: true,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: 'Failed to create user' };
    }
    authUser = newUser;
  } else {
    // Update auth user's session_id
    const { error: updateSessionError } = await supabase
      .from('users')
      .update({ session_id: authUserId, email_verified: true })
      .eq('id', authUser.id);

    if (updateSessionError) {
      console.error('Error updating session ID:', updateSessionError);
    }
  }

  // If there was an anonymous user with images, transfer them
  if (anonymousUser && authUser && anonymousUser.id !== authUser.id) {
    // Transfer images to auth user
    const { error: transferError } = await supabase
      .from('images')
      .update({ 
        user_id: authUser.id,
        expires_at: null // Remove expiration for claimed images
      })
      .eq('user_id', anonymousUser.id);

    if (transferError) {
      console.error('Error transferring images:', transferError);
    }

    // Delete anonymous user
    const { error: deleteUserError } = await supabase
      .from('users')
      .delete()
      .eq('id', anonymousUser.id);

    if (deleteUserError) {
      console.error('Error deleting anonymous user:', deleteUserError);
    }
  }

  // Remove expiration from all auth user's images
  if (authUser) {
    const { error: updateError } = await supabase
      .from('images')
      .update({ expires_at: null })
      .eq('user_id', authUser.id);

    if (updateError) {
      console.error('Error removing image expiration:', updateError);
    }
  }

  return { success: true };
}

export async function recoverByEmail(email: string) {
  const supabase = createServiceClient();

  // Check if user exists with this email
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .eq('email_verified', true)
    .single();

  if (!user) {
    return { success: false, error: 'No verified account found with this email' };
  }

  return { success: true, message: 'Please sign in with your email and password' };
}
