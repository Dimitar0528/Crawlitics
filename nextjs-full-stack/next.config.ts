import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "s13emagst.akamaized.net",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.ozone.bg",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
