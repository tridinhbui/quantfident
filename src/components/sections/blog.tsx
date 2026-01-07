"use client";

import { useState } from "react";
import { Section } from "./section";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FadeIn } from "@/components/anim/fade-in";
import { Calendar, User, ArrowRight, X } from "lucide-react";

const blogPosts = [
  {
    id: 1,
    title: "Hành trình trở thành Quantitative Researcher tại WorldQuant",
    excerpt: "Chia sẻ kinh nghiệm thực tế từ việc apply đến onboard tại một trong những hedge fund hàng đầu thế giới.",
    author: "Nguyễn Văn A",
    date: "2024-01-15",
    category: "Career",
    readTime: "8 phút đọc",
    featured: true,
  },
  {
    id: 2,
    title: "Mastering Python for Quantitative Finance",
    excerpt: "Hướng dẫn chi tiết về các thư viện Python thiết yếu trong quant finance: numpy, pandas, scipy, và scikit-learn.",
    author: "Trần Thị B",
    date: "2024-01-10",
    category: "Technical",
    readTime: "12 phút đọc",
    featured: false,
  },
  {
    id: 3,
    title: "Phỏng vấn Quant Developer tại Jane Street",
    excerpt: "Review chi tiết về vòng phỏng vấn technical và behavioral, kèm tips để chuẩn bị tốt nhất.",
    author: "Lê Văn C",
    date: "2024-01-08",
    category: "Interview",
    readTime: "6 phút đọc",
    featured: false,
  },
  {
    id: 4,
    title: "Alpha Generation Strategies: From Theory to Practice",
    excerpt: "Khám phá các phương pháp tạo alpha signals thực tế, từ statistical arbitrage đến machine learning approaches.",
    author: "Phạm Thị D",
    date: "2024-01-05",
    category: "Strategy",
    readTime: "15 phút đọc",
    featured: true,
  },
];

export function Blog() {
  const [selectedPost, setSelectedPost] = useState<typeof blogPosts[0] | null>(null);
  const featuredPosts = blogPosts.filter(post => post.featured);
  const regularPosts = blogPosts.filter(post => !post.featured);

  const openPost = (post: typeof blogPosts[0]) => {
    setSelectedPost(post);
  };

  const closePost = () => {
    setSelectedPost(null);
  };

  return (
    <Section title="Blog" description="Nắm vững những insights, tutorials, và kinh nghiệm mới nhất từ cộng đồng QuantFident">
      {/* Featured Posts */}
      {featuredPosts.length > 0 && (
        <div className="mb-12">
          <h3 className="text-xl font-semibold mb-6 text-center">Bài viết nổi bật</h3>
          <div className="grid gap-6 md:grid-cols-2">
            {featuredPosts.map((post, idx) => (
              <FadeIn key={post.id} delay={idx * 0.1}>
                <Card className="h-full hover:shadow-lg transition-shadow duration-300 border-2">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="secondary" className="text-xs">
                        {post.category}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        ⭐ Featured
                      </Badge>
                    </div>
                    <CardTitle
                      className="text-lg leading-tight hover:text-primary transition-colors cursor-pointer"
                      onClick={() => openPost(post)}
                    >
                      {post.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {post.author}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(post.date).toLocaleDateString('vi-VN')}
                      </div>
                      <span>{post.readTime}</span>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                      <span>Đọc thêm</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </CardFooter>
                </Card>
              </FadeIn>
            ))}
          </div>
        </div>
      )}

      {/* Regular Posts */}
      <div>
        <h3 className="text-xl font-semibold mb-6 text-center">Tất cả bài viết</h3>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {regularPosts.map((post, idx) => (
            <FadeIn key={post.id} delay={idx * 0.05}>
              <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <Badge variant="secondary" className="text-xs w-fit mb-2">
                    {post.category}
                  </Badge>
                  <CardTitle
                    className="text-base leading-tight hover:text-primary transition-colors cursor-pointer"
                    onClick={() => openPost(post)}
                  >
                    {post.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {post.author}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(post.date).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs text-muted-foreground">{post.readTime}</span>
                    <Button variant="ghost" size="sm" className="p-0 h-auto">
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </FadeIn>
          ))}
        </div>
      </div>

      {/* Load More / CTA */}
      <div className="text-center mt-12">
        <Button variant="outline" size="lg">
          Xem thêm bài viết
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {/* Post Detail Modal */}
      <Dialog open={!!selectedPost} onOpenChange={() => closePost()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold leading-tight">
              {selectedPost?.title}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4"
              onClick={closePost}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>

          {selectedPost && (
            <div className="space-y-6">
              {/* Post Meta */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {selectedPost.author}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(selectedPost.date).toLocaleDateString('vi-VN')}
                </div>
                <Badge variant="secondary">{selectedPost.category}</Badge>
                <span>{selectedPost.readTime}</span>
              </div>

              {/* Featured Badge */}
              {selectedPost.featured && (
                <Badge variant="outline" className="w-fit">
                  ⭐ Bài viết nổi bật
                </Badge>
              )}

              {/* Post Content - Mock content for demo */}
              <div className="prose prose-slate max-w-none">
                <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                  {selectedPost.excerpt}
                </p>

                <h3 className="text-xl font-semibold mb-4">Giới thiệu</h3>
                <p className="mb-4">
                  Bài viết này sẽ đi sâu vào các khía cạnh quan trọng của chủ đề, cung cấp cái nhìn toàn diện
                  và thực tế từ cộng đồng QuantFident. Chúng tôi tin rằng kiến thức nên được chia sẻ và
                  phát triển cùng nhau.
                </p>

                <h3 className="text-xl font-semibold mb-4">Nội dung chính</h3>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>Các khái niệm cơ bản và nền tảng</li>
                  <li>Công cụ và kỹ thuật thực tế</li>
                  <li>Các case study từ thực tế</li>
                  <li>Best practices và lessons learned</li>
                </ul>

                <h3 className="text-xl font-semibold mb-4">Kết luận</h3>
                <p className="mb-4">
                  Tóm lại, việc nắm vững các kỹ năng và kiến thức trong lĩnh vực này là yếu tố then chốt
                  cho sự thành công. Cộng đồng QuantFident luôn sẵn sàng hỗ trợ và chia sẻ kinh nghiệm
                  để cùng nhau phát triển.
                </p>

                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm italic">
                    Bài viết này là nội dung mẫu. Trong phiên bản hoàn chỉnh, đây sẽ là nội dung đầy đủ
                    từ các tác giả trong cộng đồng QuantFident.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button onClick={closePost} className="flex-1">
                  Đóng
                </Button>
                <Button variant="outline" className="flex-1">
                  Chia sẻ bài viết
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Section>
  );
}
