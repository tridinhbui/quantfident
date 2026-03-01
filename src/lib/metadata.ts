import type { Metadata } from "next";

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://quantfident.vercel.app";

export const siteMetadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "QuantFident Mentorship — Think Smart. Be QuantFident",
    template: "%s — QuantFident Mentorship",
  },
  description:
    "Chương trình mentorship 1-1 giúp bạn break into Quant Researcher/Trader/Developer với lộ trình theory-to-alpha, dự án WorldQuant BRAIN, và unlimited mock interviews.",
  applicationName: "QuantFident Mentorship",
  keywords: [
    "QuantFident",
    "Quant mentorship",
    "WorldQuant BRAIN",
    "Quant Research",
    "Quant Trading",
    "Quant Developer",
    "Mock interviews",
    "Interview prep",
  ],
  authors: [{ name: "QuantFident" }],
  openGraph: {
    title: "QuantFident Mentorship — Think Smart. Be QuantFident",
    description:
      "Chương trình 1-1 giúp bạn vào Quant Researcher, Trader, hoặc Quant Developer top-tier.",
    url: baseUrl,
    siteName: "QuantFident Mentorship",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "QuantFident Mentorship",
      },
    ],
    locale: "vi_VN",
    type: "website",
  },
  icons: {
    icon: [{ url: "/official_transparent_icon.png", type: "image/png" }],
    apple: "/official_transparent_icon.png",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: baseUrl,
  },
};
