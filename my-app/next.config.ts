import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['covers.openlibrary.org', 'lzfyfhscbtbojywplkua.supabase.co'],
    unoptimized: true, //change this when vercel upgrade
  },
  // output: 'export',
};

export default nextConfig;
