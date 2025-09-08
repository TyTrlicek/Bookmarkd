import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['covers.openlibrary.org', 'lzfyfhscbtbojywplkua.supabase.co'],
    // unoptimized: true,
  },
  // output: 'export',
};

export default nextConfig;
