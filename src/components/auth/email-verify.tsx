"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
// Using simple div instead of Alert component
import { completeSignInWithEmailLink } from '@/lib/firebase/auth';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export function EmailVerify() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmailLink = async () => {
      try {
        // Get email from localStorage
        const email = localStorage.getItem('emailForSignIn');
        if (!email) {
          setStatus('error');
          setMessage('Không tìm thấy email. Vui lòng thử đăng nhập lại.');
          return;
        }

        // Get the email link from URL
        const emailLink = window.location.href;

        // Complete sign-in
        const result = await completeSignInWithEmailLink(email, emailLink);

        if (result.success) {
          setStatus('success');
          setMessage('Đăng nhập thành công! Đang chuyển hướng...');

          // Redirect after success
          setTimeout(() => {
            router.push('/');
          }, 2000);
        } else {
          setStatus('error');
          setMessage(result.error || 'Đăng nhập thất bại');
        }
      } catch {
        setStatus('error');
        setMessage('Đã xảy ra lỗi khi xác thực');
      }
    };

    verifyEmailLink();
  }, [router]);

  const handleRetry = () => {
    router.push('/auth');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="mx-auto h-12 w-12 text-blue-500 animate-spin" />
              <h2 className="mt-6 text-2xl font-bold">Đang xác thực...</h2>
              <p className="text-muted-foreground">Vui lòng đợi trong giây lát</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
              <h2 className="mt-6 text-2xl font-bold text-green-600">Thành công!</h2>
              <div className="mt-4 p-4 rounded-md border border-green-200 bg-green-50 text-green-800">
                <p className="text-sm">{message}</p>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="mx-auto h-12 w-12 text-red-500" />
              <h2 className="mt-6 text-2xl font-bold text-red-600">Xác thực thất bại</h2>
              <div className="mt-4 p-4 rounded-md border border-red-200 bg-red-50 text-red-800">
                <p className="text-sm">{message}</p>
              </div>
              <Button onClick={handleRetry} className="w-full mt-4">
                Thử lại
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
