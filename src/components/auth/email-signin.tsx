"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { sendSignInLink } from "@/lib/firebase/auth";
import { Mail, Loader2 } from "lucide-react";

export function EmailSignIn() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setMessage('Vui lòng nhập email');
      return;
    }

    setLoading(true);
    setMessage('');
    setIsSuccess(false);

    try {
      const result = await sendSignInLink(email.trim());

      if (result.success) {
        setIsSuccess(true);
        setMessage(`Link đăng nhập đã được gửi đến ${email}. Vui lòng kiểm tra email và click vào link để đăng nhập.`);
        setEmail('');
      } else {
        setMessage(result.error || 'Không thể gửi link đăng nhập');
      }
    } catch (error) {
      setMessage('Đã xảy ra lỗi. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Đăng nhập</h2>
        <p className="text-muted-foreground">
          Nhập email để nhận link đăng nhập
        </p>
      </div>

      {message && (
        <Alert className={isSuccess ? 'border-green-200 bg-green-50' : ''}>
          <Mail className="h-4 w-4" />
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />
          <p className="text-xs text-muted-foreground">
            Chỉ hỗ trợ Gmail, Yahoo, Hotmail, Outlook và các domain được phê duyệt
          </p>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Gửi Link Đăng Nhập
        </Button>
      </form>
    </div>
  );
}
