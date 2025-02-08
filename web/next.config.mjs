/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "tmeuhgeua9b1jf7t.public.blob.vercel-storage.com",
        port: "",
      },
    ],
  },
};

export default nextConfig;
