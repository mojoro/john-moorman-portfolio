import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: true,
  // The Spacifik case study was renamed to Hotel Agentur. Keep the old path
  // alive so the indexed URL and any inbound links land on the new one. The
  // destination carries the trailing slash on purpose: without it trailingSlash
  // normalisation adds a second 308 onto the end of this one.
  async redirects() {
    return [
      {
        source: "/work/spacifik",
        destination: "/work/hotel-agentur/",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
