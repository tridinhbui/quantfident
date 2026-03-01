// Blog service for Firestore operations
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import type { BlogPost } from '@/types/blog';

// Collection reference
const BLOG_COLLECTION = 'blog_posts';

// Convert Firestore timestamp to Date
const timestampToDate = (timestamp: Timestamp) => timestamp.toDate();

// Convert BlogPost for Firestore
const postToFirestore = (post: Partial<BlogPost>) => ({
  ...post,
  createdAt: Timestamp.fromDate(post.createdAt || new Date()),
  updatedAt: Timestamp.fromDate(post.updatedAt || new Date()),
  publishedAt: post.publishedAt ? Timestamp.fromDate(post.publishedAt) : null,
});

// Convert Firestore doc to BlogPost
const docToPost = (doc: { id: string; data: () => Record<string, unknown> }): BlogPost => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    createdAt: timestampToDate(data.createdAt as Timestamp),
    updatedAt: timestampToDate(data.updatedAt as Timestamp),
    publishedAt: data.publishedAt ? timestampToDate(data.publishedAt as Timestamp) : undefined,
  } as BlogPost;
};

export class BlogService {

  // Get all published posts
  static async getPublishedPosts(limitCount?: number): Promise<BlogPost[]> {
    try {
      if (!db) return [];

      const q = query(
        collection(db, BLOG_COLLECTION),
        where('status', '==', 'published'),
        orderBy('publishedAt', 'desc'),
        ...(limitCount ? [limit(limitCount)] : [])
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(docToPost);
    } catch (error) {
      console.error('Error fetching published posts:', error);
      return [];
    }
  }

  // Get post by slug
  static async getPostBySlug(slug: string): Promise<BlogPost | null> {
    try {
      if (!db) return null;
      const q = query(
        collection(db, BLOG_COLLECTION),
        where('slug', '==', slug),
        where('status', '==', 'published'),
        limit(1)
      );

      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;

      return docToPost(snapshot.docs[0]);
    } catch (error) {
      console.error('Error fetching post by slug:', error);
      return null;
    }
  }

  // Get post by ID (for admin editing)
  static async getPostById(id: string): Promise<BlogPost | null> {
    try {
      if (!db) return null;
      const docRef = doc(db, BLOG_COLLECTION, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) return null;
      return docToPost(docSnap);
    } catch (error) {
      console.error('Error fetching post by ID:', error);
      return null;
    }
  }

  // Create new post (admin only)
  static async createPost(postData: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      if (!db) throw new Error('Database not initialized');
      const docRef = await addDoc(collection(db, BLOG_COLLECTION), postToFirestore(postData));
      return docRef.id;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  }

  // Update post (admin only)
  static async updatePost(id: string, updates: Partial<BlogPost>): Promise<void> {
    try {
      if (!db) throw new Error('Database not initialized');
      const docRef = doc(db, BLOG_COLLECTION, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.fromDate(new Date())
      });
    } catch (error) {
      console.error('Error updating post:', error);
      throw error;
    }
  }

  // Delete post (admin only)
  static async deletePost(id: string): Promise<void> {
    try {
      if (!db) throw new Error('Database not initialized');
      const docRef = doc(db, BLOG_COLLECTION, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  }

  // Get all posts for admin (including drafts)
  static async getAllPostsForAdmin(): Promise<BlogPost[]> {
    try {
      if (!db) return [];
      const q = query(
        collection(db, BLOG_COLLECTION),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(docToPost);
    } catch (error) {
      console.error('Error fetching all posts for admin:', error);
      return [];
    }
  }

  // Publish draft post
  static async publishPost(id: string): Promise<void> {
    await this.updatePost(id, {
      status: 'published',
      publishedAt: new Date()
    });
  }

  // Archive published post
  static async archivePost(id: string): Promise<void> {
    await this.updatePost(id, {
      status: 'archived'
    });
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