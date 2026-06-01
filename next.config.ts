import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/",
        destination: "/en",
        permanent: true
      },
      {
        source: "/our-services",
        destination: "/en#services",
        permanent: true
      },
      {
        source: "/pricing-plans",
        destination: "/en#pricing",
        permanent: true
      },
      {
        source: "/pricing-for-residential",
        destination: "/en#pricing",
        permanent: true
      },
      {
        source: "/contactus",
        destination: "/en#schedule",
        permanent: true
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.medinaclean.com" }],
        destination: "https://medinaclean.com/:path*",
        permanent: true
      }
    ];
  }
};

export default nextConfig;
