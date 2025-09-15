import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  images: {
    domains: ["localhost", "example.com"],
  },
  webpack: (config) => {
    // Exclude test files from production build
    config.module.rules.push({
      test: /\.(test|spec)\.(ts|tsx|js|jsx)$/,
      loader: 'ignore-loader'
    });
    
    // Exclude test setup files
    config.module.rules.push({
      test: /\/test\/setup\.ts$/,
      loader: 'ignore-loader'
    });
    
    return config;
  },
};

export default nextConfig;
