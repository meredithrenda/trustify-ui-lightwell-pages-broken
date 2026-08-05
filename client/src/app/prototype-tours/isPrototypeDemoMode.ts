/**
 * True for mock / GitHub Pages prototype builds. Workflow tour chrome is
 * demo-only and must not appear in real product deployments.
 */
export const isPrototypeDemoMode = (): boolean => {
  if (
    typeof window !== "undefined" &&
    window.__TRUSTIFY_UI_MOCK_DATA__ === true
  ) {
    return true;
  }
  if (typeof __MOCK_DATA__ !== "undefined" && __MOCK_DATA__ === true) {
    return true;
  }
  if (typeof __GITHUB_PAGES__ !== "undefined" && __GITHUB_PAGES__ === true) {
    return true;
  }
  return false;
};
