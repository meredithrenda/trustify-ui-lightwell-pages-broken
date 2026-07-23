import type React from "react";

import { formatRecommendationCountLabel } from "@app/mocks/sbom-remediations";
import { getMockPackageRecommendations } from "@app/mocks/package-recommendations";

declare const __MOCK_DATA__: boolean;

interface PackageRecommendationCountCellProps {
  packageId: string;
  packageName?: string;
}

/** Count label for Red Hat recommendations (used inside compound-expand toggle). */
export const PackageRecommendationCountCell: React.FC<
  PackageRecommendationCountCellProps
> = ({ packageId, packageName }) => {
  const count = __MOCK_DATA__
    ? getMockPackageRecommendations(packageId, packageName).length
    : 0;

  return <>{formatRecommendationCountLabel(count)}</>;
};
