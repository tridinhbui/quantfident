import { NextRequest, NextResponse } from 'next/server';
import { BlogDbService } from '@/lib/services/blog-db-service';
import { requireAdmin, extractTokenFromHeader } from '@/lib/auth/server-auth';
import { blogLimiter, getUserIdentifier } from '@/lib/middleware/rate-limit';
import { recordPostVersion } from '@/lib/supabase/post-versions';

// GET /api/blog - Get published posts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

    const posts = await BlogDbService.getPublishedPosts(limit);
    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blog posts' },
      { status: 500 }
    );
  }
}

// POST /api/blog - Create new post (Admin only)
export async function POST(request: NextRequest) {
  try {
    // Extract and verify admin token
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    // Require admin access
    const adminUser = await requireAdmin(token);

    // Check rate limit per admin user
    const userIdentifier = getUserIdentifier(request.headers, adminUser.uid);
    const rateLimitResult = blogLimiter.check(userIdentifier);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau 1 phút.',
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

    const body = await request.json();
    const {
      title,
      content,
      excerpt,
      tags,
      category,
      featuredImage,
      status
    } = body;

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    const postData = {
      title: title.trim(),
      slug: BlogDbService.generateSlug(title),
      content,
      excerpt: excerpt?.trim() || '',
      authorId: adminUser.uid,
      status: (status || 'draft').toUpperCase() as 'DRAFT' | 'PUBLISHED',
      tags: Array.isArray(tags) ? tags : [],
      category: category || '',
      featuredImage: featuredImage || '',
      readingTime: BlogDbService.calculateReadingTime(content),
      publishedAt: status === 'published' ? new Date() : undefined,
    };

    const postId = await BlogDbService.createPost(postData);

    try {
      await recordPostVersion({
        postId,
        editorId: adminUser.uid,
        title: postData.title,
        content: postData.content,
        excerpt: postData.excerpt,
      });
    } catch (versionError) {
      console.error('Error recording post version:', versionError);
      await BlogDbService.deletePost(postId);
      return NextResponse.json(
        { error: 'Failed to record post version' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      postId,
      message: 'Post created successfully',
      author: adminUser.displayName
    });
  } catch (error) {
    console.error('Error creating blog post:', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create blog post' },
      { status: 500 }
    );
  }
}