import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude xterm and related packages from server bundle
      config.externals = [
        ...(config.externals || []),
        'xterm',
        'xterm-addon-fit',
        'xterm-addon-web-links',
      ];
    }
    return config;
  },
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
