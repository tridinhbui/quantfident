"use client";

import Link from "next/link";
import Image from "next/image";
// Removed usePathname for static site
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useState } from "react";
import { AuthModal } from "@/components/auth/auth-modal";

const navLinks = [
  { href: "#program", label: "Chương trình" },
  { href: "#careers", label: "Nghề nghiệp" },
  { href: "#skills", label: "Kỹ năng" },
  { href: "#interview", label: "Phỏng vấn" },
  { href: "#resources", label: "Tài nguyên" },
  { href: "#blog", label: "Blog" },
];

export function Header() {
  const [authModalOpen, setAuthModalOpen] = useState(false);

  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 shadow-lg">
      <div className="container mx-auto max-w-6xl px-4 h-18 flex items-center justify-between">
        <Link href="/" className="font-serif font-bold tracking-tight text-2xl">
          <Image
            src="/quantfident_logo_transparent_cropped.png"
            alt="QuantFident"
            width={120}
            height={40}
            className="h-8 w-auto"
            priority
          />
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm transition-colors hover:text-foreground/80 text-foreground/60 hover:text-foreground cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                // Add small delay to ensure DOM is ready
                setTimeout(() => {
                  const element = document.querySelector(link.href);
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    console.warn(`Element with id ${link.href} not found`);
                  }
                }, 100);
              }}
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="hidden md:flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setAuthModalOpen(true)}
          >
            Đăng nhập
          </Button>
          <Button
            onClick={() => {
              const element = document.querySelector('#contact');
              element?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Liên hệ
          </Button>
        </div>

        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <div className="flex flex-col gap-4 mt-8">
                {navLinks.map((link) => (
                  <a 
                    key={link.href} 
                    href={link.href} 
                    className="text-sm cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      // Add small delay to ensure DOM is ready
                      setTimeout(() => {
                        const element = document.querySelector(link.href);
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth' });
                        } else {
                          console.warn(`Element with id ${link.href} not found`);
                        }
                      }, 100);
                    }}
                  >
                    {link.label}
                  </a>
                ))}
                <Button
                  variant="outline"
                  onClick={() => setAuthModalOpen(true)}
                >
                  Đăng nhập
                </Button>
                <Button
                  onClick={() => {
                    const element = document.querySelector('#contact');
                    element?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Liên hệ
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <AuthModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
      />
    </header>
  );
}

