import type { Metadata } from "next";
import { SitePage } from "@/components/SitePage";

export const metadata: Metadata = {
  title: "Medina Clean | Cleaning Services near Woodstock, GA",
  description:
    "Schedule house, apartment, condo, deep cleaning, recurring cleaning, and small business cleaning near Woodstock, GA and ZIP 30188.",
  alternates: {
    canonical: "/en",
    languages: {
      en: "/en",
      es: "/es"
    }
  }
};

export default function EnglishPage() {
  return <SitePage locale="en" />;
}
