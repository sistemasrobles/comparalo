/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
    unoptimized: true,
  },
  async rewrites() {
    if (!process.env.NEXT_PUBLIC_API_URL) return [];
    return [
      {
        source: '/api/((?!db|admin|auth).*)',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/api/$1`,
      },
    ];
  },
};

module.exports = nextConfig;
