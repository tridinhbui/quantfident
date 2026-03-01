import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';
import { verifySessionCookie, SESSION_COOKIE_NAME } from '@/lib/auth/server-auth';
import { blogLimiter, getUserIdentifier } from '@/lib/middleware/rate-limit';
import { z } from 'zod';

const MAX_LIMIT = 100;
const MAX_COMMENT_LENGTH = 5000;
const MIN_COMMENT_LENGTH = 1;

// Validation schemas
const createCommentSchema = z.object({
  postId: z.string().min(1, 'Post ID is required'),
  body: z
    .string()
    .min(MIN_COMMENT_LENGTH, `Comment must be at least ${MIN_COMMENT_LENGTH} character`)
    .max(MAX_COMMENT_LENGTH, `Comment must not exceed ${MAX_COMMENT_LENGTH} characters`),
});

const jsonError = (message: string, status: number, code: string) =>
  NextResponse.json({ error: message, code }, { status });

/**
 * GET /api/comments?postId=...&limit=50
 * List comments for a post (public)
 *
 * Query params:
 * - postId (required): post ID to fetch comments for
 * - limit (optional): max comments (default 50, max 100)
 *
 * Response: { comments: Array<{ id, post_id, user_id, body, created_at, updated_at }> }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');
    const limitParam = searchParams.get('limit');

    if (!postId) {
      return jsonError('postId query parameter is required', 400, 'postid_missing');
    }

    const limit = limitParam ? Math.min(parseInt(limitParam, 10), MAX_LIMIT) : 50;

    const supabaseServer = getSupabaseServer();
    const { data, error } = await supabaseServer
      .from('comments')
      .select('id, post_id, user_id, body, created_at, updated_at')
      .eq('post_id', postId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching comments:', error);
      return jsonError('Failed to fetch comments', 500, 'comments_fetch_failed');
    }

    return NextResponse.json({ comments: data ?? [] });
  } catch (error) {
    console.error('Comments GET error:', error);
    return jsonError('Server error', 500, 'server_error');
  }
}

/**
 * POST /api/comments
 * Create a new comment (authenticated users only)
 *
 * Request body: { postId: string, body: string }
 * Response: { comment: { id, post_id, user_id, body, created_at, updated_at } }
 *
 * Authorization: Requires valid session cookie
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!sessionCookie) {
      return jsonError('Authentication required', 401, 'auth_required');
    }

    // Verify session
    const user = await verifySessionCookie(sessionCookie, true);
    if (!user) {
      return jsonError('Invalid or expired session', 401, 'session_invalid');
    }

    // Rate limiting
    const rateLimitKey = getUserIdentifier(request.headers, user.uid);
    const rateLimitResult = blogLimiter.check(rateLimitKey);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Too many requests. Please try again later.',
          code: 'rate_limit_exceeded',
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

    // Parse and validate request body
    const body = await request.json();
    const result = createCommentSchema.safeParse(body);

    if (!result.success) {
      const message = result.error.issues[0]?.message || 'Invalid request body';
      return jsonError(message, 400, 'validation_failed');
    }

    const { postId, body: commentBody } = result.data;

    // Insert comment
    const supabaseServer = getSupabaseServer();
    const { data, error } = await supabaseServer
      .from('comments')
      .insert({
        post_id: postId,
        user_id: user.uid,
        body: commentBody,
      })
      .select('id, post_id, user_id, body, created_at, updated_at')
      .single();

    if (error) {
      console.error('Comment insert failed:', error);
      return jsonError('Failed to create comment', 500, 'comment_insert_failed');
    }

    return NextResponse.json({ comment: data }, { status: 201 });
  } catch (error) {
    console.error('Comments POST error:', error);
    return jsonError('Server error', 500, 'server_error');  }
}