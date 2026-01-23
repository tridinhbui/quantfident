import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { BlogDbService } from '@/lib/services/blog-db-service';
import { BlogPostDetail } from '@/components/blog/blog-post-detail';
import type { BlogPost } from '@/types/blog';

// Generate metadata for SEO
export async function generateMetadata({
  params
}: {
  params: { slug: string }
}): Promise<Metadata> {
  try {
    const post = await BlogDbService.getPostBySlug(params.slug);

    if (!post) {
      return {
        title: 'Post Not Found',
      };
    }

    return {
      title: `${post.title} | QuantFident Blog`,
      description: post.excerpt,
      keywords: post.tags.join(', '),
      authors: [{ name: post.authorName }],
      openGraph: {
        title: post.title,
        description: post.excerpt,
        type: 'article',
        publishedTime: post.publishedAt?.toISOString(),
        modifiedTime: post.updatedAt.toISOString(),
        authors: [post.authorName],
        tags: post.tags,
        images: post.featuredImage ? [{
          url: post.featuredImage,
          alt: post.title,
        }] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: post.title,
        description: post.excerpt,
        images: post.featuredImage ? [post.featuredImage] : [],
      },
    };
  } catch (error) {
    return {
      title: 'Error Loading Post',
    };
  }
}

// Generate static params for build time
export async function generateStaticParams() {
  try {
    const posts = await BlogDbService.getPublishedPosts();
    return posts.map((post) => ({
      slug: post.slug,
    }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

interface BlogPostPageProps {
  params: {
    slug: string;
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  try {
    const post = await BlogDbService.getPostBySlug(params.slug);

    if (!post) {
      notFound();
    }

    return <BlogPostDetail post={post} />;
  } catch (error) {
    console.error('Error loading blog post:', error);
    notFound();
  }
}