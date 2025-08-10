import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "sonner",
      "@vercel/analytics/react",
      "@vercel/speed-insights/next",
    ],
  },
};

export default nextConfig;
