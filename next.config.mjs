/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Avoid blocking deploys on lint warnings (e.g. react-pdf Image alt).
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverComponentsExternalPackages: ["@react-pdf/renderer"],
  },
};

export default nextConfig;
