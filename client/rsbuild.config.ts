import * as fs from "node:fs";
import * as path from "node:path";

import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";

import type { RsbuildPlugin } from "@rsbuild/core";
import { pluginTypeCheck } from "@rsbuild/plugin-type-check";

import {
  SERVER_ENV_KEYS,
  TRUSTIFICATION_ENV,
  brandingStrings,
  buildTrustificationEnv,
  encodeEnv,
} from "@trustify-ui/common";

const isGitHubPages = !!process.env.GITHUB_PAGES;

/**
 * Local UI without Keycloak: default ON for `npm run start:dev` / `start:dev:mock` in this workspace.
 * Opt out with `MOCK_DATA=false` or `TRUSTIFY_DEV_USE_OIDC=true` (then configure OIDC as usual).
 */
const mockExplicitOff =
  process.env.MOCK_DATA === "false" ||
  process.env.TRUSTIFY_DEV_USE_OIDC === "true";
const npmScriptImpliesClientDev =
  process.env.npm_lifecycle_event === "start:dev" ||
  process.env.npm_lifecycle_event === "start:dev:mock";
const useMockData =
  isGitHubPages ||
  (mockExplicitOff
    ? false
    : !!process.env.MOCK_DATA || npmScriptImpliesClientDev);

const basePath = process.env.BASE_PATH || "/";
const routerBasename = basePath.replace(/\/$/, "") || "/";

/** Inject `window._env` in dev HTML whenever we are not doing a production build, or mock/GitHub Pages needs it. */
const injectHtmlRuntimeEnv =
  isGitHubPages || useMockData || process.env.NODE_ENV !== "production";

/** Workspace root of `@trustify-ui/common` (explicit resolve for Rsbuild from `client/`). */
const commonPackageRoot = path.resolve(__dirname, "../common");

/** App source root — `@app/*` path alias (tsconfig paths are not applied by Rspack unless listed here). */
const appSourceRoot = path.resolve(__dirname, "src/app");

/**
 * Return the `node_modules/` resolved path for the branding assets.
 */
const brandingAssetPath = () =>
  `${require
    .resolve("@trustify-ui/common/package.json")
    .replace(/(.)\/package.json$/, "$1")}/dist/branding`;

const brandingPath: string = brandingAssetPath();
const manifestPath = path.resolve(brandingPath, "manifest.json");
const faviconPath = path.resolve(brandingPath, "favicon.ico");

export const renameIndex = (): RsbuildPlugin => ({
  name: "CopyIndex",
  setup(api) {
    if (process.env.NODE_ENV === "production") {
      api.onAfterBuild(() => {
        const distDir = path.resolve(__dirname, "dist");
        const src = path.join(distDir, "index.html");
        const dest = path.join(distDir, "index.html.ejs");

        if (fs.existsSync(src)) {
          fs.renameSync(src, dest);
        }
      });
    }
  },
});

export const ignoreProcessEnv = (): RsbuildPlugin => ({
  name: "ignore-process-env",
  setup(api) {
    if (process.env.NODE_ENV === "development") {
      api.transform({ test: /\.mjs$/ }, ({ code, resourcePath }) => {
        let newCode = code;
        if (
          code.includes("process.env") &&
          resourcePath.includes("/common/dist/index.mjs")
        ) {
          newCode = code.replace(/process\.env/g, "({})");
        }
        return newCode;
      });
    }
    if (process.env.NODE_ENV === "production") {
      api.onAfterBuild(() => {
        const replaceProcessEnv = (dir: string): void => {
          const files = fs.readdirSync(dir);
          for (const file of files) {
            const filePath = path.join(dir, file);
            const fileStat = fs.statSync(filePath);
            if (fileStat?.isDirectory()) {
              replaceProcessEnv(filePath);
            } else if (file.endsWith(".js")) {
              let code = fs.readFileSync(filePath, "utf-8");
              code = code.replace(/process\.env/g, "({})");
              fs.writeFileSync(filePath, code);
            }
          }
        };

        const distDir = path.resolve(__dirname, "dist");
        replaceProcessEnv(distDir);
      });
    }
  },
});

