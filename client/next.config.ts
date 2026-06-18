import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.EXPRESS_URL || 'http://localhost:3003'}/api/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${process.env.EXPRESS_URL || 'http://localhost:3003'}/uploads/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },
};

export default nextConfig;
