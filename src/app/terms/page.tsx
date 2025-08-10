import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12 space-y-4">
      <h1 className="text-3xl font-semibold">Terms of Service</h1>
      <p className="text-sm text-muted-foreground">These are simple placeholder terms for the mentorship site.</p>
    </div>
  );
}

