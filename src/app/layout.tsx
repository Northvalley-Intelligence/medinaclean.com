import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://medinaclean.com"),
  title: {
    default: "Medina Clean | House, Apartment, Condo and Business Cleaning in Georgia",
    template: "%s | Medina Clean"
  },
  description:
    "Pink-themed local cleaning service for homes, apartments, condos, and small businesses near Woodstock, Marietta, Kennesaw, Acworth, Canton, and Roswell, GA.",
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/medina-clean-logo.png", type: "image/png" }
    ],
    apple: [{ url: "/brand/medina-clean-logo.png" }]
  },
  alternates: {
    canonical: "/",
    languages: {
      en: "/en",
      es: "/es"
    }
  },
  openGraph: {
    type: "website",
    url: "https://medinaclean.com",
    siteName: "Medina Clean",
    title: "Medina Clean",
    description: "Residential and small business cleaning near Woodstock, Marietta, Kennesaw, Acworth, Canton, and Roswell, GA.",
    locale: "en_US",
    alternateLocale: "es_US"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
