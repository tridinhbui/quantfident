import { NextRequest, NextResponse } from 'next/server';
import { BlogDbService } from '@/lib/services/blog-db-service';
import { requireAdmin, extractTokenFromHeader } from '@/lib/auth/server-auth';

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
    return NextResponse.json({
      postId,
      message: 'Post created successfully',
      author: adminUser.displayName
    });
  } catch (error) {
    console.error('Error creating blog post:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to create blog post' },
      { status: 500 }
    );
  }
}