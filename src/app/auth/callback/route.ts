import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Handle error cases (expired link, etc.)
  if (error) {
    console.error('Auth error:', error, errorDescription);
    const errorMsg = encodeURIComponent(errorDescription || 'Authentication failed');
    return NextResponse.redirect(`${origin}?auth=error&message=${errorMsg}`);
  }

  if (code) {
    const supabase = await createClient();
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('Session exchange error:', exchangeError);
      return NextResponse.redirect(`${origin}?auth=error`);
    }

    if (data.user) {
      // Link auth user to our users table
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('email', data.user.email)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 is "no rows returned" which is expected for new users
        console.error('Error fetching user:', fetchError);
      }

      if (!existingUser) {
        // Create a new user in our table
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            session_id: data.user.id,
            email: data.user.email,
            email_verified: true,
          });

        if (insertError) {
          console.error('Error creating user:', insertError);
        }
      } else {
        // Update existing user to mark as verified
        const { error: updateUserError } = await supabase
          .from('users')
          .update({ 
            email_verified: true,
            session_id: data.user.id 
          })
          .eq('email', data.user.email);

        if (updateUserError) {
          console.error('Error updating user:', updateUserError);
        }

        // Remove expiration from all user's images
        const { error: updateImagesError } = await supabase
          .from('images')
          .update({ expires_at: null })
          .eq('user_id', existingUser.id);

        if (updateImagesError) {
          console.error('Error removing image expiration:', updateImagesError);
        }
      }

      return NextResponse.redirect(`${origin}?auth=verified`);
    }
  }

  return NextResponse.redirect(`${origin}?auth=error`);
}
