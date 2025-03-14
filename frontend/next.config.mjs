/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    transpilePackages: ["rc-util", "rc-picker", "rc-tree", "rc-table"], // Fix: Each package should be a separate string
    webpack: (config) => {
      config.resolve.fallback = { fs: false, path: false };
      return config;
    },
  };
  
  export default nextConfig;
  
