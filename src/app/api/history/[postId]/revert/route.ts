import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, extractTokenFromHeader } from '@/lib/auth/server-auth';
import { BlogDbService } from '@/lib/services/blog-db-service';
import { getSupabaseServer } from '@/lib/supabase/server';
import { recordPostVersion } from '@/lib/supabase/post-versions';

interface RevertPayload {
  versionId?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;

    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
    }

    const adminUser = await requireAdmin(token);
    const { versionId } = (await request.json()) as RevertPayload;

    if (!versionId || typeof versionId !== 'string') {
      return NextResponse.json({ error: 'versionId is required' }, { status: 400 });
    }

    const supabaseServer = getSupabaseServer();
    const { data: version, error } = await supabaseServer
      .from('post_versions')
      .select('id, post_id, title, content, excerpt, created_at')
      .eq('id', versionId)
      .eq('post_id', postId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching post version:', error);
      return NextResponse.json({ error: 'Failed to fetch version' }, { status: 500 });
    }

    if (!version) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    const currentPost = await BlogDbService.getPostById(postId);
    if (!currentPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    try {
      await recordPostVersion({
        postId,
        editorId: adminUser.uid,
        title: currentPost.title,
        content: currentPost.content,
        excerpt: currentPost.excerpt,
      });
    } catch (versionError) {
      console.error('Error recording post version:', versionError);
      return NextResponse.json(
        { error: 'Failed to record post version' },
        { status: 500 }
      );
    }

    await BlogDbService.updatePost(postId, {
      title: version.title,
      content: version.content,
      excerpt: version.excerpt || '',
      readingTime: BlogDbService.calculateReadingTime(version.content),
    });

    return NextResponse.json({
      message: 'Post reverted successfully',
      postId,
      versionId,
      revertedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('History revert error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
