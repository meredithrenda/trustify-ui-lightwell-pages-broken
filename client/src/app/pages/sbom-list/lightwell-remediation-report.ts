import { getMockSbomPackages } from "@app/mocks/packages";
import { getMockRemediationVersionsForPackage } from "@app/mocks/sbom-remediations";
import { mockSboms } from "@app/mocks/sboms";

export type LightwellReportApplication = {
  id: string;
  name: string;
  addressablePackageCount: number;
};

export type LightwellReportPackage = {
  packageId: string;
  packageName: string;
  version?: string;
  applicationNames: string[];
};

export type LightwellRemediationReport = {
  selectedApplicationCount: number;
  addressableApplicationCount: number;
  addressablePackageCount: number;
  applications: LightwellReportApplication[];
  packages: LightwellReportPackage[];
};

type SelectedSbom = {
  id: string;
  name: string;
};

const packageHasLightwellRemediation = (
  packageId: string,
  packageName: string,
): boolean =>
  getMockRemediationVersionsForPackage(packageId, packageName).length > 0;

/**
 * Build a Lightwell remediation report for one or more selected SBOMs
 * (called “applications” in report copy).
 */
export const buildLightwellRemediationReport = (
  selectedSboms: SelectedSbom[],
): LightwellRemediationReport => {
  const applications: LightwellReportApplication[] = [];
  const packagesById = new Map<string, LightwellReportPackage>();

  for (const sbom of selectedSboms) {
    const name =
      sbom.name ||
      mockSboms.find((item) => item.id === sbom.id)?.name ||
      sbom.id;
    const packages = getMockSbomPackages(sbom.id);
    const addressable = packages.filter((pkg) => {
      const packageId = pkg.purl[0]?.uuid ?? pkg.id;
      return packageHasLightwellRemediation(packageId, pkg.name);
    });

    if (addressable.length > 0) {
      applications.push({
        id: sbom.id,
        name,
        addressablePackageCount: addressable.length,
      });
    }

    for (const pkg of addressable) {
      const packageId = pkg.purl[0]?.uuid ?? pkg.id;
      const existing = packagesById.get(packageId);
      if (existing) {
        if (!existing.applicationNames.includes(name)) {
          existing.applicationNames.push(name);
        }
        continue;
      }
      packagesById.set(packageId, {
        packageId,
        packageName: pkg.name,
        version: pkg.version ?? undefined,
        applicationNames: [name],
      });
    }
  }

  const packages = [...packagesById.values()].sort((a, b) =>
    a.packageName.localeCompare(b.packageName),
  );

  return {
    selectedApplicationCount: selectedSboms.length,
    addressableApplicationCount: applications.length,
    addressablePackageCount: packages.length,
    applications: applications.sort((a, b) => a.name.localeCompare(b.name)),
    packages,
  };
};