export const githubPages = (ghBasePath: string): RsbuildPlugin => ({
  name: "github-pages",
  setup(api) {
    api.onAfterBuild(() => {
      const distDir = path.resolve(__dirname, "dist");
      const indexPath = path.join(distDir, "index.html");

      if (fs.existsSync(indexPath)) {
        let html = fs.readFileSync(indexPath, "utf-8");
        html = html.replace('<base href="/"/>', `<base href="${ghBasePath}"/>`);
        // Drop any leftover Vite-style entry tag so production only loads hashed bundles.
        html = html.replace(
          /<script\s+type="module"\s+src="[^"]*\/src\/index\.tsx"><\/script>\s*/g,
          "",
        );
        fs.writeFileSync(indexPath, html);
        fs.copyFileSync(indexPath, path.join(distDir, "404.html"));
      }
    });
  },
});

export default defineConfig({
  plugins: [
    pluginReact(),
    pluginTypeCheck({
      enable: process.env.NODE_ENV === "production" && !isGitHubPages,
      tsCheckerOptions: {
        issue: {
          exclude: [
            ({ file = "" }) => /[\\/]node_modules[\\/]/.test(file),
            ({ file = "" }) => {
              return /\/src\/app\/client(?:\/[^/]+)*\/[^/]+\.ts$/.test(file);
            },
          ],
        },
      },
    }),
    ...(isGitHubPages ? [githubPages(basePath)] : [renameIndex()]),
    ignoreProcessEnv(),
  ],
  html: {
    template: path.join(__dirname, "index.html"),
    templateParameters: {
      branding: brandingStrings,
      /** Read synchronously in `index.html` before the bundle loads (Chrome-safe vs `define` alone). */
      trustifyUiMockData: useMockData,
      _env: injectHtmlRuntimeEnv
        ? encodeEnv(
            useMockData
              ? buildTrustificationEnv({ AUTH_REQUIRED: "false" })
              : TRUSTIFICATION_ENV,
            SERVER_ENV_KEYS,
          )
        : "",
    },
  },
  tools: {
    rspack(_config, { addRules }) {
      addRules([
        ...(process.env.NODE_ENV === "production" && !isGitHubPages
          ? [
              {
                test: /\.html$/,
                use: "raw-loader",
              },
            ]
          : []),
      ]);
    },
    swc: {
      jsc: {
        experimental: {
          plugins:
            process.env.NODE_ENV === "development"
              ? [["swc-plugin-coverage-instrument", {}]]
              : [],
        },
      },
    },
  },
  resolve: {
    alias: {
      "@app": appSourceRoot,
      "@trustify-ui/common": commonPackageRoot,
    },
  },
  source: {
    define: {
      __BASENAME__: JSON.stringify(routerBasename),
      __GITHUB_PAGES__: JSON.stringify(isGitHubPages),
      __MOCK_DATA__: JSON.stringify(useMockData),
    },
  },
  output: {
    injectStyles: isGitHubPages,
    assetPrefix: isGitHubPages ? basePath : "/",
    copy: [
      {
        from: manifestPath,
        to: ".",
      },
      {
        from: faviconPath,
        to: ".",
      },
      {
        from: brandingPath,
        to: "branding",
      },
    ],
    sourceMap: process.env.NODE_ENV === "development",
  },
  server: {
    // Lightwell fork: avoid 3000 (used by the other Trustify prototype).
    port: Number(process.env.PORT) || 3010,
    proxy: {
      "/auth": {
        target: TRUSTIFICATION_ENV.OIDC_SERVER_URL || "http://localhost:8090",
        changeOrigin: true,
      },
      "/api": {
        target: TRUSTIFICATION_ENV.TRUSTIFY_API_URL || "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
});
