/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["rc-util", "rc-picker", "rc-tree", "rc-table"],
  webpack: (config) => {
    config.resolve.fallback = { fs: false, path: false };
    return config;
  },
  experimental: {
    esmExternals: "loose" // Handle ESM modules like @ant-design/icons-svg
  }
};
export default nextConfig;
