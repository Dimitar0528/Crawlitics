import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      new URL("https://cdn.ozone.bg/**"),
      new URL("https://cdn.technomarket.bg/**")
    ],
  },
};

export default nextConfig;
