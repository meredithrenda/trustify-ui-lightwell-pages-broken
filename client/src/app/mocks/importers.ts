import type { Importer } from "@app/client";

export type ImporterAccess = "public" | "private";

/**
 * Prototype access classification for importers.
 * Lightwell (and other customer-private feeds) are private; public sources are public.
 */
export const getImporterAccess = (importerName: string): ImporterAccess => {
  const name = importerName.toLowerCase();
  if (
    name === "rhlw-remediated" ||
    name.includes("lightwell") ||
    name.startsWith("rhlw-")
  ) {
    return "private";
  }
  return "public";
};

const lastChange = "2026-07-20T15:00:00Z";

/**
 * Importer list for mock / GitHub Pages prototype, aligned with the Lightwell
 * demo inventory (including private Lightwell OSV feed).
 */
export const mockImporters: Importer[] = [
  {
    name: "cve",
    state: "waiting",
    lastChange,
    configuration: {
      cve: {
        period: "1day",
        disabled: true,
        description: "CVE list v5",
        source: "https://github.com/CVEProject/cvelistV5",
      },
    },
  },
  {
    name: "osv-github",
    state: "waiting",
    lastChange,
    configuration: {
      osv: {
        period: "1day",
        disabled: true,
        description: "GitHub Advisory Database",
        source: "https://github.com/github/advisory-database",
      },
    },
  },
  {
    name: "quay-redhat-user-workloads",
    state: "waiting",
    lastChange,
    configuration: {
      quay: {
        period: "1day",
        disabled: true,
        description: "SBOMs from konflux image attachments",
        source: "quay.io",
      },
    },
  },
  {
    name: "redhat-csaf",
    state: "waiting",
    lastChange,
    configuration: {
      csaf: {
        period: "1day",
        disabled: true,
        description: "All Red Hat CSAF data",
        source: "redhat.com",
      },
    },
  },
  {
    name: "redhat-sboms",
    state: "waiting",
    lastChange,
    configuration: {
      sbom: {
        period: "1day",
        disabled: true,
        description: "All Red Hat SBOMs",
        source:
          "https://security.access.redhat.com/data/sbom/v1/graph/rhel-9.json",
      },
    },
  },
  {
    name: "rhlw-remediated",
    state: "waiting",
    lastChange,
    configuration: {
      // Lightwell Network OSV feed (private). Shown as type "osv" in the UI.
      osv: {
        period: "6h",
        disabled: true,
        description: "Red Hat Lightwell Network OSV",
        source:
          "https://packages.redhat.com/lightwell/osv/java/maven.index.json",
      },
    },
  },
];
