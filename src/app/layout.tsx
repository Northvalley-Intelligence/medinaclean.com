import type { Metadata } from "next";
import Script from "next/script";
import {
  buildGoogleAnalyticsConfigSnippet,
  buildGoogleTagManagerSnippet,
  getGoogleAnalyticsMeasurementId,
  googleTagManagerId
} from "@/lib/analytics";
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
  const gaMeasurementId = getGoogleAnalyticsMeasurementId();

  return (
    <html lang="en">
      <head>
        <Script id="google-tag-manager" strategy="beforeInteractive">
          {buildGoogleTagManagerSnippet()}
        </Script>
        {gaMeasurementId ? (
          <>
            <Script
              id="google-analytics-loader"
              src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics-config" strategy="afterInteractive">
              {buildGoogleAnalyticsConfigSnippet(gaMeasurementId)}
            </Script>
          </>
        ) : null}
      </head>
      <body>
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${googleTagManagerId}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {children}
      </body>
    </html>
  );
}
