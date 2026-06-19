import type { Metadata } from "next";
import { AboutPage } from "@/components/AboutPage";
import { openGraphImage, twitterCard } from "@/lib/site-seo";

export const metadata: Metadata = {
  title: "About Rosa Medina | Medina Clean",
  description:
    "Learn about Rosa Medina, the owner-led Medina Clean process, local Woodstock-area cleaning services, real project proof, and transparent trust claims.",
  alternates: {
    canonical: "/en/about-rosa-medina",
    languages: {
      en: "/en/about-rosa-medina",
      es: "/es/sobre-rosa-medina"
    }
  },
  openGraph: {
    type: "website",
    url: "https://medinaclean.com/en/about-rosa-medina",
    title: "About Rosa Medina | Medina Clean",
    description:
      "Owner-led house, apartment, condo, deep, recurring, small business, and post-construction cleaning near Woodstock, GA.",
    images: [openGraphImage],
    locale: "en_US",
    alternateLocale: "es_US"
  },
  twitter: twitterCard
};

export default function EnglishAboutPage() {
  return <AboutPage locale="en" />;
}
