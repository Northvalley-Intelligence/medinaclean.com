import type { Metadata } from "next";
import { SitePage } from "@/components/SitePage";

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
  }
};

export default function SpanishPage() {
  return <SitePage locale="es" />;
}
