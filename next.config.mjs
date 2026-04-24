import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  reactStrictMode: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'placehold.co', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'picsum.photos', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com', port: '', pathname: '/**' },
    ],
  },
  webpack: (config) => {
    // Redirect Firebase SDK packages to local stubs for 100% local mode
    config.resolve.alias = {
      ...config.resolve.alias,
      'firebase/app': path.resolve(__dirname, 'src/lib/stubs/firebase-app.ts'),
      'firebase/auth': path.resolve(__dirname, 'src/lib/stubs/firebase-auth.ts'),
      'firebase/firestore': path.resolve(__dirname, 'src/lib/stubs/firebase-firestore.ts'),
      'firebase/storage': path.resolve(__dirname, 'src/lib/stubs/firebase-storage.ts'),
      'react-firebase-hooks/auth': path.resolve(__dirname, 'src/lib/stubs/react-firebase-hooks-auth.ts'),
    };
    return config;
  },
};

export default nextConfig;
