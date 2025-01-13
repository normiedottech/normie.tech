/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.fallback = { fs: false };

    return config;
  },
  images: {
    domains: ["source.unsplash.com",'media.licdn.com','hebbkx1anhila5yf.public.blob.vercel-storage.com'],
  },
};

export default nextConfig;
