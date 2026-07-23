import type { FC } from "react";
import { generatePath, Link } from "react-router-dom";

import {
  ClipboardCopy,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  ExpandableSection,
  Label,
  Stack,
  StackItem,
} from "@patternfly/react-core";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";

import type { PackageRecommendationDetail } from "@app/mocks/package-recommendations";

/** Keep path strings local to avoid circular imports with @app/Routes. */
const VULNERABILITY_DETAILS_PATH = "/vulnerabilities/:vulnerabilityId";

interface PackageRecommendationsExpandProps {
  recommendations: PackageRecommendationDetail[];
}

const RecommendationBlock: FC<{
  recommendation: PackageRecommendationDetail;
}> = ({ recommendation }) => {
  const vulnerabilityCount = recommendation.vulnerabilities.length;

  return (
    <Stack hasGutter>
      <StackItem>
        <DescriptionList
          isHorizontal
          isCompact
          aria-label="Red Hat recommendation details"
          termWidth="18ch"
        >
          <DescriptionListGroup>
            <DescriptionListTerm>Recommended action</DescriptionListTerm>
            <DescriptionListDescription>
              Upgrade to Red Hat build {recommendation.recommendedVersion}
            </DescriptionListDescription>
          </DescriptionListGroup>

          <DescriptionListGroup>
            <DescriptionListTerm>Current version</DescriptionListTerm>
            <DescriptionListDescription>
              {recommendation.currentVersion}
            </DescriptionListDescription>
          </DescriptionListGroup>

          <DescriptionListGroup>
            <DescriptionListTerm>Recommended version</DescriptionListTerm>
            <DescriptionListDescription>
              {recommendation.recommendedVersion}
            </DescriptionListDescription>
          </DescriptionListGroup>

          <DescriptionListGroup>
            <DescriptionListTerm>Package</DescriptionListTerm>
            <DescriptionListDescription>
              <ClipboardCopy
                hoverTip="Copy"
                clickTip="Copied"
                variant="inline-compact"
                isReadOnly
              >
                {recommendation.recommendedPurl}
              </ClipboardCopy>
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </StackItem>

      {vulnerabilityCount > 0 ? (
        <StackItem>
          <ExpandableSection
            toggleText={`${vulnerabilityCount} vulnerabilit${
              vulnerabilityCount === 1 ? "y" : "ies"
            } addressed`}
          >
            <Table
              variant="compact"
              aria-label="Vulnerabilities addressed by recommendation"
            >
              <Thead>
                <Tr>
                  <Th width={40}>CVE</Th>
                  <Th>Status after upgrade</Th>
                </Tr>
              </Thead>
              <Tbody>
                {recommendation.vulnerabilities.map((vulnerability) => (
                  <Tr key={vulnerability.id}>
                    <Td>
                      <Link
                        to={generatePath(VULNERABILITY_DETAILS_PATH, {
                          vulnerabilityId: vulnerability.id,
                        })}
                      >
                        {vulnerability.id}
                      </Link>
                    </Td>
                    <Td>
                      <Label color="green" isCompact>
                        {vulnerability.statusLabel}
                      </Label>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </ExpandableSection>
        </StackItem>
      ) : null}
    </Stack>
  );
};

/**
 * Expanded cell content for Red Hat package recommendations.
 * Uses a compact DescriptionList for action/versions/PURL; CVEs stay collapsed.
 */
export const PackageRecommendationsExpand: FC<
  PackageRecommendationsExpandProps
> = ({ recommendations }) => {
  if (recommendations.length === 0) {
    return <>No Red Hat recommendations for this package.</>;
  }

  return (
    <Stack hasGutter>
      {recommendations.map((recommendation) => (
        <StackItem key={recommendation.recommendedPurl}>
          <RecommendationBlock recommendation={recommendation} />
        </StackItem>
      ))}
    </Stack>
  );
};
