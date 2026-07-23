import React from "react";
import { generatePath, NavLink } from "react-router-dom";

import { List, ListItem } from "@patternfly/react-core";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import {
  ExpandableRowContent,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@patternfly/react-table";

import { LightwellRemediationsExpand } from "@app/components/LightwellRemediationsExpand";
import { PackageQualifiers } from "@app/components/PackageQualifiers";
import { PackageRecommendationsExpand } from "@app/components/PackageRecommendationsExpand";
import { SimplePagination } from "@app/components/SimplePagination";
import {
  ConditionalTableBody,
  TableHeaderContentWithControls,
  TableRowContentWithControls,
} from "@app/components/TableControls";
import { WithPackage } from "@app/components/WithPackage";
import { getMockPackageRecommendations } from "@app/mocks/package-recommendations";
import {
  formatPackageRemediationCountLabel,
  getMockRemediationsForPackage,
} from "@app/mocks/sbom-remediations";
import { Paths } from "@app/Routes";

import { PackageLicenses } from "./components/PackageLicences";
import { PackageRecommendationCountCell } from "./components/PackageRecommendationCountCell";
import { PackageVulnerabilities } from "./components/PackageVulnerabilities";
import { PackageSearchContext } from "./package-context";

declare const __MOCK_DATA__: boolean;

export const PackageTable: React.FC = () => {
  const { isFetching, fetchError, tableControls } =
    React.useContext(PackageSearchContext);

  const {
    numRenderedColumns,
    currentPageItems,
    propHelpers: {
      paginationProps,
      tableProps,
      getThProps,
      getTrProps,
      getTdProps,
      getExpandedContentTdProps,
    },
    expansionDerivedState: { isCellExpanded },
  } = tableControls;

  return (
    <>
      <Table {...tableProps} aria-label="Package table">
        <Thead>
          <Tr>
            <TableHeaderContentWithControls {...tableControls}>
              <Th {...getThProps({ columnKey: "name" })} />
              <Th {...getThProps({ columnKey: "namespace" })} />
              <Th {...getThProps({ columnKey: "version" })} />
              <Th
                modifier="fitContent"
                {...getThProps({ columnKey: "type" })}
              />
              <Th
                modifier="fitContent"
                {...getThProps({ columnKey: "licenses" })}
              />
              <Th
                modifier="fitContent"
                {...getThProps({ columnKey: "recommendations" })}
              />
              <Th
                modifier="fitContent"
                {...getThProps({ columnKey: "remediations" })}
              />
              <Th
                modifier="fitContent"
                {...getThProps({ columnKey: "path" })}
              />
              <Th {...getThProps({ columnKey: "qualifiers" })} />
              <Th
                modifier="fitContent"
                {...getThProps({ columnKey: "vulnerabilities" })}
              />
            </TableHeaderContentWithControls>
          </Tr>
        </Thead>
        <ConditionalTableBody
          isLoading={isFetching}
          isError={!!fetchError}
          isNoData={currentPageItems.length === 0}
          numRenderedColumns={numRenderedColumns}
        >
          {currentPageItems.map((item, rowIndex) => {
            const packageName = item.decomposedPurl?.name;
            const recommendations = __MOCK_DATA__
              ? getMockPackageRecommendations(item.uuid, packageName)
              : [];
            const remediations = __MOCK_DATA__
              ? getMockRemediationsForPackage(item.uuid)
              : [];

            return (
              <WithPackage key={item.uuid} packageId={item.uuid}>
                {(pkg, packageIsFetching, packageFetchError) => (
                  <Tbody isExpanded={isCellExpanded(item)}>
                    <Tr {...getTrProps({ item })}>
                      <TableRowContentWithControls
                        {...tableControls}
                        item={item}
                        rowIndex={rowIndex}
                      >
                        <Td
                          width={15}
                          modifier="breakWord"
                          {...getTdProps({ columnKey: "name" })}
                        >
                          <NavLink
                            to={generatePath(Paths.packageDetails, {
                              packageId: item.uuid,
                            })}
                          >
                            {item.decomposedPurl
                              ? item.decomposedPurl?.name
                              : item.purl}
                          </NavLink>
                        </Td>
                        <Td
                          width={15}
                          modifier="truncate"
                          {...getTdProps({ columnKey: "namespace" })}
                        >
                          {item.decomposedPurl?.namespace}
                        </Td>
                        <Td
                          width={10}
                          modifier="truncate"
                          {...getTdProps({ columnKey: "version" })}
                        >
                          {item.decomposedPurl?.version}
                        </Td>
                        <Td
                          width={10}
                          modifier="truncate"
                          {...getTdProps({ columnKey: "type" })}
                        >
                          {item.decomposedPurl?.type}
                        </Td>
                        <Td
                          width={10}
                          modifier="truncate"
                          {...getTdProps({
                            columnKey: "licenses",
                            isCompoundExpandToggle: true,
                            item,
                            rowIndex,
                          })}
                        >
                          <PackageLicenses
                            pkg={pkg}
                            isFetching={packageIsFetching}
                            fetchError={packageFetchError}
                          />
                        </Td>
                        <Td
                          modifier="nowrap"
                          {...getTdProps({
                            columnKey: "recommendations",
                            isCompoundExpandToggle: recommendations.length > 0,
                            item,
                            rowIndex,
                          })}
                        >
                          <PackageRecommendationCountCell
                            packageId={item.uuid}
                            packageName={packageName}
                          />
                        </Td>
                        <Td
                          modifier="nowrap"
                          {...getTdProps({
                            columnKey: "remediations",
                            isCompoundExpandToggle: remediations.length > 0,
                            item,
                            rowIndex,
                          })}
                        >
                          {formatPackageRemediationCountLabel(
                            remediations.length,
                          )}
                        </Td>
                        <Td
                          width={10}
                          modifier="truncate"
                          {...getTdProps({ columnKey: "path" })}
                        >
                          {item.decomposedPurl?.path}
                        </Td>
                        <Td
                          width={20}
                          {...getTdProps({ columnKey: "qualifiers" })}
                        >
                          {item.decomposedPurl?.qualifiers && (
                            <PackageQualifiers
                              value={item.decomposedPurl?.qualifiers}
                            />
                          )}
                        </Td>
                        <Td
                          width={10}
                          {...getTdProps({ columnKey: "vulnerabilities" })}
                        >
                          <PackageVulnerabilities
                            pkg={pkg}
                            isFetching={packageIsFetching}
                            fetchError={packageFetchError}
                          />
                        </Td>
                      </TableRowContentWithControls>
                    </Tr>
                    {isCellExpanded(item) ? (
                      <Tr isExpanded>
                        <Td
                          {...getExpandedContentTdProps({
                            item,
                          })}
                          className={spacing.pLg}
                        >
                          <ExpandableRowContent>
                            <div className={spacing.ptLg}>
                              {isCellExpanded(item, "licenses") ? (
                                <List isPlain>
                                  {pkg?.licenses?.map((license, idx) => (
                                    <ListItem
                                      key={`${license.license_name}-${idx}`}
                                    >
                                      {license.license_name}
                                    </ListItem>
                                  ))}
                                </List>
                              ) : null}
                              {isCellExpanded(item, "recommendations") ? (
                                <PackageRecommendationsExpand
                                  recommendations={recommendations}
                                />
                              ) : null}
                              {isCellExpanded(item, "remediations") ? (
                                <LightwellRemediationsExpand
                                  items={remediations}
                                  showVulnerability
                                />
                              ) : null}
                            </div>
                          </ExpandableRowContent>
                        </Td>
                      </Tr>
                    ) : null}
                  </Tbody>
                )}
              </WithPackage>
            );
          })}
        </ConditionalTableBody>
      </Table>
      <SimplePagination
        idPrefix="package-table"
        isTop={false}
        paginationProps={paginationProps}
      />
    </>
  );
};
