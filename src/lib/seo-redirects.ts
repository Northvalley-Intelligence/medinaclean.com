export const legacyRedirects: Record<string, string> = {
  "/our-services": "/en#services",
  "/pricing-plans": "/en#pricing",
  "/pricing-for-residential": "/en#pricing",
  "/contactus": "/en#schedule"
};

export function getSeoRedirect(inputUrl: string) {
  const url = new URL(inputUrl);
  const isWww = url.hostname === "www.medinaclean.com";
  const legacyDestination = legacyRedirects[url.pathname];

  if (legacyDestination) {
    const destination = new URL(legacyDestination, "https://medinaclean.com");
    destination.search = url.search;
    return {
      status: 308,
      url: destination.toString()
    };
  }

  if (url.pathname === "/") {
    return {
      status: 308,
      url: new URL(`/en${url.search}`, "https://medinaclean.com").toString()
    };
  }

  if (isWww) {
    url.hostname = "medinaclean.com";
    return { status: 308, url: url.toString() };
  }

  return null;
}
