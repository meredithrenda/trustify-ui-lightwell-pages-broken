import type { RecommendEntry } from "@app/client";

export type PackageRecommendationVulnerability = {
  id: string;
  /** Outcome if the recommended package is adopted. */
  statusLabel: string;
};

export type PackageRecommendationDetail = {
  recommendedPurl: string;
  currentVersion: string;
  recommendedVersion: string;
  vulnerabilities: PackageRecommendationVulnerability[];
};

/** Extract version segment from a PURL (`…@version` before qualifiers). */
export const versionFromPurl = (purl: string): string => {
  const withoutQualifiers = purl.split("?")[0] ?? purl;
  const at = withoutQualifiers.lastIndexOf("@");
  return at >= 0 ? withoutQualifiers.slice(at + 1) : withoutQualifiers;
};

export const recommendationsFromApiEntries = (
  entries: RecommendEntry[],
  currentVersion: string,
): PackageRecommendationDetail[] =>
  entries.map((entry) => ({
    recommendedPurl: entry.package,
    currentVersion,
    recommendedVersion: versionFromPurl(entry.package),
    vulnerabilities: entry.vulnerabilities.map((vulnerability) => ({
      id: vulnerability.id,
      statusLabel:
        vulnerability.status === "NotAffected"
          ? "Not affected"
          : vulnerability.status && typeof vulnerability.status === "string"
            ? vulnerability.status
            : "Not affected",
    })),
  }));

const SAMPLE_CVES = [
  "CVE-2024-1102",
  "CVE-2023-1436",
  "CVE-2025-55163",
  "CVE-2024-29180",
  "CVE-2023-5072",
  "CVE-2024-22201",
  "CVE-2023-34462",
  "CVE-2024-29025",
  "CVE-2023-3635",
  "CVE-2024-1300",
  "CVE-2023-4586",
  "CVE-2024-29131",
  "CVE-2023-34454",
  "CVE-2024-22257",
  "CVE-2023-35116",
  "CVE-2024-22259",
  "CVE-2023-20863",
  "CVE-2024-22262",
  "CVE-2023-20873",
  "CVE-2024-38808",
  "CVE-2023-34040",
  "CVE-2024-38809",
  "CVE-2023-34034",
];

const buildVulnerabilityList = (
  count: number,
): PackageRecommendationVulnerability[] =>
  SAMPLE_CVES.slice(0, count).map((id) => ({
    id,
    statusLabel: "Not affected",
  }));

/**
 * Prototype Red Hat recommendations for package expand content.
 * Keyed by mock package UUID and common package names.
 */
export const MOCK_PACKAGE_RECOMMENDATIONS: Record<
  string,
  PackageRecommendationDetail[]
> = {
  "pkg-001": [
    {
      recommendedPurl: "pkg:rpm/redhat/openssl@3.0.7-28.el9?arch=x86_64",
      currentVersion: "3.0.7-27.el9",
      recommendedVersion: "3.0.7-28.el9",
      vulnerabilities: buildVulnerabilityList(5),
    },
  ],
  "pkg-004": [
    {
      recommendedPurl:
        "pkg:maven/org.apache.logging.log4j/log4j-core@2.23.1.redhat-00001",
      currentVersion: "2.23.1",
      recommendedVersion: "2.23.1.redhat-00001",
      vulnerabilities: buildVulnerabilityList(8),
    },
  ],
  "pkg-005": [
    {
      recommendedPurl: "pkg:rpm/redhat/sqlite-libs@3.34.1-8.el9?arch=x86_64",
      currentVersion: "3.34.1-7.el9",
      recommendedVersion: "3.34.1-8.el9",
      vulnerabilities: buildVulnerabilityList(3),
    },
  ],
  "pkg-007": [
    {
      recommendedPurl:
        "pkg:maven/com.fasterxml.jackson.core/jackson-databind@2.17.1.redhat-00001",
      currentVersion: "2.17.0",
      recommendedVersion: "2.17.1.redhat-00001",
      vulnerabilities: buildVulnerabilityList(12),
    },
  ],
  "pkg-008": [
    {
      recommendedPurl: "pkg:rpm/redhat/httpd@2.4.57-9.el9?arch=x86_64",
      currentVersion: "2.4.57-8.el9",
      recommendedVersion: "2.4.57-9.el9",
      vulnerabilities: buildVulnerabilityList(6),
    },
  ],
  "pkg-010": [
    {
      recommendedPurl: "pkg:rpm/redhat/python3.12@3.12.4-2.el9?arch=x86_64",
      currentVersion: "3.12.4-1.el9",
      recommendedVersion: "3.12.4-2.el9",
      vulnerabilities: buildVulnerabilityList(4),
    },
  ],
  /** Matches the live-style example from the recommendation screenshot. */
  "activemq-artemis-native": [
    {
      recommendedPurl:
        "pkg:maven/org.apache.activemq/activemq-artemis-native@1.0.2.redhat-00004",
      currentVersion: "1.0.2",
      recommendedVersion: "1.0.2.redhat-00004",
      vulnerabilities: buildVulnerabilityList(23),
    },
  ],
};

export const getMockPackageRecommendations = (
  packageId: string,
  packageName?: string,
): PackageRecommendationDetail[] => {
  if (MOCK_PACKAGE_RECOMMENDATIONS[packageId]) {
    return MOCK_PACKAGE_RECOMMENDATIONS[packageId];
  }
  if (packageName && MOCK_PACKAGE_RECOMMENDATIONS[packageName]) {
    return MOCK_PACKAGE_RECOMMENDATIONS[packageName];
  }
  return [];
};
