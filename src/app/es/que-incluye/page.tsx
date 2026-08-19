import type { Metadata } from "next";
import { ChecklistPage } from "@/components/ChecklistPage";
import { checklistCopy } from "@/lib/checklist";
import { openGraphImage, twitterCard } from "@/lib/site-seo";

const t = checklistCopy.es;

export const metadata: Metadata = {
  title: t.title,
  description: t.description,
  alternates: {
    canonical: `/es/${t.slug}`,
    languages: {
      en: `/en/${checklistCopy.en.slug}`,
      es: `/es/${t.slug}`
    }
  },
  openGraph: {
    type: "website",
    url: `https://medinaclean.com/es/${t.slug}`,
    title: `${t.title} | Medina Clean`,
    description: t.description,
    images: [openGraphImage],
    locale: "es_US",
    alternateLocale: "en_US"
  },
  twitter: twitterCard
};

export default function SpanishChecklistPage() {
  return <ChecklistPage locale="es" />;
}
