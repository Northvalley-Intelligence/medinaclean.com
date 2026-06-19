import type { Metadata } from "next";
import { SitePage } from "@/components/SitePage";
import { openGraphImage, twitterCard } from "@/lib/site-seo";

export const metadata: Metadata = {
  title: "Medina Clean | Servicios de limpieza cerca de Woodstock y Marietta, GA",
  description:
    "Limpieza de casas, apartamentos, condominios, limpieza profunda, limpieza recurrente y pequeños negocios cerca de Woodstock, Marietta, Kennesaw, Acworth, Canton y Roswell, GA.",
  alternates: {
    canonical: "/es",
    languages: {
      en: "/en",
      es: "/es"
    }
  },
  openGraph: {
    type: "website",
    url: "https://medinaclean.com/es",
    title: "Medina Clean | Servicios de limpieza cerca de Woodstock y Marietta, GA",
    description:
      "Limpieza de casas, apartamentos, condominios, limpieza profunda, limpieza recurrente y pequeños negocios cerca de Woodstock, Marietta, Kennesaw, Acworth, Canton y Roswell, GA.",
    images: [openGraphImage],
    locale: "es_US",
    alternateLocale: "en_US"
  },
  twitter: twitterCard
};

export default function SpanishPage() {
  return <SitePage locale="es" />;
}
