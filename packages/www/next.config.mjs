/** @type {import('next').NextConfig} */
import createNextIntlPlugin from 'next-intl/plugin';
const withNextIntl = createNextIntlPlugin({
  experimental:{
    createMessagesDeclaration: ['./messages/en.json','./messages/es.json'],
  }
});
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.fallback = { fs: false };
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'source.unsplash.com',
       port: "",
        pathname: "/**",
      },
      {
        protocol: 'https',
        hostname: 'media.licdn.com',
       port: "",
        pathname: "/**",
      },
      {
        protocol: 'https',
        hostname: 'hebbkx1anhila5yf.public.blob.vercel-storage.com',
       port: "",
        pathname: "/**",
      },
    ],
  },
};

export default withNextIntl(nextConfig);