import type { Metadata } from "next";
import { ReviewsPage } from "@/components/ReviewsPage";

export const metadata: Metadata = {
  title: "Reseñas de clientes | Medina Clean",
  description: "Lea reseñas aprobadas de clientes de Medina Clean para limpieza de casas, apartamentos y pequeños negocios cerca de Woodstock, GA.",
  alternates: {
    canonical: "/es/reviews",
    languages: { en: "/en/reviews", es: "/es/reviews" }
  }
};

export default async function Page({ searchParams }: { searchParams?: Promise<{ page?: string }> }) {
  const params = await searchParams;
  const page = Number(params?.page) || 1;
  return <ReviewsPage locale="es" page={page} />;
}
