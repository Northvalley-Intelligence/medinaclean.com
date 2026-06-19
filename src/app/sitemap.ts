import type { MetadataRoute } from "next";
import { localServicePages } from "@/lib/local-seo";
import { siteUrl } from "@/lib/site-seo";

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
    {
      url: `${siteUrl}/en/about-rosa-medina`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8
    },
    {
      url: `${siteUrl}/es/sobre-rosa-medina`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8
    },
    ...localServicePages.map((page) => ({
      url: `${siteUrl}/${page.locale}/${page.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.85
    }))
  ];
}
