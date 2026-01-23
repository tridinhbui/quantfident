// Blog data types
export interface BlogPost {
  id: string;
  title: string;
  slug: string; // SEO-friendly URL
  content: string; // HTML content from rich text editor
  excerpt: string; // Short summary
  authorId: string;
  authorName: string;
  authorEmail: string;
  status: 'draft' | 'published' | 'archived';
  tags: string[];
  category: string;
  featuredImage?: string; // Image URL
  readingTime: number; // in minutes
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  views: number;
  likes: number;
}

// Form data for creating/editing posts
export interface BlogPostForm {
  title: string;
  content: string;
  excerpt: string;
  tags: string[];
  category: string;
  featuredImage?: string;
  status: 'draft' | 'published';
}

// Blog categories
export const BLOG_CATEGORIES = [
  'Quant Finance',
  'Career Advice',
  'Interview Prep',
  'Market Analysis',
  'Technology',
  'Community'
] as const;

export type BlogCategory = typeof BLOG_CATEGORIES[number];

// Admin actions
export interface BlogAdminActions {
  createPost: (post: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updatePost: (id: string, updates: Partial<BlogPost>) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
  publishPost: (id: string) => Promise<void>;
  archivePost: (id: string) => Promise<void>;
}