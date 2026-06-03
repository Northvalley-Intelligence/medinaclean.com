import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LocalServicePage } from "@/components/LocalServicePage";
import { getLocalServiceAlternate, getLocalServicePage, localServicePages } from "@/lib/local-seo";

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

  const alternatePage = getLocalServiceAlternate(page);

  return {
    title: `${page.title} | Medina Clean`,
    description: page.description,
    alternates: {
      canonical: `/en/${page.slug}`,
      languages: {
        en: `/en/${page.slug}`,
        ...(alternatePage ? { es: `/${alternatePage.locale}/${alternatePage.slug}` } : {})
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
