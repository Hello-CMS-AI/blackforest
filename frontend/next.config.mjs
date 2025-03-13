/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["rc-util", "rc-picker", "rc-tree", "rc-table"],
  webpack: (config) => {
    config.resolve.fallback = { fs: false, path: false };
    return config;
  },
  experimental: {
    esmExternals: "loose" // This line fixes the Ant Design error
  }
};

export default nextConfig;
