import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@opaque/agent"],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      if (Array.isArray(config.externals)) {
        config.externals = config.externals.filter(
          (external: string | RegExp | Function) => external !== "@opaque/agent"
        );
      } else if (typeof config.externals === "function") {
        const originalExternals = config.externals;
        config.externals = (context: any, request: string, callback: any) => {
          if (request === "@opaque/agent") {
            return callback();
          }
          return originalExternals(context, request, callback);
        };
      }
    }
    return config;
  },
};

export default nextConfig;
