import type { FC } from "react";
import { generatePath, Link } from "react-router-dom";

import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Label,
  Stack,
  StackItem,
} from "@patternfly/react-core";

import type { LightwellRemediationExpandItem } from "@app/mocks/sbom-remediations";
import { formatFixShapeLabel } from "@app/mocks/sbom-remediations";

/** Keep path strings local to avoid circular imports with @app/Routes. */
const PACKAGE_DETAILS_PATH = "/packages/:packageId";
const VULNERABILITY_DETAILS_PATH = "/vulnerabilities/:vulnerabilityId";

interface LightwellRemediationsExpandProps {
  items: LightwellRemediationExpandItem[];
  /** Show package name/link (CVE / SBOM vulnerability context). */
  showPackage?: boolean;
  /** Show CVE link (package context). */
  showVulnerability?: boolean;
}

const RemediationBlock: FC<{
  item: LightwellRemediationExpandItem;
  showPackage: boolean;
  showVulnerability: boolean;
}> = ({ item, showPackage, showVulnerability }) => {
  const { remediation, packageId, packageName } = item;
  const fixShapeLabel = formatFixShapeLabel(remediation.fixShape);

  return (
    <DescriptionList
      isHorizontal
      isCompact
      aria-label="Lightwell remediation details"
      termWidth="16ch"
    >
      {showPackage ? (
        <DescriptionListGroup>
          <DescriptionListTerm>Package</DescriptionListTerm>
          <DescriptionListDescription>
            <Link
              to={generatePath(PACKAGE_DETAILS_PATH, {
                packageId,
              })}
            >
              {packageName}
            </Link>
          </DescriptionListDescription>
        </DescriptionListGroup>
      ) : null}

      {showVulnerability ? (
        <DescriptionListGroup>
          <DescriptionListTerm>Vulnerability</DescriptionListTerm>
          <DescriptionListDescription>
            <Link
              to={generatePath(VULNERABILITY_DETAILS_PATH, {
                vulnerabilityId: remediation.vulnerabilityId,
              })}
            >
              {remediation.vulnerabilityId}
            </Link>
          </DescriptionListDescription>
        </DescriptionListGroup>
      ) : null}

      {fixShapeLabel ? (
        <DescriptionListGroup>
          <DescriptionListTerm>Fix type</DescriptionListTerm>
          <DescriptionListDescription>
            <Label
              color={remediation.fixShape === "backport" ? "blue" : "grey"}
              isCompact
            >
              {fixShapeLabel}
            </Label>
          </DescriptionListDescription>
        </DescriptionListGroup>
      ) : null}

      {remediation.fixedInVersion ? (
        <DescriptionListGroup>
          <DescriptionListTerm>Fixed in version</DescriptionListTerm>
          <DescriptionListDescription>
            {remediation.fixedInVersion}
          </DescriptionListDescription>
        </DescriptionListGroup>
      ) : null}

      <DescriptionListGroup>
        <DescriptionListTerm>Details</DescriptionListTerm>
        <DescriptionListDescription>
          {remediation.details}
        </DescriptionListDescription>
      </DescriptionListGroup>

      {remediation.advisoryId ? (
        <DescriptionListGroup>
          <DescriptionListTerm>Advisory</DescriptionListTerm>
          <DescriptionListDescription>
            {remediation.advisoryId}
          </DescriptionListDescription>
        </DescriptionListGroup>
      ) : null}
    </DescriptionList>
  );
};

/**
 * Expanded cell content for Lightwell remediations (compound expand).
 */
export const LightwellRemediationsExpand: FC<
  LightwellRemediationsExpandProps
> = ({ items, showPackage = false, showVulnerability = false }) => {
  if (items.length === 0) {
    return <>No Lightwell remediations for this item.</>;
  }

  return (
    <Stack hasGutter>
      {items.map((item) => (
        <StackItem key={item.remediation.id}>
          <RemediationBlock
            item={item}
            showPackage={showPackage}
            showVulnerability={showVulnerability}
          />
        </StackItem>
      ))}
    </Stack>
  );
};
