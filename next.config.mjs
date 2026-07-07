/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // For Google Auth avatars
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com', // If Github auth is used
      },
      {
        protocol: 'https',
        hostname: 'i.ibb.co.com', // For external ImgBB images
      },
      {
        protocol: 'https',
        hostname: 'i.ibb.co', // For external ImgBB images
      }
    ],
  },
  typescript: {
    // Dangerously allow production builds to complete even if there are type errors.
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ['firebase-admin'],
};

export default nextConfig;
