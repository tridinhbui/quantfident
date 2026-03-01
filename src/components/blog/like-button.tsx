"use client";

import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface LikeButtonProps {
  postId: string;
  initialLikes: number;
}

interface LikeStatusResponse {
  liked: boolean;
  totalLikes: number;
}

export function LikeButton({ postId, initialLikes }: LikeButtonProps) {
  const [liked, setLiked] = useState(false);
  const [totalLikes, setTotalLikes] = useState(initialLikes);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadStatus = async () => {
      try {
        const response = await fetch(`/api/likes?postId=${encodeURIComponent(postId)}`);
        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as LikeStatusResponse;
        if (!isMounted) {
          return;
        }

        setLiked(data.liked);
        setTotalLikes(data.totalLikes);
      } catch {
        // Ignore load errors; keep initial values.
      }
    };

    loadStatus();

    return () => {
      isMounted = false;
    };
  }, [postId]);

  const handleToggle = async () => {
    if (loading) {
      return;
    }

    const previousLiked = liked;
    const previousTotal = totalLikes;
    const nextLiked = !liked;
    const nextTotal = Math.max(0, totalLikes + (liked ? -1 : 1));

    setLiked(nextLiked);
    setTotalLikes(nextTotal);
    setLoading(true);

    try {
      const response = await fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId }),
      });

      if (response.status === 401) {
        throw new Error('Vui lòng đăng nhập để thích bài viết.');
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'Không thể cập nhật lượt thích.' }));
        throw new Error(data.error || 'Không thể cập nhật lượt thích.');
      }

      const data = (await response.json()) as LikeStatusResponse;
      setLiked(data.liked);
      setTotalLikes(data.totalLikes);
    } catch (error) {
      setLiked(previousLiked);
      setTotalLikes(previousTotal);
      toast.error(error instanceof Error ? error.message : 'Không thể cập nhật lượt thích.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      className="flex items-center gap-2"
      onClick={handleToggle}
      disabled={loading}
      aria-pressed={liked}
    >
      <Heart className={liked ? 'w-4 h-4 text-red-500 fill-red-500' : 'w-4 h-4'} />
      Like ({totalLikes})
    </Button>
  );
}
