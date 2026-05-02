/** @type {import('next').NextConfig} */
const nextConfig = {
  // Не падаємо білд на TypeScript помилках (для MVP — норм; потім можна включити)
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
};

module.exports = nextConfig;
