import type { Metadata } from "next";
import { SitePage } from "@/components/SitePage";
import { openGraphImage, twitterCard } from "@/lib/site-seo";

// Root serves the homepage directly (no redirect) so https://medinaclean.com/ is a static, publicly
// accessible page that fully describes the app and its Google data use — required for Google OAuth
// verification ("home page must use a static URL without redirects and explain the app's purpose").
// Canonical still points at /en so the localized page remains the SEO canonical.
const description =
  "Medina Clean is the website and booking app for Rosa Medina's home and small-business cleaning service near Woodstock, GA. Check the service area, get a starting estimate, read reviews, and request an appointment online or from an AI assistant.";

export const metadata: Metadata = {
  // NOTE: this page.tsx shares the root "/" route segment with the layout.tsx that defines the
  // title template ("%s | Medina Clean"). Next.js does not apply a layout's own template to a
  // title set in that same segment, so this title renders verbatim (no suffix appended) and must
  // keep the full brand name itself, unlike every other page below it in the tree.
  title: "Medina Clean | Cleaning Services near Woodstock and Marietta, GA",
  description,
  alternates: {
    canonical: "/en",
    languages: {
      en: "/en",
      es: "/es"
    }
  },
  openGraph: {
    type: "website",
    url: "https://medinaclean.com/en",
    title: "Medina Clean | Cleaning Services near Woodstock and Marietta, GA",
    description,
    images: [openGraphImage],
    locale: "en_US",
    alternateLocale: "es_US"
  },
  twitter: twitterCard
};

export default function Home() {
  return <SitePage locale="en" />;
}
