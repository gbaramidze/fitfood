/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['images.unsplash.com', 'images.pexels.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/patrner',
        destination: '/partner',
        permanent: true,
      },
      {
        source: '/partners',
        destination: '/partner',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

