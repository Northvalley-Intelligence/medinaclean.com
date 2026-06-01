import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LocalServicePage } from "@/components/LocalServicePage";
import { getLocalServicePage, localServicePages } from "@/lib/local-seo";

type LocalServiceRouteProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return localServicePages.filter((page) => page.locale === "en").map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: LocalServiceRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const page = getLocalServicePage("en", slug);

  if (!page) {
    return {};
  }

  return {
    title: `${page.title} | Medina Clean`,
    description: page.description,
    alternates: {
      canonical: `/en/${page.slug}`,
      languages: {
        en: `/en/${page.slug}`,
        es: "/es/limpieza-profunda-woodstock-ga"
      }
    }
  };
}

export default async function EnglishLocalServicePage({ params }: LocalServiceRouteProps) {
  const { slug } = await params;
  const page = getLocalServicePage("en", slug);

  if (!page) {
    notFound();
  }

  return <LocalServicePage page={page} />;
}
