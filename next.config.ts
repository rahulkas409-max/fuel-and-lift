import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Bundle the open gym dataset with the gym-finder API route
  outputFileTracingIncludes: {
    "/api/gyms": ["./data/gyms/tiles/**/*"],
  },
  /* config options here */
};

export default nextConfig;
