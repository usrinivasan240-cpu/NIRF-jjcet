/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  experimental: {
    optimizePackageImports: ['lucide-react', '@heroicons/react'],
  },
};
export default nextConfig;
