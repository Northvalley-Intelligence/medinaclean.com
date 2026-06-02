import type { Metadata } from "next";
import Script from "next/script";
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
      <head>
        <Script id="google-tag-manager" strategy="beforeInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-M3DMSPQW');`}
        </Script>
      </head>
      <body>
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-M3DMSPQW"
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
