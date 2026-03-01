import { getSupabaseServer } from '@/lib/supabase/server';

export interface PostVersionInput {
  postId: string;
  editorId: string;
  title: string;
  content: string;
  excerpt?: string | null;
}

export async function recordPostVersion(input: PostVersionInput): Promise<void> {
  const supabaseServer = getSupabaseServer();

  const { error } = await supabaseServer
    .from('post_versions')
    .insert({
      post_id: input.postId,
      editor_id: input.editorId,
      title: input.title,
      content: input.content,
      excerpt: input.excerpt ?? null,
    });

  if (error) {
    throw new Error(error.message || 'Failed to record post version');
  }
}
