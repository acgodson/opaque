import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@opaque/agent"],
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Don't bundle Barretenberg - it needs to load WASM files from node_modules
      config.externals = config.externals || [];
      if (Array.isArray(config.externals)) {
        config.externals.push("@aztec/bb.js");
        config.externals = config.externals.filter(
          (external: string | RegExp | Function) => external !== "@opaque/agent"
        );
      } else if (typeof config.externals === "function") {
        const originalExternals = config.externals;
        config.externals = (context: any, request: string, callback: any) => {
          if (request === "@opaque/agent") {
            return callback();
          }
          if (request === "@aztec/bb.js") {
            return callback(null, `commonjs ${request}`);
          }
          return originalExternals(context, request, callback);
        };
      }
    }
    return config;
  },
};

export default nextConfig;
