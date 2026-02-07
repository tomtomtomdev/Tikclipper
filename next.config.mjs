/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["better-sqlite3", "fluent-ffmpeg", "sharp"],
  },
};

export default nextConfig;
