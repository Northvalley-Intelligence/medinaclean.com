import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LocalServicePage } from "@/components/LocalServicePage";
import { getLocalServiceAlternate, getLocalServicePage, localServicePages } from "@/lib/local-seo";
import { openGraphImage, twitterCard } from "@/lib/site-seo";

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

  const alternatePage = getLocalServiceAlternate(page);

  return {
    title: `${page.title} | Medina Clean`,
    description: page.description,
    alternates: {
      canonical: `/es/${page.slug}`,
      languages: {
        ...(alternatePage ? { en: `/${alternatePage.locale}/${alternatePage.slug}` } : {}),
        es: `/es/${page.slug}`
      }
    },
    openGraph: {
      type: "website",
      url: `https://medinaclean.com/es/${page.slug}`,
      title: `${page.title} | Medina Clean`,
      description: page.description,
      images: [openGraphImage],
      locale: "es_US",
      alternateLocale: alternatePage ? "en_US" : undefined
    },
    twitter: twitterCard
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
