import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  transpilePackages: ['@google/generative-ai', 'genkit', '@genkit-ai/google-genai'],
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'localhost:3001', '*.app.github.dev'],
    },
    workerThreads: false,
    cpus: 1,
  },
  staticPageGenerationTimeout: 180,
  // Alias Firebase imports to local stubs when no credentials are configured
  webpack: (config, { isServer }) => {
    if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY || !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      // Redirect firebase/firestore to our stub
      config.resolve.alias['firebase/firestore'] = './src/lib/firebase-firestore.ts';
      config.resolve.alias['firebase/auth'] = './src/lib/firebase-auth.ts';
    }
    return config;
  },
  // Turbopack also needs the same alias
  turbopack: {
    resolveAlias: {
      ...(process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
        ? {}
        : {
            'firebase/firestore': './src/lib/firebase-firestore.ts',
            'firebase/auth': './src/lib/firebase-auth.ts',
          }),
    },
  },
};

export default nextConfig;
