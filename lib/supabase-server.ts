import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

// Add cache for server client to improve performance
let supabaseServerClientCache: any = null;

// Creates a Supabase client for server-side usage
export async function createServerSupabaseClient(request?: NextRequest) {
  if (supabaseServerClientCache) {
    return supabaseServerClientCache;
  }

  if (request) {
    supabaseServerClientCache = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            // Can't set cookies on API routes, but we can read them
          },
        },
      }
    );
  } else {
    const cookieStore = await cookies();
    supabaseServerClientCache = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
            }
          },
        },
      }
    );
  }

  return supabaseServerClientCache;
}

// Validates user authentication or throws an error
export async function requireAuth() {
  // Add a small delay to ensure cookies are properly propagated
  // This helps prevent race conditions in the authentication flow
  await new Promise((resolve) => setTimeout(resolve, 100));

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('Authentication required');
  }

  return user;
}

// Utility function to upload base64 image to Supabase Storage
export async function uploadImageToStorage(
  base64Data: string,
  mimeType: string,
  fileName?: string
): Promise<{ publicUrl: string | null; error: string | null }> {
  try {
    // Remove the data URL prefix if present
    const base64Content = base64Data.includes('base64,') 
      ? base64Data.split('base64,')[1] 
      : base64Data;

    if (!base64Content) {
      return { publicUrl: null, error: 'Invalid base64 data' };
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(base64Content, 'base64');

    // Generate unique filename if not provided
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = mimeType.split('/')[1] || 'png';
    const finalFileName =
      fileName || `generated-image-${timestamp}-${randomString}.${extension}`;

    const supabase = await createServerSupabaseClient();

    // Upload to storage bucket
    const { data, error } = await supabase.storage
      .from('generated-images')
      .upload(finalFileName, buffer, {
        contentType: mimeType,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Storage upload error:', error);
      return { publicUrl: null, error: error.message };
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('generated-images').getPublicUrl(data.path);

    return { publicUrl, error: null };
  } catch (error) {
    console.error('Upload utility error:', error);
    return {
      publicUrl: null,
      error: error instanceof Error ? error.message : 'Failed to upload image',
    };
  }
}

// Utility function to delete image from storage
export async function deleteImageFromStorage(imageUrl: string): Promise<boolean> {
  try {
    const supabase = await createServerSupabaseClient();

    // Extract file path from public URL
    const urlParts = imageUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];

    if (!fileName) {
      console.error('Could not extract filename from URL:', imageUrl);
      return false;
    }

    const { error } = await supabase.storage.from('generated-images').remove([fileName]);

    if (error) {
      console.error('Storage deletion error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Delete utility error:', error);
    return false;
  }
}