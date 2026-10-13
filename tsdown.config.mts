import { transform } from "@swc/core";
import { defineConfig } from "tsdown";

const SRC = "src/main/resources";

// Nashorn (XP's server-side JS engine) lacks ES2015 destructuring, but Oxc —
// tsdown's transformer — can't target below es2015. Re-lower the bundled
// output to es5 with SWC after bundling.
const nashornEs5 = {
  name: "nashorn-es5",
  async renderChunk(code: string) {
    const out = await transform(code, {
      jsc: {
        parser: { syntax: "ecmascript" },
        target: "es5",
        loose: true,
        externalHelpers: false,
      },
      isModule: false,
      minify: false,
      sourceMaps: false,
    });
    return { code: out.code, map: null };
  },
};

export default defineConfig({
  // XP loads the library by its resource path, so the output keeps the source's directory
  entry: { "lib/cloudflare-turnstile/index": `${SRC}/lib/cloudflare-turnstile/index.ts` },
  outDir: "build/resources/main",
  format: "cjs",
  target: "es2015", // Rolldown/oxc floor; nashornEs5 plugin re-lowers to es5 for Nashorn
  platform: "neutral",
  clean: false, // outDir also holds resources copied there by Gradle
  dts: false, // d.ts files are useless at runtime
  minify: false, // minifying server files makes debugging harder
  sourcemap: false,
  logLevel: ["QUIET", "WARN"].includes(process.env.LOG_LEVEL_FROM_GRADLE || "") ? "silent" : "info",
  plugins: [nashornEs5],
  tsconfig: `${SRC}/tsconfig.json`,
  inputOptions: {
    // Libraries are provided by the XP runtime, or by the app that includes this library
    external: [/^\/lib\//],
  },
});
