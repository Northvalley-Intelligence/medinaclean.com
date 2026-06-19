import type { Metadata } from "next";
import { AboutPage } from "@/components/AboutPage";
import { openGraphImage, twitterCard } from "@/lib/site-seo";

export const metadata: Metadata = {
  title: "Sobre Rosa Medina | Medina Clean",
  description:
    "Conozca a Rosa Medina, el proceso de Medina Clean, servicios locales cerca de Woodstock, prueba de trabajos reales y afirmaciones transparentes.",
  alternates: {
    canonical: "/es/sobre-rosa-medina",
    languages: {
      en: "/en/about-rosa-medina",
      es: "/es/sobre-rosa-medina"
    }
  },
  openGraph: {
    type: "website",
    url: "https://medinaclean.com/es/sobre-rosa-medina",
    title: "Sobre Rosa Medina | Medina Clean",
    description:
      "Limpieza dirigida por la dueña para casas, apartamentos, condominios, limpieza profunda, recurrente, pequeños negocios y después de construcción cerca de Woodstock, GA.",
    images: [openGraphImage],
    locale: "es_US",
    alternateLocale: "en_US"
  },
  twitter: twitterCard
};

export default function SpanishAboutPage() {
  return <AboutPage locale="es" />;
}
