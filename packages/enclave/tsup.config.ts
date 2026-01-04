import { defineConfig } from "tsup";
import { builtinModules } from "module";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  outDir: "dist",
  bundle: true,
  noExternal: [/.*/],
  external: [...builtinModules].map(m => `node:${m}`),
  platform: "node",
  target: "node20",
  splitting: false,
  sourcemap: false,
  clean: true,
  minify: false,
  outExtension: () => ({ js: ".js" }),
  esbuildOptions(options) {
    options.banner = {
      js: "import { createRequire } from 'module';const require = createRequire(import.meta.url);",
    };
  },
});
