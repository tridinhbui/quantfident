import Link from "next/link";
import { Github, Linkedin, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t mt-24">
      <div className="container mx-auto max-w-6xl px-4 py-10 grid gap-6 md:grid-cols-3">
        <div>
          <div className="font-semibold tracking-tight">QuantFident</div>
          <p className="text-sm text-muted-foreground mt-2">Think Smart. Be QuantFident</p>
        </div>
        <nav className="grid gap-2 text-sm">
          <Link href="/program">Program</Link>
          <Link href="/mentor">Mentor</Link>
          <Link href="/tracks">Tracks</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/apply">Apply</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="mailto:hello@example.com" aria-label="Email"><Mail className="h-5 w-5" /></Link>
          <Link href="https://github.com" aria-label="GitHub"><Github className="h-5 w-5" /></Link>
          <Link href="https://www.linkedin.com" aria-label="LinkedIn"><Linkedin className="h-5 w-5" /></Link>
        </div>
      </div>
      <div className="text-xs text-center text-muted-foreground pb-8">© {new Date().getFullYear()} QuantFident</div>
    </footer>
  );
}

