import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

export async function createServerSupabaseClient(request?: NextRequest) {
  if (request) {
    // For middleware/API route usage
    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            // Can't set cookies in API routes, but we can read them
          },
        },
      }
    );
  } else {
    // For server components
    const cookieStore = await cookies();
    return createServerClient(
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
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );
  }
}

export async function requireAuth() {
  const supabase = await createServerSupabaseClient();

  // Use getUser() instead of getSession() for security - per Supabase docs
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
    const supabase = await createServerSupabaseClient();

    // Remove data URL prefix if present
    const base64 = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');

    // Convert base64 to buffer
    const buffer = Buffer.from(base64, 'base64');

    // Generate unique filename if not provided
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = mimeType.split('/')[1] || 'png';
    const finalFileName = fileName || `generated-image-${timestamp}-${randomString}.${extension}`;

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