import type React from "react";

import {
  Label,
  LabelGroup,
  Stack,
  StackItem,
  Tooltip,
} from "@patternfly/react-core";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import {
  getMockRemediationVersionsForPackage,
  isLightwellBackportVersion,
  type RemediationVersionOption,
} from "@app/mocks/sbom-remediations";

declare const __MOCK_DATA__: boolean;

interface RemediationVersionCellProps {
  packageId: string;
  packageName?: string;
}

/**
 * Visible upgrade pills before "+N more".
 * With long version strings this is typically 2 rows, with "N more" inline
 * beside the last pill (same as live TPA).
 */
const UPGRADE_VISIBLE_LABELS = 2;
const BACKPORT_VISIBLE_LABELS = 3;

const BACKPORT_TOOLTIP =
  "Lightwell backport — security fix applied in the same version stream (no major upgrade required). Identified by the .rhlw- build suffix.";

const UPGRADE_TOOLTIP =
  "Version upgrade — move to this newer release to get the fix. These are not Lightwell backports.";

const categoryHeadingStyle: React.CSSProperties = {
  fontSize: "var(--pf-t--global--font--size--sm)",
  color: "var(--pf-t--global--text--color--subtle)",
};

const VersionLabel: React.FC<{ option: RemediationVersionOption }> = ({
  option,
}) => {
  const isBackport = isLightwellBackportVersion(option.version);

  return (
    <Tooltip content={isBackport ? BACKPORT_TOOLTIP : UPGRADE_TOOLTIP}>
      <Label color={isBackport ? "blue" : "green"} variant="outline" isCompact>
        {option.version}
      </Label>
    </Tooltip>
  );
};

const VersionCategory: React.FC<{
  title: string;
  options: RemediationVersionOption[];
  numLabels: number;
}> = ({ title, options, numLabels }) => (
  <StackItem>
    <div className={spacing.mbXs} style={categoryHeadingStyle}>
      {title}
    </div>
    <LabelGroup numLabels={numLabels}>
      {options.map((option) => (
        <VersionLabel key={option.version} option={option} />
      ))}
    </LabelGroup>
  </StackItem>
);

/**
 * Package-list remediation cell: version pills matching live TPA data shape,
 * with clearer backport (rhlw) vs upgrade meaning. Dense upgrade lists stay
 * compact (~2 rows, "+N more" on the same line as the last pill).
 */
export const RemediationVersionCell: React.FC<RemediationVersionCellProps> = ({
  packageId,
  packageName,
}) => {
  const versions = __MOCK_DATA__
    ? getMockRemediationVersionsForPackage(packageId, packageName)
    : [];

  if (versions.length === 0) {
    return <>--</>;
  }

  const backports = versions.filter((option) =>
    isLightwellBackportVersion(option.version),
  );
  const upgrades = versions.filter(
    (option) => !isLightwellBackportVersion(option.version),
  );

  return (
    <Stack hasGutter>
      {backports.length > 0 ? (
        <VersionCategory
          title="Backport"
          options={backports}
          numLabels={BACKPORT_VISIBLE_LABELS}
        />
      ) : null}
      {upgrades.length > 0 ? (
        <VersionCategory
          title="Version upgrade"
          options={upgrades}
          numLabels={UPGRADE_VISIBLE_LABELS}
        />
      ) : null}
    </Stack>
  );
};
