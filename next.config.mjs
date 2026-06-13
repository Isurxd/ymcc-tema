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
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
