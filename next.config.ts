import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "xuyiigqmayeobshszgfd.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  // Allow buyer-page prototype files to compile
  typescript: {
    // Only ignore the buyer-page prototype directory in dev
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
