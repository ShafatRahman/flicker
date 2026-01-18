export interface User {
  id: string;
  session_id: string;
  email: string | null;
  email_verified: boolean;
  created_at: string;
}

export interface Image {
  id: string;
  user_id: string;
  blob_url: string;
  original_filename: string | null;
  file_size: number | null;
  created_at: string;
  expires_at: string | null;
  is_public: boolean;
}

export interface PublicImage extends Image {
  user: {
    email: string | null;
  };
}

export interface ProcessingStatus {
  id: string;
  file: File;
  stage: 'queued' | 'removing-bg' | 'flipping' | 'uploading' | 'saving' | 'complete' | 'error';
  progress: number;
  error?: string;
  result?: Image;
}

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };
