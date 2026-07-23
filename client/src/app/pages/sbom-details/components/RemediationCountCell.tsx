import type React from "react";
import { Link } from "react-router-dom";

import type { LightwellRemediationPackage } from "@app/mocks/sbom-remediations";
import {
  countRemediations,
  formatRemediationCountLabel,
} from "@app/mocks/sbom-remediations";

import { getSbomPackagesTabFilteredByNamesUrl } from "../helpers";

interface RemediationCountCellProps {
  sbomId: string;
  packages: LightwellRemediationPackage[];
  /** SBOM details tab URL prefix (`sd` or `sda` for AIBOM). */
  tabPersistencePrefix?: string;
}

/**
 * SBOM vulnerability list cell: shows remediation count and links to the
 * SBOM Packages tab filtered to packages that carry the fix.
 */
export const RemediationCountCell: React.FC<RemediationCountCellProps> = ({
  sbomId,
  packages,
  tabPersistencePrefix,
}) => {
  const packagesWithRemediations = packages.filter((pkg) =>
    pkg.remediations.some((item) => item.kind === "remediation"),
  );
  const totalCount = countRemediations(packagesWithRemediations);
  const label = formatRemediationCountLabel(totalCount);

  if (totalCount === 0 || packagesWithRemediations.length === 0) {
    return <>{label}</>;
  }

  const packagesTabLink = getSbomPackagesTabFilteredByNamesUrl(
    sbomId,
    packagesWithRemediations.map((pkg) => pkg.packageName),
    tabPersistencePrefix,
  );

  return <Link to={packagesTabLink}>{label}</Link>;
};
