"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2 } from "lucide-react";
import {
  signInWithGoogle,
  createServerSession,
  clearServerSession,
  mapFirebaseError,
} from "@/lib/firebase/auth";

interface EmailSignInProps {
  onAuthSuccess?: () => void;
}

const MAX_RETRY = 2;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function EmailSignIn({ onAuthSuccess }: EmailSignInProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setMessage('');

    try {
      const authResult = await signInWithGoogle();
      if (!authResult.success || !authResult.user) {
        setMessage(authResult.error || 'Không thể đăng nhập với Google.');
        return;
      }

      let lastError: Error | null = null;

      for (let attempt = 0; attempt <= MAX_RETRY; attempt += 1) {
        const sessionResult = await createServerSession(authResult.user);

        if (sessionResult.success) {
          setMessage('Đăng nhập thành công.');
          onAuthSuccess?.();
          return;
        }

        lastError = new Error(sessionResult.error || 'Không thể tạo phiên đăng nhập.');
        if (!sessionResult.retryable || attempt === MAX_RETRY) {
          break;
        }

        await sleep(500 * (attempt + 1));
      }

      await clearServerSession();
      setMessage(
        lastError?.message ||
          'Không thể hoàn tất đăng nhập do lỗi mạng/Firebase. Vui lòng kiểm tra kết nối và thử lại.'
      );
    } catch (error) {
      await clearServerSession();
      setMessage(mapFirebaseError(error, 'Đã xảy ra lỗi không mong muốn khi đăng nhập Google.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Đăng nhập</h2>
        <p className="text-muted-foreground">Đăng nhập nhanh với tài khoản Google</p>
      </div>

      {message && (
        <div className="p-4 rounded-md border border-amber-200 bg-amber-50 text-amber-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <p className="text-sm">{message}</p>
          </div>
        </div>
      )}

      <Button type="button" className="w-full" onClick={handleGoogleSignIn} disabled={loading}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Tiếp tục với Google
      </Button>
    </div>
  );
}
