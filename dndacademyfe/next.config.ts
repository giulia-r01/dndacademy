import type { NextConfig } from "next";
import { validateApiOrigin } from "./config/api-origin.mjs";

validateApiOrigin(process.env.NEXT_PUBLIC_API_URL, process.env.VERCEL === "1");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default nextConfig;
