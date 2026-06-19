import type { Metadata } from "next";
import { SitePage } from "@/components/SitePage";
import { openGraphImage, twitterCard } from "@/lib/site-seo";

export const metadata: Metadata = {
  title: "Medina Clean | Cleaning Services near Woodstock and Marietta, GA",
  description:
    "Schedule house, apartment, condo, deep cleaning, recurring cleaning, and small business cleaning near Woodstock, Marietta, Kennesaw, Acworth, Canton, and Roswell, GA.",
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
    description:
      "Schedule house, apartment, condo, deep cleaning, recurring cleaning, and small business cleaning near Woodstock, Marietta, Kennesaw, Acworth, Canton, and Roswell, GA.",
    images: [openGraphImage],
    locale: "en_US",
    alternateLocale: "es_US"
  },
  twitter: twitterCard
};

export default function EnglishPage() {
  return <SitePage locale="en" />;
}
