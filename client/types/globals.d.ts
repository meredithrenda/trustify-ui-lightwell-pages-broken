export {};

/** Set by Rsbuild `source.define` when `MOCK_DATA` is enabled at dev-server start. */
declare const __MOCK_DATA__: boolean;

/** Set by Rsbuild when building for GitHub Pages. */
declare const __GITHUB_PAGES__: boolean;

declare global {
  interface Window {
    /**
     * base64 encoded JS object containing any environment configurations.
     */
    _env: string;
    /** Set from `index.html` when Rsbuild was started with `MOCK_DATA` / GitHub Pages mock. */
    __TRUSTIFY_UI_MOCK_DATA__?: boolean;
  }
}
