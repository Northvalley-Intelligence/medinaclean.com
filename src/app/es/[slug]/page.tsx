import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LocalServicePage } from "@/components/LocalServicePage";
import { getLocalServicePage, localServicePages } from "@/lib/local-seo";

type LocalServiceRouteProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return localServicePages.filter((page) => page.locale === "es").map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: LocalServiceRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const page = getLocalServicePage("es", slug);

  if (!page) {
    return {};
  }

  return {
    title: `${page.title} | Medina Clean`,
    description: page.description,
    alternates: {
      canonical: `/es/${page.slug}`,
      languages: {
        en: "/en/deep-cleaning-woodstock-ga",
        es: `/es/${page.slug}`
      }
    }
  };
}

export default async function SpanishLocalServicePage({ params }: LocalServiceRouteProps) {
  const { slug } = await params;
  const page = getLocalServicePage("es", slug);

  if (!page) {
    notFound();
  }

  return <LocalServicePage page={page} />;
}
