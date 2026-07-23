/**
 * Prototype Lightwell remediations.
 *
 * Source of truth is package-scoped. List views show counts and expand
 * inline details via compound expandable cells.
 */

export type LightwellRemediationKind = "remediation" | "recommendation";

/** How a remediation addresses the CVE. */
export type LightwellFixShape = "backport" | "upgrade";

/** Full remediation payload for expand panel content. */
export interface LightwellRemediation {
  id: string;
  kind: LightwellRemediationKind;
  fixShape?: LightwellFixShape;
  fixedInVersion?: string;
  details: string;
  advisoryId?: string;
  /** CVE this remediation addresses. */
  vulnerabilityId: string;
}

/** A package that carries remediations for a given CVE (list-level summary). */
export interface LightwellRemediationPackage {
  packageId: string;
  packageName: string;
  remediations: LightwellRemediation[];
}

/** Flat remediation row for compound-expand panels. */
export interface LightwellRemediationExpandItem {
  packageId: string;
  packageName: string;
  remediation: LightwellRemediation;
}

export const formatFixShapeLabel = (
  fixShape?: LightwellFixShape,
): string | undefined => {
  if (fixShape === "backport") {
    return "Backport";
  }
  if (fixShape === "upgrade") {
    return "Version upgrade";
  }
  return undefined;
};

export const flattenRemediationPackages = (
  packages: LightwellRemediationPackage[],
): LightwellRemediationExpandItem[] =>
  packages.flatMap((pkg) =>
    pkg.remediations
      .filter((item) => item.kind === "remediation")
      .map((remediation) => ({
        packageId: pkg.packageId,
        packageName: pkg.packageName,
        remediation,
      })),
  );

export const formatRemediationCountLabel = (count: number): string => {
  if (count === 0) {
    return "None";
  }
  return `${count} Remediation${count === 1 ? "" : "s"}`;
};

export const formatRecommendationCountLabel = (count: number): string => {
  if (count === 0) {
    return "0 Recommendations";
  }
  return `${count} Recommendation${count === 1 ? "" : "s"}`;
};

export const formatPackageRemediationCountLabel = (count: number): string => {
  if (count === 0) {
    return "0 Remediations";
  }
  return `${count} Remediation${count === 1 ? "" : "s"}`;
};

export const countRemediations = (
  packages: LightwellRemediationPackage[],
): number =>
  packages.reduce(
    (sum, pkg) =>
      sum +
      pkg.remediations.filter((item) => item.kind === "remediation").length,
    0,
  );

/**
 * Extra Red Hat recommendations keyed by package UUID (not Lightwell fixes).
 * Used by the packages list column.
 */
export const MOCK_RH_RECOMMENDATION_COUNT_BY_PACKAGE: Record<string, number> = {
  "pkg-001": 1,
  "pkg-002": 0,
  "pkg-003": 0,
  "pkg-004": 1,
  "pkg-005": 1,
  "pkg-006": 0,
  "pkg-007": 1,
  "pkg-008": 1,
  "pkg-009": 0,
  "pkg-010": 1,
};

/** Aggregate package-list counts for Red Hat recommendations and Lightwell remediations. */
export const getMockPackageGuidanceCounts = (
  packageId: string,
): { recommendations: number; remediations: number } => {
  let remediations = 0;

  for (const packages of Object.values(MOCK_REMEDIATION_PACKAGES_BY_CVE)) {
    for (const pkg of packages) {
      if (pkg.packageId !== packageId) {
        continue;
      }
      remediations += pkg.remediations.filter(
        (item) => item.kind === "remediation",
      ).length;
    }
  }

  return {
    recommendations: MOCK_RH_RECOMMENDATION_COUNT_BY_PACKAGE[packageId] ?? 0,
    remediations,
  };
};

/**
 * Packages with remediations for each CVE. Aligned with the prototype SBOM
 * exploit-intelligence CVE set and mock package UUIDs.
 */
export const MOCK_REMEDIATION_PACKAGES_BY_CVE: Record<
  string,
  LightwellRemediationPackage[]
