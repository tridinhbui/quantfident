/**
 * Realtime utilities for Supabase subscriptions
 * Enables live updates for comments, likes, and other features
 *
 * Usage:
 *   const unsubscribe = subscribeToComments(postId, (comments) => {
 *     console.log('Comments updated:', comments);
 *   });
 *
 * Remember to unsubscribe when component unmounts to prevent memory leaks
 */

import { getSupabaseClient } from './client';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Type definitions for realtime events
export interface CommentEvent {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  created_at: string;
  updated_at: string;
}

export interface LikesCountUpdate {
  post_id: string;
  total_likes: number;
  user_liked: boolean;
}

/**
 * Subscribe to comment changes for a specific post
 * Fires on INSERT, UPDATE, DELETE events
 *
 * @param postId - Post ID to subscribe to
 * @param onUpdate - Callback when comments change
 * @param onError - Optional error handler
 * @returns Unsubscribe function
 */
export function subscribeToComments(
  postId: string,
  onUpdate: (event: { type: string; new?: CommentEvent; old?: CommentEvent }) => void,
  onError?: (error: Error) => void
): () => Promise<void> {
  try {
    const supabaseClient = getSupabaseClient();
    const channel: RealtimeChannel = supabaseClient
      .channel(`comments:post_id=${postId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // All events: INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${postId}`,
        },
        (payload) => {
          onUpdate({
            type: payload.eventType,
            new: payload.new as CommentEvent | undefined,
            old: payload.old as CommentEvent | undefined,
          });
        }
      )
      .subscribe((status, error) => {
        if (status === 'CLOSED') {
          console.warn(`Realtime subscription closed for comments:${postId}`);
        }
        if (error) {
          console.error(`Realtime error for comments:${postId}:`, error);
          onError?.(new Error(`Subscription failed: ${error.message}`));
        }
      });

    // Return unsubscribe function
    return async () => {
      await supabaseClient.removeChannel(channel);
    };
  } catch (error) {
    console.error('Failed to subscribe to comments:', error);
    onError?.(error instanceof Error ? error : new Error(String(error)));
    // Return no-op unsubscribe
    return async () => {};
  }
}

/**
 * Subscribe to likes count changes for a specific post
 * Note: This is for realtime count updates, not individual like events
 *
 * @param postId - Post ID to subscribe to
 * @param onUpdate - Callback with updated counts
 * @param onError - Optional error handler
 * @returns Unsubscribe function
 */
export function subscribeToLikesCount(
  postId: string,
  onUpdate: (data: LikesCountUpdate) => void,
  onError?: (error: Error) => void
): () => Promise<void> {
  try {
    const supabaseClient = getSupabaseClient();
    const channel: RealtimeChannel = supabaseClient
      .channel(`likes:post_id=${postId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // All events: INSERT, DELETE
          schema: 'public',
          table: 'likes',
          filter: `post_id=eq.${postId}`,
        },
        async () => {
          // On any like change, fetch fresh count
          try {
            const { count, error } = await supabaseClient
              .from('likes')
              .select('id', { count: 'exact', head: true })
              .eq('post_id', postId);

            if (error) {
              console.error('Error fetching like count:', error);
              return;
            }

            onUpdate({
              post_id: postId,
              total_likes: count ?? 0,
              user_liked: false, // Client should track their own like state
            });
          } catch (error) {
            console.error('Error updating likes count:', error);
            onError?.(error instanceof Error ? error : new Error(String(error)));
          }
        }
      )
      .subscribe((status, error) => {
        if (status === 'CLOSED') {
          console.warn(`Realtime subscription closed for likes:${postId}`);
        }
        if (error) {
          console.error(`Realtime error for likes:${postId}:`, error);
          onError?.(new Error(`Subscription failed: ${error.message}`));
        }
      });

    return async () => {
      await supabaseClient.removeChannel(channel);
    };
  } catch (error) {
    console.error('Failed to subscribe to likes:', error);
    onError?.(error instanceof Error ? error : new Error(String(error)));
    // Return no-op unsubscribe
    return async () => {};
  }
}

/**
 * Subscribe to changes on the comments table (all posts)
 * Useful for admin dashboards or activity feeds
 *
 * @param onUpdate - Callback when any comment changes
 * @param onError - Optional error handler
 * @returns Unsubscribe function
 */
export function subscribeToAllComments(
  onUpdate: (event: { type: string; new?: CommentEvent; old?: CommentEvent }) => void,
  onError?: (error: Error) => void
): () => Promise<void> {
  try {
    const supabaseClient = getSupabaseClient();
    const channel: RealtimeChannel = supabaseClient
      .channel('comments')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
        },
        (payload) => {
          onUpdate({
            type: payload.eventType,
            new: payload.new as CommentEvent | undefined,
            old: payload.old as CommentEvent | undefined,
          });
        }
      )
      .subscribe((status, error) => {
        if (status === 'CLOSED') {
          console.warn('Realtime subscription closed for all comments');
        }
        if (error) {
          console.error('Realtime error for all comments:', error);
          onError?.(new Error(`Subscription failed: ${error.message}`));
        }
      });

    return async () => {
      await supabaseClient.removeChannel(channel);
    };
  } catch (error) {
    console.error('Failed to subscribe to all comments:', error);
    onError?.(error instanceof Error ? error : new Error(String(error)));
    return async () => {};
  }
}
