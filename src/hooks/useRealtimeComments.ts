'use client';

/**
 * React hook for realtime comments
 * Subscribes to comment changes and manages local state
 *
 * Usage:
 *   const { comments, isLoading, error } = useRealtimeComments(postId);
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { subscribeToComments, type CommentEvent } from '@/lib/supabase/realtime';
import { appLogger } from '@/lib/observability/logger';

export interface Comment extends CommentEvent {
  // Can extend with additional UI-specific fields
  isOptimistic?: boolean;
  error?: string;
}

export interface UseRealtimeCommentsOptions {
  // Auto-load initial comments on mount
  autoLoad?: boolean;
  // Max number of comments to keep in memory
  maxComments?: number;
}

export function useRealtimeComments(
  postId: string | null | undefined,
  options: UseRealtimeCommentsOptions = {}
) {
  const { autoLoad = true, maxComments = 500 } = options;

  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(!!autoLoad);
  const [error, setError] = useState<string | null>(null);

  const unsubscribeRef = useRef<(() => Promise<void>) | null>(null);
  const mountedRef = useRef(true);

  // Load initial comments
  const loadComments = useCallback(async () => {
    if (!postId) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/comments?postId=${postId}&limit=${maxComments}`);
      if (!response.ok) {
        throw new Error(`Failed to load comments: ${response.statusText}`);
      }

      const data = await response.json();
      if (mountedRef.current) {
        setComments(data.comments || []);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      appLogger.error('Failed to load comments', err, { postId });
      if (mountedRef.current) {
        setError(message);
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [postId, maxComments]);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!postId) {
      setComments([]);
      return;
    }

    // Load initial comments if enabled
    if (autoLoad) {
      loadComments();
    }

    // Subscribe to changes
    const unsubscribe = subscribeToComments(
      postId,
      (event) => {
        if (!mountedRef.current) return;

        setError(null);

        switch (event.type) {
          case 'INSERT': {
            if (event.new) {
              setComments((prev) => {
                // Avoid duplicates
                if (prev.some((c) => c.id === event.new!.id)) return prev;
                // Add new comment and trim if exceeds max
                const newComment = event.new as Comment;
                const updated = [newComment, ...prev];
                return updated.slice(0, maxComments);
              });
            }
            break;
          }

          case 'UPDATE': {
            if (event.new) {
              setComments((prev) =>
                prev.map((c) => (c.id === event.new!.id ? (event.new as Comment) : c))
              );
            }
            break;
          }

          case 'DELETE': {
            if (event.old) {
              setComments((prev) => prev.filter((c) => c.id !== event.old!.id));
            }
            break;
          }
        }
      },
      (err) => {
        appLogger.error('Realtime subscription error', err, { postId });
        if (mountedRef.current) {
          setError(err.message);
        }
      }
    );

    unsubscribeRef.current = unsubscribe;

    return () => {
      unsubscribeRef.current?.();
    };
  }, [postId, autoLoad, maxComments, loadComments]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      unsubscribeRef.current?.();
    };
  }, []);

  // Helper to add optimistic comment
  const addOptimisticComment = useCallback((comment: Omit<Comment, 'id'>) => {
    const optimisticId = `optimistic_${Date.now()}`;
    const optimisticComment: Comment = {
      ...comment,
      id: optimisticId,
      isOptimistic: true,
    } as Comment;

    setComments((prev) => [optimisticComment, ...prev]);
    return optimisticId;
  }, []);

  // Helper to remove optimistic comment
  const removeOptimisticComment = useCallback((id: string) => {
    setComments((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return {
    comments,
    isLoading,
    error,
    loadComments,
    addOptimisticComment,
    removeOptimisticComment,
  };
}
