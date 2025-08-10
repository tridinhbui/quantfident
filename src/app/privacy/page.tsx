import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12 space-y-4">
      <h1 className="text-3xl font-semibold">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground">We respect your privacy. This is a simple static policy page placeholder.</p>
    </div>
  );
}

