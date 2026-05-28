import type { Metadata } from "next";
import { SitePage } from "@/components/SitePage";

export const metadata: Metadata = {
  title: "Medina Clean | Servicios de limpieza cerca de Woodstock, GA",
  description:
    "Limpieza de casas, apartamentos, condominios, limpieza profunda, limpieza recurrente y pequeños negocios cerca de Woodstock, GA y ZIP 30188.",
  alternates: {
    canonical: "/es",
    languages: {
      en: "/en",
      es: "/es"
    }
  }
};

export default function SpanishPage() {
  return <SitePage locale="es" />;
}
