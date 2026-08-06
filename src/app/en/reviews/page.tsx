import type { Metadata } from "next";
import { ReviewsPage } from "@/components/ReviewsPage";

export const metadata: Metadata = {
  title: "Customer Reviews | Medina Clean",
  description: "Read approved customer reviews for Medina Clean house, apartment, and small-business cleaning near Woodstock, GA.",
  alternates: {
    canonical: "/en/reviews",
    languages: { en: "/en/reviews", es: "/es/reviews" }
  }
};

export default async function Page({ searchParams }: { searchParams?: Promise<{ page?: string }> }) {
  const params = await searchParams;
  const page = Number(params?.page) || 1;
  return <ReviewsPage locale="en" page={page} />;
}
