import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';
import { verifySessionCookie, SESSION_COOKIE_NAME } from '@/lib/auth/server-auth';

// Constants
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

interface AvatarSuccessResponse {
  avatarUrl: string;
  message: string;
}

const jsonError = (message: string, status: number, code: string) =>
  NextResponse.json({ error: message, code }, { status });

/**
 * POST /api/avatar
 * Upload authenticated user's avatar to Supabase Storage and update profile
 *
 * Request: multipart/form-data with 'file' field
 * Response: { avatarUrl: string, message: string } or error
 *
 * Authorization: Requires valid session cookie
 * Rate limit: Standard API rate limits apply
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!sessionCookie) {
      return jsonError('Authentication required', 401, 'auth_required');
    }

    // Verify session and get user
    const user = await verifySessionCookie(sessionCookie, true);
    if (!user) {
      return jsonError('Invalid or expired session', 401, 'session_invalid');
    }

    // Parse form data
    let formData;
    try {
      formData = await request.formData();
    } catch {
      return jsonError('Invalid form data', 400, 'form_data_invalid');
    }

    const file = formData.get('file') as File | null;
    if (!file) {
      return jsonError('No file provided', 400, 'file_missing');
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return jsonError(
        `File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB`,
        413,
        'file_too_large'
      );
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return jsonError(
        `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
        400,
        'file_type_invalid'
      );
    }

    // Validate file extension
    const filename = file.name.toLowerCase();
    const ext = filename.split('.').pop() || '';
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return jsonError(
        `Invalid file extension. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`,
        400,
        'file_extension_invalid'
      );
    }

    // Generate safe filename with timestamp
    const timestamp = Date.now();
    const safeFilename = `${timestamp}-${filename.replace(/[^a-zA-Z0-9.-]/g, '-')}`;
    const storagePath = `${user.uid}/${safeFilename}`;

    // Get Supabase server client
    const supabaseServer = getSupabaseServer();

    // Upload to storage
    const buffer = await file.arrayBuffer();
    const { data, error: uploadError } = await supabaseServer.storage
      .from('avatars')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false, // Prevent overwriting existing files
      });

    if (uploadError || !data) {
      console.error('Avatar upload failed:', uploadError);
      return jsonError(
        'Failed to upload file',
        500,
        'upload_failed'
      );
    }

    // Get public URL
    const { data: publicUrlData } = supabaseServer.storage
      .from('avatars')
      .getPublicUrl(storagePath);

    const avatarUrl = publicUrlData?.publicUrl;
    if (!avatarUrl) {
      console.error('Failed to generate public URL for avatar');
      return jsonError(
        'Failed to generate avatar URL',
        500,
        'url_generation_failed'
      );
    }

    // Update user profile with new avatar URL
    const { error: updateError } = await supabaseServer
      .from('profiles')
      .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
      .eq('id', user.uid);

    if (updateError) {
      console.error('Failed to update profile with avatar URL:', updateError);
      // Note: File was uploaded but profile wasn't updated. Consider cleanup.
      return jsonError(
        'Failed to save avatar to profile',
        500,
        'profile_update_failed'
      );
    }

    return NextResponse.json({
      avatarUrl,
      message: 'Avatar uploaded successfully',
    } as AvatarSuccessResponse);
  } catch (error) {
    console.error('Avatar upload error:', error);
    return jsonError('Server error', 500, 'server_error');
  }
}

/**
 * DELETE /api/avatar
 * Remove authenticated user's avatar and clear profile avatar_url
 *
 * Authorization: Requires valid session cookie
 */
export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!sessionCookie) {
      return jsonError('Authentication required', 401, 'auth_required');
    }

    // Verify session and get user
    const user = await verifySessionCookie(sessionCookie, true);
    if (!user) {
      return jsonError('Invalid or expired session', 401, 'session_invalid');
    }

    // Get Supabase server client
    const supabaseServer = getSupabaseServer();

    // Get current profile to find avatar files
    const { data: profile, error: profileError } = await supabaseServer
      .from('profiles')
      .select('avatar_url')
      .eq('id', user.uid)
      .maybeSingle();

    if (profileError) {
      console.error('Failed to fetch profile:', profileError);
      return jsonError('Failed to fetch profile', 500, 'profile_fetch_failed');
    }

    // Clear avatar URL from profile
    const { error: updateError } = await supabaseServer
      .from('profiles')
      .update({ avatar_url: null, updated_at: new Date().toISOString() })
      .eq('id', user.uid);

    if (updateError) {
      console.error('Failed to clear avatar URL:', updateError);
      return jsonError(
        'Failed to clear avatar',
        500,
        'profile_update_failed'
      );
    }

    // Delete old avatar files from storage if they exist
    if (profile?.avatar_url) {
      try {
        const { data: listData } = await supabaseServer.storage
          .from('avatars')
          .list(user.uid);

        if (listData && listData.length > 0) {
          const filesToDelete = listData.map(
            (f) => `${user.uid}/${f.name}`
          );
          await supabaseServer.storage
            .from('avatars')
            .remove(filesToDelete);
        }
      } catch (storageError) {
        console.warn('Failed to delete old avatar files:', storageError);
        // Non-fatal: profile was updated, just couldn't delete old files
      }
    }

    return NextResponse.json({
      message: 'Avatar deleted successfully',
    });
  } catch (error) {
    console.error('Avatar delete error:', error);
    return jsonError('Server error', 500, 'server_error');
  }
}
