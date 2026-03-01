import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';
import { verifySessionCookie, SESSION_COOKIE_NAME } from '@/lib/auth/server-auth';
import { likesLimiter, getUserIdentifier } from '@/lib/middleware/rate-limit';

interface ToggleLikePayload {
  postId?: string;
}

const jsonError = (message: string, status: number, code: string) =>
  NextResponse.json({ error: message, code }, { status });

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');

    if (!postId) {
      return jsonError('postId is required', 400, 'likes_missing_post_id');
    }

    let userId: string | null = null;
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (sessionCookie) {
      try {
        const user = await verifySessionCookie(sessionCookie, true);
        userId = user?.uid ?? null;
      } catch (error) {
        console.warn('Like status check failed to verify session:', error);
      }
    }

    const supabaseServer = getSupabaseServer();

    const { count, error: countError } = await supabaseServer
      .from('likes')
      .select('id', { count: 'exact', head: true })
      .eq('post_id', postId);

    if (countError) {
      console.error('Error counting likes:', countError);
      return jsonError('Failed to count likes', 500, 'likes_count_failed');
    }

    if (!userId) {
      return NextResponse.json({ liked: false, totalLikes: count ?? 0 });
    }

    const { data: existingLike, error: findError } = await supabaseServer
      .from('likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle();

    if (findError) {
      console.error('Error checking like:', findError);
      return jsonError('Failed to check like', 500, 'likes_check_failed');
    }

    return NextResponse.json({
      liked: !!existingLike,
      totalLikes: count ?? 0,
    });
  } catch (error) {
    console.error('Like status error:', error);
    return jsonError('Server error', 500, 'likes_status_error');
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!sessionCookie) {
      return jsonError('Authentication required', 401, 'likes_auth_required');
    }

    const user = await verifySessionCookie(sessionCookie, true);
    if (!user) {
      return jsonError('Invalid session', 401, 'likes_invalid_session');
    }

    const { postId } = (await request.json()) as ToggleLikePayload;
    if (!postId || typeof postId !== 'string') {
      return jsonError('postId is required', 400, 'likes_missing_post_id');
    }

    const rateLimitKey = getUserIdentifier(request.headers, user.uid);
    const rateLimitResult = likesLimiter.check(rateLimitKey);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Too many requests. Please try again shortly.',
          code: 'likes_rate_limited',
          retryAfter: rateLimitResult.retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.retryAfter),
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
          },
        }
      );
    }

    const supabaseServer = getSupabaseServer();

    const { data: existingLike, error: findError } = await supabaseServer
      .from('likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.uid)
      .maybeSingle();

    if (findError) {
      console.error('Error checking like:', findError);
      return jsonError('Failed to check like', 500, 'likes_check_failed');
    }

    let liked = false;

    if (existingLike) {
      const { error: deleteError } = await supabaseServer
        .from('likes')
        .delete()
        .eq('id', existingLike.id);

      if (deleteError) {
        console.error('Error removing like:', deleteError);
        return jsonError('Failed to remove like', 500, 'likes_remove_failed');
      }

      liked = false;
    } else {
      const { error: insertError } = await supabaseServer
        .from('likes')
        .insert({ post_id: postId, user_id: user.uid });

      if (insertError) {
        console.error('Error adding like:', insertError);
        return jsonError('Failed to add like', 500, 'likes_add_failed');
      }

      liked = true;
    }

    const { count, error: countError } = await supabaseServer
      .from('likes')
      .select('id', { count: 'exact', head: true })
      .eq('post_id', postId);

    if (countError) {
      console.error('Error counting likes:', countError);
      return jsonError('Failed to count likes', 500, 'likes_count_failed');
    }

    return NextResponse.json({
      liked,
      totalLikes: count ?? 0,
    });
  } catch (error) {
    console.error('Like toggle error:', error);
    return jsonError('Server error', 500, 'likes_toggle_error');
  }
}
