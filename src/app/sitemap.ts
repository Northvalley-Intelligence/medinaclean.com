import type { MetadataRoute } from "next";
import { localServicePages } from "@/lib/local-seo";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://medinaclean.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${siteUrl}/en`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1
    },
    {
      url: `${siteUrl}/es`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1
    },
    ...localServicePages.map((page) => ({
      url: `${siteUrl}/${page.locale}/${page.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.85
    }))
  ];
}
