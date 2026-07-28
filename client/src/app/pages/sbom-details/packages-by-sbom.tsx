import React from "react";
import { generatePath, Link } from "react-router-dom";

import {
  List,
  ListItem,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from "@patternfly/react-core";
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

import type { LicenseRefMapping } from "@app/client";
import { FilterToolbar, FilterType } from "@app/components/FilterToolbar";
import { PackageRecommendationsExpand } from "@app/components/PackageRecommendationsExpand";
import { SimplePagination } from "@app/components/SimplePagination";
import {
  ConditionalTableBody,
  TableHeaderContentWithControls,
  TableRowContentWithControls,
} from "@app/components/TableControls";
import { VulnerabilityGallery } from "@app/components/VulnerabilityGallery";
import { WithPackage } from "@app/components/WithPackage";
import { FILTER_TEXT_CATEGORY_KEY } from "@app/Constants";
import {
  getHubRequestParams,
  useTableControlProps,
  useTableControlState,
} from "@app/hooks/table-controls";
import { getMockPackageRecommendations } from "@app/mocks/package-recommendations";
import {
  mockPackages,
  packageNameFromPurl,
} from "@app/mocks/packages";
import {
  formatRecommendationCountLabel,
  packageMatchesLightwellRemediationFilter,
} from "@app/mocks/sbom-remediations";
import { useFetchPackagesBySbomId } from "@app/queries/packages";
import { useFetchSbomsLicenseIds } from "@app/queries/sboms";
import { Paths } from "@app/Routes";

import { PackageVulnerabilities } from "../package-list/components/PackageVulnerabilities";
import { RemediationVersionCell } from "../package-list/components/RemediationVersionCell";

import { SBOM_PACKAGES_TABLE_PREFIX } from "./helpers";

declare const __MOCK_DATA__: boolean;

const packageNameOptions = [
  ...new Map(
    mockPackages.map((pkg) => {
      const name = packageNameFromPurl(pkg.purl);
      return [name, { value: name, label: name }] as const;
    }),
  ).values(),
];

const renderLicenseWithMappings = (
  license: string,
  mappings: LicenseRefMapping[],
) => {
  return mappings.reduce((prev, { license_id, license_name }) => {
    return prev.replaceAll(license_id, license_name);
  }, `${license}`);
};

interface PackagesProps {
  sbomId: string;
}

export const PackagesBySbom: React.FC<PackagesProps> = ({ sbomId }) => {
  const { licenseIds } = useFetchSbomsLicenseIds(sbomId);

  const tableControlState = useTableControlState({
    tableName: "package-table",
    persistenceKeyPrefix: SBOM_PACKAGES_TABLE_PREFIX,
    persistTo: "urlParams",
    columnNames: {
      name: "Name",
      version: "Version",
      vulnerabilities: "Vulnerabilities",
      licenses: "Licenses",
      recommendations: "Red Hat recommendations",
      remediations: "Lightwell remediations",
      purls: "PURLs",
      cpes: "CPEs",
    },
    isSortEnabled: true,
    sortableColumns: ["name"],
    isPaginationEnabled: true,
    isFilterEnabled: true,
    filterCategories: [
      {
        categoryKey: FILTER_TEXT_CATEGORY_KEY,
        title: "Filter text",
        placeholderText: "Search",
        type: FilterType.search,
      },
      {
        categoryKey: "name",
        title: "Package",
        placeholderText: "Filter by package name",
        type: FilterType.multiselect,
        logicOperator: "OR",
        selectOptions: packageNameOptions,
      },
      {
        categoryKey: "license",
        title: "License",
        placeholderText: "Filter results by license",
        type: FilterType.multiselect,
        operator: "=",
        logicOperator: "OR",
        selectOptions: licenseIds.map((license) => ({
          value: license.license_id,
          label: license.license_name.toUpperCase(),
        })),
      },
      {
        categoryKey: "lightwellRemediation",
        title: "Lightwell remediations",
        placeholderText: "Filter by Lightwell remediation",
        type: FilterType.multiselect,
        logicOperator: "OR",
        excludeFromHubRequest: true,
        selectOptions: [
          { value: "backport", label: "Backport" },
          { value: "upgrade", label: "Version upgrade" },
        ],
      },
    ],
    isExpansionEnabled: true,
    expandableVariant: "compound",
  });

  const lightwellRemediationFilters =
    tableControlState.filterState.filterValues.lightwellRemediation ?? [];

  const {
    result: { data: packages, total: totalItemCount },
    isFetching,
    fetchError,
  } = useFetchPackagesBySbomId(sbomId, {
    ...getHubRequestParams({
      ...tableControlState,
      hubSortFieldKeys: {
        name: "name",
      },
    }),
    total: true,
  });

  const filteredPackages = React.useMemo(() => {
    if (!__MOCK_DATA__ || lightwellRemediationFilters.length === 0) {
      return packages;
    }

    return packages.filter((item) => {
      const packageId = item.purl[0]?.uuid ?? item.id;
      return packageMatchesLightwellRemediationFilter(
        packageId,
        item.name,
        lightwellRemediationFilters,
      );
    });
  }, [packages, lightwellRemediationFilters]);

  const filteredTotalItemCount =
    __MOCK_DATA__ && lightwellRemediationFilters.length > 0
      ? filteredPackages.length
      : totalItemCount;

  const tableControls = useTableControlProps({
    ...tableControlState,
    idProperty: "id",
    currentPageItems: filteredPackages,
    totalItemCount: filteredTotalItemCount,
    isLoading: isFetching,
  });

  const {
    currentPageItems,
    numRenderedColumns,
    propHelpers: {
      toolbarProps,
      filterToolbarProps,
      paginationToolbarItemProps,
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
      <Toolbar {...toolbarProps} aria-label="Package toolbar">
        <ToolbarContent>
          <FilterToolbar {...filterToolbarProps} />
          <ToolbarItem {...paginationToolbarItemProps}>
            <SimplePagination
              idPrefix="package-table"
              isTop
              paginationProps={paginationProps}
            />
          </ToolbarItem>
        </ToolbarContent>
      </Toolbar>

      <Table {...tableProps} aria-label="Package table">
        <Thead>
          <Tr>
            <TableHeaderContentWithControls {...tableControls}>
              <Th {...getThProps({ columnKey: "name" })} />
              <Th {...getThProps({ columnKey: "version" })} />
              <Th {...getThProps({ columnKey: "vulnerabilities" })} />
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
                info={{
                  tooltip:
                    "Fixed package versions from Lightwell. Blue pills with a .rhlw- suffix are Lightwell backports (same version stream). Green pills are version upgrades.",
                }}
              />
              <Th {...getThProps({ columnKey: "purls" })} />
              <Th
                modifier="fitContent"
                {...getThProps({ columnKey: "cpes" })}
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
          {currentPageItems?.map((item, rowIndex) => {
            const packageId = item.purl[0]?.uuid ?? item.id;
            const recommendations = __MOCK_DATA__
              ? getMockPackageRecommendations(packageId, item.name)
              : [];

            return (
              <Tbody key={item.id} isExpanded={isCellExpanded(item)}>
                <Tr {...getTrProps({ item })}>
                  <TableRowContentWithControls
                    {...tableControls}
                    item={item}
                    rowIndex={rowIndex}
                  >
                    <Td width={15} {...getTdProps({ columnKey: "name" })}>
                      {[item.name, item.group].filter(Boolean).join("/")}
                    </Td>
                    <Td
                      width={10}
                      modifier="truncate"
                      {...getTdProps({ columnKey: "version" })}
                    >
                      {item?.version}
                    </Td>
                    <Td
                      width={10}
                      modifier="breakWord"
                      {...getTdProps({ columnKey: "vulnerabilities" })}
                    >
                      {item.purl[0] ? (
                        <WithPackage packageId={item.purl[0].uuid}>
                          {(pkg, isFetching, fetchError) => (
                            <PackageVulnerabilities
                              pkg={pkg}
                              isFetching={isFetching}
                              fetchError={fetchError}
                            />
                          )}
                        </WithPackage>
                      ) : (
                        <VulnerabilityGallery
                          severities={{
                            critical: 0,
                            high: 0,
                            medium: 0,
                            low: 0,
                            none: 0,
                            unknown: 0,
                          }}
                        />
                      )}
                    </Td>
                    <Td
                      width={10}
                      modifier="breakWord"
                      {...getTdProps({
                        columnKey: "licenses",
                        isCompoundExpandToggle: item.licenses.length > 0,
                        item: item,
                        rowIndex,
                      })}
                    >
                      {item.licenses.length} Licenses
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
                      {formatRecommendationCountLabel(recommendations.length)}
                    </Td>
                    <Td
                      width={20}
                      {...getTdProps({ columnKey: "remediations" })}
                    >
                      <RemediationVersionCell
                        packageId={packageId}
                        packageName={item.name}
                      />
                    </Td>
                    <Td
                      width={20}
                      modifier="breakWord"
                      {...getTdProps({
                        columnKey: "purls",
                        isCompoundExpandToggle: item.purl.length > 1,
                        item: item,
                        rowIndex,
                      })}
                    >
                      {item.purl.length === 1 ? (
                        <Link
                          to={generatePath(Paths.packageDetails, {
                            packageId: item.purl[0].uuid,
                          })}
                        >
                          {item.purl[0].purl}
                        </Link>
                      ) : (
                        `${item.purl.length} PURLs`
                      )}
                    </Td>
                    <Td
                      width={10}
                      modifier="breakWord"
                      {...getTdProps({
                        columnKey: "cpes",
                        isCompoundExpandToggle: item.cpe.length > 0,
                        item,
                        rowIndex,
                      })}
                    >
                      {item.cpe.length} CPEs
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
                              {item.licenses.map((e) => (
                                <ListItem
                                  key={`${e.license_name}-${e.license_type}`}
                                >
                                  {renderLicenseWithMappings(
                                    e.license_name,
                                    item.licenses_ref_mapping,
                                  )}
                                </ListItem>
                              ))}
                            </List>
                          ) : null}
                          {isCellExpanded(item, "recommendations") ? (
                            <PackageRecommendationsExpand
                              recommendations={recommendations}
                            />
                          ) : null}
                          {isCellExpanded(item, "purls") ? (
                            <List isPlain>
                              {item.purl.map((e) => {
                                return (
                                  <ListItem key={e.uuid}>
                                    <Link
                                      to={generatePath(Paths.packageDetails, {
                                        packageId: e.uuid,
                                      })}
                                    >
                                      {e.purl}
                                    </Link>
                                  </ListItem>
                                );
                              })}
                            </List>
                          ) : null}
                          {isCellExpanded(item, "cpes") ? (
                            <List isPlain>
                              {item.cpe.map((e) => (
                                <ListItem key={e}>{e}</ListItem>
                              ))}
                            </List>
                          ) : null}
                        </div>
                      </ExpandableRowContent>
                    </Td>
                  </Tr>
                ) : null}
              </Tbody>
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
