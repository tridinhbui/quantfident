import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, User, ArrowLeft, Share2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import type { BlogPost } from '@/types/blog';
import { LikeButton } from './like-button';

interface BlogPostDetailProps {
  post: BlogPost;
}

export function BlogPostDetail({ post }: BlogPostDetailProps) {
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt,
          url: window.location.href,
        });
      } catch {
        // Fallback to clipboard
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      }
    } else {
      // Fallback for browsers without Web Share API
      await navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <article className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back Button */}
      <div className="mb-8">
        <Link href="/blog">
          <Button variant="ghost" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Button>
        </Link>
      </div>

      {/* Header */}
      <header className="mb-8">
        {/* Category & Tags */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Badge variant="secondary" className="text-sm">
            {post.category}
          </Badge>
          {post.tags.map(tag => (
            <Badge key={tag} variant="outline" className="text-sm">
              {tag}
            </Badge>
          ))}
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
          {post.title}
        </h1>

        {/* Excerpt */}
        {post.excerpt && (
          <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
            {post.excerpt}
          </p>
        )}

        {/* Meta Information */}
        <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground mb-6">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span>{post.authorName}</span>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <time dateTime={post.publishedAt?.toISOString()}>
              {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }) : 'Not published'}
            </time>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>{post.readingTime} min read</span>
          </div>

          <div className="flex items-center gap-2">
            <span>{post.views} views</span>
          </div>
        </div>

        {/* Featured Image */}
        {post.featuredImage && (
          <div className="mb-8 rounded-lg overflow-hidden relative h-64 md:h-96 w-full">
            <Image
              src={post.featuredImage}
              alt={post.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}
      </header>

      {/* Content */}
      <div className="prose prose-lg max-w-none mb-8">
        <div dangerouslySetInnerHTML={{ __html: post.content }} />
      </div>

      <Separator className="my-8" />

      {/* Footer Actions */}
      <footer className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={handleShare}
            className="flex items-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            Share
          </Button>

          <LikeButton postId={post.id} initialLikes={post.likes} />
        </div>

        <div className="text-sm text-muted-foreground">
          Last updated: {new Date(post.updatedAt).toLocaleDateString()}
        </div>
      </footer>

      {/* Author Bio */}
      <Card className="mt-8">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">{post.authorName}</h3>
              <p className="text-sm text-muted-foreground">
                Quant Finance enthusiast and content creator at QuantFident.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Related Posts - TODO: Implement */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Related Articles</h2>
        <div className="text-muted-foreground">
          Related posts will be displayed here based on tags and category.
        </div>
      </div>
    </article>
  );
}