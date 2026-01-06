"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Loader2 } from "lucide-react";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type AuthMode = "login" | "register";

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = "Email là bắt buộc";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Email không hợp lệ";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Mật khẩu là bắt buộc";
    } else if (formData.password.length < 8) {
      newErrors.password = "Mật khẩu phải có ít nhất 8 ký tự";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = "Mật khẩu phải chứa chữ hoa, chữ thường và số";
    }

    // Name validation for register
    if (mode === "register") {
      if (!formData.name.trim()) {
        newErrors.name = "Tên là bắt buộc";
      } else if (formData.name.trim().length < 2) {
        newErrors.name = "Tên phải có ít nhất 2 ký tự";
      }

      // Confirm password validation
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "Xác nhận mật khẩu là bắt buộc";
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setServerError("");

    try {
      if (mode === "register") {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            name: formData.name,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setServerError(data.error || 'Đăng ký thất bại');
          return;
        }

        // Registration successful
        setMode("login");
        setFormData(prev => ({
          ...prev,
          password: "",
          confirmPassword: "",
          name: "",
        }));
        setServerError("");
        alert("Đăng ký thành công! Đóng (✕) và đăng nhập.");
      } else {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setServerError(data.error || 'Đăng nhập thất bại');
          return;
        }

        // Login successful - in real app, save token to localStorage/cookies
        alert("Đăng nhập thành công!");
        onOpenChange(false);
        setFormData({
          email: "",
          password: "",
          confirmPassword: "",
          name: "",
        });
      }
    } catch (error) {
      setServerError("Không thể kết nối đến server. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const switchToRegister = () => {
    setMode("register");
    setErrors({});
    setServerError("");
    // Keep only email when switching
    setFormData(prev => ({
      email: prev.email,
      password: "",
      confirmPassword: "",
      name: "",
    }));
  };

  const handleClose = () => {
    onOpenChange(false);
    setMode("login");
    setErrors({});
    setServerError("");
    setFormData({
      email: "",
      password: "",
      confirmPassword: "",
      name: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-center">
            {mode === "login" ? "Đăng nhập" : "Đăng ký"}
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {serverError && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
              {serverError}
            </div>
          )}

          {mode === "register" && (
            <div className="space-y-2">
              <Label htmlFor="name">Tên</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className={errors.email ? "border-red-500" : ""}
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mật khẩu</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              className={errors.password ? "border-red-500" : ""}
            />
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          {mode === "register" && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className={errors.confirmPassword ? "border-red-500" : ""}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !formData.email || !formData.password ||
                     (mode === "register" && (!formData.name || !formData.confirmPassword))}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "login" ? "Đăng nhập" : "Đăng ký"}
          </Button>

          {mode === "login" && (
            <p className="text-center text-sm text-muted-foreground">
              Đây là lần đầu tiên bạn vào page?{" "}
              <button
                type="button"
                onClick={switchToRegister}
                className="text-primary hover:underline font-medium"
              >
                Đăng ký
              </button>
            </p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
