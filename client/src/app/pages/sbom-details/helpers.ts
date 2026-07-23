import type { Path } from "react-router-dom";
import { generatePath } from "react-router-dom";

import { serializeFilterUrlParams } from "@app/hooks/table-controls";
import { trimAndStringifyUrlParams } from "@app/hooks/useUrlParams";
import { Paths } from "@app/Routes";

/** Tab URL prefix on SBOM details (non-AIBOM). */
export const SBOM_DETAILS_TAB_PREFIX = "sd";

/** Packages table filter URL prefix on SBOM details. */
export const SBOM_PACKAGES_TABLE_PREFIX = "sdp";

/**
 * Link to this SBOM's Packages tab, filtered to the given package names
 * (e.g. packages that have Lightwell remediations for a CVE).
 */
export const getSbomPackagesTabFilteredByNamesUrl = (
  sbomId: string,
  packageNames: string[],
  tabPersistencePrefix: string = SBOM_DETAILS_TAB_PREFIX,
): Pick<Path, "pathname" | "search"> => {
  const uniqueNames = [...new Set(packageNames.filter(Boolean))];
  const filterParams = serializeFilterUrlParams({
    name: uniqueNames,
  });

  return {
    pathname: generatePath(Paths.sbomDetails, { sbomId }),
    search: trimAndStringifyUrlParams({
      newPrefixedSerializedParams: {
        [`${tabPersistencePrefix}:activeTab`]: "packages",
        [`${SBOM_PACKAGES_TABLE_PREFIX}:filters`]: filterParams.filters,
      },
    }),
  };
};
