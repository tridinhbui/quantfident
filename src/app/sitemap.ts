import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://quantfident.vercel.app";
  const routes = ["/", "/privacy", "/terms"];
  return routes.map((path) => ({ url: `${baseUrl}${path}`, changeFrequency: "weekly", priority: path === "/" ? 1 : 0.7 }));
}

