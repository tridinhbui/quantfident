"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Archive,
  FileText,
  Calendar
} from 'lucide-react';
import { BlogService } from '@/lib/services/blog-service';
import { BlogEditor } from './blog-editor';
import { getIdToken } from '@/lib/auth/client-auth';
import type { BlogPost, BlogPostForm } from '@/types/blog';

export function BlogDashboard() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published' | 'archived'>('all');
  const [showEditor, setShowEditor] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);

  // Load posts (for now using direct Firestore, will be replaced with API)
  const loadPosts = async () => {
    try {
      setLoading(true);
      // TODO: Replace with authenticated API call
      // const response = await authenticatedFetch('/api/admin/blog');
      // const { posts } = await response.json();

      const allPosts = await BlogService.getAllPostsForAdmin();
      setPosts(allPosts);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  // Filter posts
  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || post.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Handle create new post
  const handleCreatePost = () => {
    setEditingPost(null);
    setShowEditor(true);
  };

  // Handle edit post
  const handleEditPost = (post: BlogPost) => {
    setEditingPost(post);
    setShowEditor(true);
  };

  // Handle save post
  const handleSavePost = async (formData: BlogPostForm) => {
    try {
      const postData = {
        title: formData.title,
        content: formData.content,
        excerpt: formData.excerpt,
        tags: formData.tags,
        category: formData.category,
        featuredImage: formData.featuredImage,
        status: formData.status,
      };

      if (editingPost) {
        // Update existing post via authenticated API
        const response = await fetch(`/api/blog/${editingPost.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await getIdToken()}`,
          },
          body: JSON.stringify(postData),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update post');
        }
      } else {
        // Create new post via authenticated API
        const response = await fetch('/api/blog', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await getIdToken()}`,
          },
          body: JSON.stringify(postData),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create post');
        }
      }

      // Reload posts and close editor
      await loadPosts();
      setShowEditor(false);
      setEditingPost(null);
    } catch (error) {
      console.error('Error saving post:', error);
      alert(error instanceof Error ? error.message : 'Error saving post. Please try again.');
    }
  };

  // Handle delete post
  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const response = await fetch(`/api/blog/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${await getIdToken()}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete post');
      }

      await loadPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      alert(error instanceof Error ? error.message : 'Error deleting post. Please try again.');
    }
  };

  // Handle publish/archive
  const handleToggleStatus = async (post: BlogPost) => {
    try {
      let updates;
      if (post.status === 'draft') {
        updates = { status: 'published', publishedAt: new Date() };
      } else if (post.status === 'published') {
        updates = { status: 'archived' };
      } else {
        return; // Can't toggle archived posts
      }

      const response = await fetch(`/api/blog/${post.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getIdToken()}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update post status');
      }

      await loadPosts();
    } catch (error) {
      console.error('Error updating post status:', error);
      alert(error instanceof Error ? error.message : 'Error updating post status. Please try again.');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: 'secondary',
      published: 'default',
      archived: 'outline'
    } as const;

    return <Badge variant={variants[status as keyof typeof variants]}>{status}</Badge>;
  };

  if (showEditor) {
    return (
      <BlogEditor
        initialData={editingPost ? {
          title: editingPost.title,
          content: editingPost.content,
          excerpt: editingPost.excerpt,
          tags: editingPost.tags,
          category: editingPost.category,
          featuredImage: editingPost.featuredImage,
          status: editingPost.status === 'archived' ? 'draft' : editingPost.status as 'draft' | 'published'
        } : undefined}
        onSave={handleSavePost}
        onPreview={() => {}}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Blog Management</h1>
          <p className="text-muted-foreground">Create and manage your blog posts</p>
        </div>
        <Button onClick={handleCreatePost} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Post
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <FileText className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{posts.length}</p>
                <p className="text-sm text-muted-foreground">Total Posts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Eye className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{posts.filter(p => p.status === 'published').length}</p>
                <p className="text-sm text-muted-foreground">Published</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Edit className="w-8 h-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{posts.filter(p => p.status === 'draft').length}</p>
                <p className="text-sm text-muted-foreground">Drafts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Calendar className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">
                  {posts.filter(p => p.publishedAt && new Date(p.publishedAt) > new Date(Date.now() - 30*24*60*60*1000)).length}
                </p>
                <p className="text-sm text-muted-foreground">This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Posts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Posts ({filteredPosts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading posts...</div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No posts found. Create your first post!
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPosts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{post.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {post.excerpt.substring(0, 60)}...
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(post.status)}</TableCell>
                    <TableCell>{post.category}</TableCell>
                    <TableCell>
                      {post.publishedAt
                        ? new Date(post.publishedAt).toLocaleDateString()
                        : '—'
                      }
                    </TableCell>
                    <TableCell>{post.views}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditPost(post)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(post)}
                        >
                          {post.status === 'draft' ? (
                            <Eye className="w-4 h-4" />
                          ) : post.status === 'published' ? (
                            <Archive className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePost(post.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}