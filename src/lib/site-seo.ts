export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://medinaclean.com";

export const googleMapsSearchUrl =
  "https://www.google.com/maps/search/?api=1&query=Medina%20Clean%20Woodstock%20GA%2030188";

export const openGraphImage = {
  url: `${siteUrl}/gallery/hero-clean-home.png`,
  width: 1774,
  height: 887,
  alt: "Clean home interior for Medina Clean service near Woodstock, Georgia"
};

export const twitterCard = {
  card: "summary_large_image" as const,
  images: [openGraphImage.url]
};
