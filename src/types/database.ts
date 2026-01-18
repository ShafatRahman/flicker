/**
 * Supabase Database Schema Reference
 * 
 * To generate proper Supabase types, run:
 * npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
 * 
 * Then update the Supabase clients to use: createClient<Database>(...)
 * 
 * Current tables:
 * - users: id, session_id, email, email_verified, created_at
 * - images: id, user_id, blob_url, original_filename, file_size, created_at, expires_at, is_public
 */

export {};
