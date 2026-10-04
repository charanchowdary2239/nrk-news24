import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const BUCKET_NAME = 'news-images';

let publicClient = null;
let adminClient = null;

/**
 * Checks whether Supabase credentials are configured in the environment.
 */
export function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) return false;
  if (!url.startsWith('http://') && !url.startsWith('https://')) return false;
  if (url.includes('your-project-id')) return false;

  return true;
}

/**
 * Returns a public-safe Supabase client (using the publishable/anon key).
 * This client is safe for use in both browser and server environments.
 */
export function getSupabaseClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!publicClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    publicClient = createClient(url, key, {
      auth: {
        persistSession: false,
      },
    });
  }

  return publicClient;
}

/**
 * Returns a server-side Supabase client with privileged access if SUPABASE_SERVICE_ROLE_KEY is present,
 * or falls back to the publishable key.
 * NEVER expose secret keys to the browser.
 */
export function getSupabaseAdmin() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!adminClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    adminClient = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return adminClient;
}

/**
 * Exported default client instance for direct importing:
 * import { supabase } from '@/lib/supabase';
 */
export const supabase = getSupabaseClient();

/**
 * Uploads an image buffer to Supabase Storage in the 'news-images' bucket.
 * Returns { publicUrl, fileName, error }
 */
export async function uploadImageToSupabase(buffer, fileName, mimeType) {
  const client = getSupabaseAdmin() || getSupabaseClient();
  if (!client) {
    return { error: 'Supabase is not configured' };
  }

  try {
    const { data, error } = await client.storage
      .from(BUCKET_NAME)
      .upload(fileName, buffer, {
        contentType: mimeType || 'image/jpeg',
        upsert: true,
      });

    if (error) {
      console.warn('[Supabase Storage] Upload error:', error.message);
      return { error: error.message };
    }

    const { data: urlData } = client.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    return {
      publicUrl: urlData.publicUrl,
      fileName,
    };
  } catch (err) {
    console.error('[Supabase Storage] Exception during upload:', err.message);
    return { error: err.message };
  }
}

/**
 * Deletes an image from Supabase Storage if it belongs to the 'news-images' bucket.
 */
export async function deleteImageFromSupabase(imageUrl) {
  if (!imageUrl || typeof imageUrl !== 'string') return;
  const client = getSupabaseAdmin() || getSupabaseClient();
  if (!client) return;

  try {
    if (imageUrl.includes(`/${BUCKET_NAME}/`)) {
      const parts = imageUrl.split(`/${BUCKET_NAME}/`);
      const fileKey = parts[1]?.split('?')[0];
      if (fileKey) {
        await client.storage.from(BUCKET_NAME).remove([fileKey]);
      }
    }
  } catch (err) {
    console.warn('[Supabase Storage] Delete error:', err.message);
  }
}