> = {
  "CVE-2024-9680": [
    {
      packageId: "pkg-011",
      packageName: "firefox",
      remediations: [
        {
          id: "rem-2024-9680-1",
          kind: "remediation",
          fixShape: "backport",
          fixedInVersion: "115.16.0-2.el9_4",
          vulnerabilityId: "CVE-2024-9680",
          details:
            "Red Hat has backported the memory-safety fixes into the supported stream without requiring a major version upgrade.",
          advisoryId: "RHSA-2024:7848",
        },
      ],
    },
  ],
  "CVE-2024-12747": [
    {
      packageId: "pkg-001",
      packageName: "openssl",
      remediations: [
        {
          id: "rem-2024-12747-1",
          kind: "remediation",
          fixShape: "upgrade",
          fixedInVersion: "3.0.7-28.el9",
          vulnerabilityId: "CVE-2024-12747",
          details:
            "Update openssl to the fixed package version that addresses the vulnerability.",
          advisoryId: "RHSA-2024:9001",
        },
      ],
    },
    {
      packageId: "pkg-007",
      packageName: "jackson-databind",
      remediations: [
        {
          id: "rem-2024-12747-2",
          kind: "remediation",
          fixShape: "upgrade",
          fixedInVersion: "2.17.1",
          vulnerabilityId: "CVE-2024-12747",
          details:
            "Upgrade jackson-databind to the fixed version that includes the security patch.",
          advisoryId: "RHSA-2024:9002",
        },
        {
          id: "rec-2024-12747-1",
          kind: "recommendation",
          vulnerabilityId: "CVE-2024-12747",
          details:
            "If an immediate upgrade is not possible, restrict untrusted deserialization until the fixed package is applied.",
          advisoryId: "RHSA-2024:9002",
        },
      ],
    },
  ],
  "CVE-2024-6119": [
    {
      packageId: "pkg-001",
      packageName: "openssl",
      remediations: [
        {
          id: "rec-2024-6119-1",
          kind: "recommendation",
          vulnerabilityId: "CVE-2024-6119",
          details:
            "Monitor for a Red Hat remediation. Until then, avoid exposing services that rely on X.509 name constraint checks to untrusted input.",
        },
      ],
    },
  ],
  "CVE-2024-47176": [
    {
      packageId: "pkg-008",
      packageName: "httpd",
      remediations: [
        {
          id: "rem-2024-47176-1",
          kind: "remediation",
          fixShape: "upgrade",
          fixedInVersion: "2.4.59-1.el9",
          vulnerabilityId: "CVE-2024-47176",
          details:
            "Upgrade httpd to the fixed version that includes the security patch.",
          advisoryId: "RHSA-2024:8500",
        },
      ],
    },
  ],
  "CVE-2024-21626": [],
  "CVE-2023-44487": [
    {
      packageId: "pkg-003",
      packageName: "@angular/core",
      remediations: [
        {
          id: "rem-2023-44487-1",
          kind: "remediation",
          fixShape: "backport",
          fixedInVersion: "17.3.1",
          vulnerabilityId: "CVE-2023-44487",
          details:
            "Red Hat backported the HTTP/2 rapid reset mitigation into the supported package stream.",
          advisoryId: "RHSA-2023:5838",
        },
      ],
    },
  ],
  "CVE-2024-0232": [],
};

export const getMockRemediationPackagesForCve = (
  cveIdentifier: string,
): LightwellRemediationPackage[] =>
  MOCK_REMEDIATION_PACKAGES_BY_CVE[cveIdentifier] ?? [];

/** All Lightwell remediations for a package across CVEs. */
export const getMockRemediationsForPackage = (
  packageId: string,
): LightwellRemediationExpandItem[] => {
  const items: LightwellRemediationExpandItem[] = [];

  for (const packages of Object.values(MOCK_REMEDIATION_PACKAGES_BY_CVE)) {
    for (const pkg of packages) {
      if (pkg.packageId !== packageId) {
        continue;
      }
      for (const remediation of pkg.remediations) {
        if (remediation.kind !== "remediation") {
          continue;
        }
        items.push({
          packageId: pkg.packageId,
          packageName: pkg.packageName,
          remediation,
        });
      }
    }
  }

  return items;
};
