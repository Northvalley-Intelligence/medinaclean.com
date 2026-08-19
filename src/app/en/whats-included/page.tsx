import type { Metadata } from "next";
import { ChecklistPage } from "@/components/ChecklistPage";
import { checklistCopy } from "@/lib/checklist";
import { openGraphImage, twitterCard } from "@/lib/site-seo";

const t = checklistCopy.en;

export const metadata: Metadata = {
  title: t.title,
  description: t.description,
  alternates: {
    canonical: `/en/${t.slug}`,
    languages: {
      en: `/en/${t.slug}`,
      es: `/es/${checklistCopy.es.slug}`
    }
  },
  openGraph: {
    type: "website",
    url: `https://medinaclean.com/en/${t.slug}`,
    title: `${t.title} | Medina Clean`,
    description: t.description,
    images: [openGraphImage],
    locale: "en_US",
    alternateLocale: "es_US"
  },
  twitter: twitterCard
};

export default function EnglishChecklistPage() {
  return <ChecklistPage locale="en" />;
}
