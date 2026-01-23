// Blog service using Prisma + Postgres instead of Firestore
import { prisma } from '@/lib/db/prisma';
import type { BlogPost, BlogPostForm, BlogCategory, BLOG_CATEGORIES } from '@/types/blog';

// Convert Prisma BlogPost to our BlogPost type
const prismaToBlogPost = (post: any): BlogPost => ({
  id: post.id,
  title: post.title,
  slug: post.slug,
  content: post.content,
  excerpt: post.excerpt || '',
  authorId: post.authorId,
  authorName: post.author.authorName || post.author.displayName || 'Anonymous',
  authorEmail: post.author.email,
  status: post.status.toLowerCase() as 'draft' | 'published' | 'archived',
  tags: post.tags || [],
  category: post.category,
  featuredImage: post.featuredImage || undefined,
  readingTime: post.readingTime,
  views: post.views,
  likes: post.likes,
  createdAt: post.createdAt,
  updatedAt: post.updatedAt,
  publishedAt: post.publishedAt || undefined,
});

export class BlogDbService {

  // Get all published posts with pagination
  static async getPublishedPosts(limitCount?: number): Promise<BlogPost[]> {
    try {
      const posts = await prisma.blogPost.findMany({
        where: { status: 'PUBLISHED' },
        include: { author: true },
        orderBy: { publishedAt: 'desc' },
        take: limitCount,
      });

      return posts.map(prismaToBlogPost);
    } catch (error) {
      console.error('Error fetching published posts:', error);
      return [];
    }
  }

  // Get post by slug
  static async getPostBySlug(slug: string): Promise<BlogPost | null> {
    try {
      const post = await prisma.blogPost.findUnique({
        where: { slug },
        include: { author: true },
      });

      if (!post || post.status !== 'PUBLISHED') return null;
      return prismaToBlogPost(post);
    } catch (error) {
      console.error('Error fetching post by slug:', error);
      return null;
    }
  }

  // Get post by ID (for admin editing)
  static async getPostById(id: string): Promise<BlogPost | null> {
    try {
      const post = await prisma.blogPost.findUnique({
        where: { id },
        include: { author: true },
      });

      if (!post) return null;
      return prismaToBlogPost(post);
    } catch (error) {
      console.error('Error fetching post by ID:', error);
      return null;
    }
  }

  // Create new post
  static async createPost(postData: {
    title: string;
    slug: string;
    content: string;
    excerpt?: string;
    authorId: string;
    status: 'DRAFT' | 'PUBLISHED';
    tags: string[];
    category: string;
    featuredImage?: string;
    readingTime: number;
    publishedAt?: Date;
  }): Promise<string> {
    try {
      const post = await prisma.blogPost.create({
        data: {
          title: postData.title,
          slug: postData.slug,
          content: postData.content,
          excerpt: postData.excerpt,
          authorId: postData.authorId,
          status: postData.status,
          tags: postData.tags,
          category: postData.category,
          featuredImage: postData.featuredImage,
          readingTime: postData.readingTime,
          publishedAt: postData.publishedAt,
          views: 0,
          likes: 0,
        },
      });

      return post.id;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  }

  // Update post
  static async updatePost(id: string, updates: Partial<{
    title: string;
    slug: string;
    content: string;
    excerpt: string;
    status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    tags: string[];
    category: string;
    featuredImage: string;
    readingTime: number;
    publishedAt: Date;
    views: number;
    likes: number;
  }>): Promise<void> {
    try {
      await prisma.blogPost.update({
        where: { id },
        data: updates,
      });
    } catch (error) {
      console.error('Error updating post:', error);
      throw error;
    }
  }

  // Delete post
  static async deletePost(id: string): Promise<void> {
    try {
      await prisma.blogPost.delete({
        where: { id },
      });
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  }

  // Get all posts for admin (including drafts)
  static async getAllPostsForAdmin(): Promise<BlogPost[]> {
    try {
      const posts = await prisma.blogPost.findMany({
        include: { author: true },
        orderBy: { createdAt: 'desc' },
      });

      return posts.map(prismaToBlogPost);
    } catch (error) {
      console.error('Error fetching all posts for admin:', error);
      return [];
    }
  }

  // Publish draft post
  static async publishPost(id: string): Promise<void> {
    await this.updatePost(id, {
      status: 'PUBLISHED',
      publishedAt: new Date(),
    });
  }

  // Archive published post
  static async archivePost(id: string): Promise<void> {
    await this.updatePost(id, {
      status: 'ARCHIVED',
    });
  }

  // Increment view count
  static async incrementViews(id: string): Promise<void> {
    try {
      await prisma.blogPost.update({
        where: { id },
        data: { views: { increment: 1 } },
      });
    } catch (error) {
      console.error('Error incrementing views:', error);
    }
  }

  // User management functions (for Firebase auth integration)
  static async upsertUser(userData: {
    firebaseUid: string;
    email: string;
    emailVerified: boolean;
    displayName?: string;
    photoURL?: string;
  }): Promise<void> {
    try {
      await prisma.user.upsert({
        where: { firebaseUid: userData.firebaseUid },
        update: {
          email: userData.email,
          emailVerified: userData.emailVerified,
          displayName: userData.displayName,
          photoURL: userData.photoURL,
          lastLoginAt: new Date(),
          totalLogins: { increment: 1 },
        },
        create: {
          id: userData.firebaseUid, // Use Firebase UID as primary key
          firebaseUid: userData.firebaseUid,
          email: userData.email,
          emailVerified: userData.emailVerified,
          displayName: userData.displayName,
          photoURL: userData.photoURL,
          role: 'USER',
          totalLogins: 1,
        },
      });
    } catch (error) {
      console.error('Error upserting user:', error);
      throw error;
    }
  }

  // Get user by Firebase UID
  static async getUserByFirebaseUid(firebaseUid: string) {
    try {
      return await prisma.user.findUnique({
        where: { firebaseUid },
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }

  // Grant admin role (only if email matches)
  static async grantAdminRole(firebaseUid: string, adminEmail: string): Promise<void> {
    try {
      const user = await this.getUserByFirebaseUid(firebaseUid);
      if (user && user.email.toLowerCase() === adminEmail.toLowerCase() && user.emailVerified) {
        await prisma.user.update({
          where: { firebaseUid },
          data: { role: 'ADMIN' },
        });
      }
    } catch (error) {
      console.error('Error granting admin role:', error);
      throw error;
    }
  }

  // Generate slug from title
  static generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // Calculate reading time
  static calculateReadingTime(content: string): number {
    const wordsPerMinute = 200;
    const words = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
    return Math.ceil(words / wordsPerMinute);
  }
}