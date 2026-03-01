// Client-side authentication helpers
import { auth } from '@/lib/firebase/client';

// Get current user's ID token
export async function getIdToken(): Promise<string | null> {
  try {
    if (!auth) return null;
    const user = auth.currentUser;
    if (!user) return null;

    return await user.getIdToken();
  } catch (error) {
    console.error('Error getting ID token:', error);
    return null;
  }
}

// Make authenticated API request
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getIdToken();

  if (!token) {
    throw new Error('User not authenticated');
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  return fetch(url, {
    ...options,
    headers,
  });
}

// Example usage for blog operations
export const blogApi = {
  // Create new post
  async createPost(postData: Record<string, unknown>) {
    const response = await authenticatedFetch('/api/blog', {
      method: 'POST',
      body: JSON.stringify(postData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create post');
    }

    return response.json();
  },

  // Update post
  async updatePost(postId: string, updates: Record<string, unknown>) {
    const response = await authenticatedFetch(`/api/blog/${postId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update post');
    }

    return response.json();
  },

  // Delete post
  async deletePost(postId: string) {
    const response = await authenticatedFetch(`/api/blog/${postId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete post');
    }

    return response.json();
  },

  // Get post for editing (admin only)
  async getPostForEdit(postId: string) {
    const response = await authenticatedFetch(`/api/blog/${postId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch post');
    }

    return response.json();
  }
};