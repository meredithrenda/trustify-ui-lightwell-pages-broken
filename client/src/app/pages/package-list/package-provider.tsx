import React from "react";

import { useDebounceValue } from "usehooks-ts";

import {
  FILTER_TEXT_CATEGORY_KEY,
  TablePersistenceKeyPrefixes,
} from "@app/Constants";
import { FilterType } from "@app/components/FilterToolbar";
import {
  getHubRequestParams,
  useTableControlProps,
  useTableControlState,
} from "@app/hooks/table-controls";
import { packageMatchesLightwellRemediationFilter } from "@app/mocks/sbom-remediations";
import { useFetchLicenses } from "@app/queries/licenses";
import { useFetchPackages } from "@app/queries/packages";
import { decomposePurl, parseBooleanIfPossible } from "@app/utils/utils";

import {
  type PackageTableData,
  PackageSearchContext,
} from "./package-context";

declare const __MOCK_DATA__: boolean;

interface IPackageProvider {
  children: React.ReactNode;
}

export const PackageSearchProvider: React.FunctionComponent<
  IPackageProvider
> = ({ children }) => {
  const [inputValueLicense, setInputValueLicense] = React.useState("");
  const [debouncedInputValueLicense] = useDebounceValue(inputValueLicense, 400);
  const {
    result: { data: licenses },
  } = useFetchLicenses({
    filters: [
      {
        field: FILTER_TEXT_CATEGORY_KEY,
        operator: "~",
        value: debouncedInputValueLicense,
      },
    ],
    sort: { field: "license", direction: "asc" },
    page: { pageNumber: 1, itemsPerPage: 10 },
  });

  const tableControlState = useTableControlState({
    tableName: "package",
    persistenceKeyPrefix: TablePersistenceKeyPrefixes.packages,
    persistTo: "urlParams",
    columnNames: {
      name: "Name",
      namespace: "Namespace",
      version: "Version",
      type: "Type",
      path: "Path",
      qualifiers: "Qualifiers",
      licenses: "Licenses",
      recommendations: "Red Hat recommendations",
      remediations: "Lightwell remediations",
      vulnerabilities: "Vulnerabilities",
    },
    isPaginationEnabled: true,
    isSortEnabled: true,
    sortableColumns: ["name", "namespace", "version"],
    isFilterEnabled: true,
    filterCategories: [
      {
        categoryKey: FILTER_TEXT_CATEGORY_KEY,
        title: "Filter text",
        placeholderText: "Search",
        type: FilterType.search,
      },
      {
        categoryKey: "type",
        title: "Type",
        placeholderText: "Type",
        type: FilterType.multiselect,
        selectOptions: [
          { value: "maven", label: "Maven" },
          { value: "rpm", label: "RPM" },
          { value: "npm", label: "NPM" },
          { value: "oci", label: "OCI" },
        ],
      },
      {
        categoryKey: "arch",
        title: "Architecture",
        placeholderText: "Architecture",
        type: FilterType.multiselect,
        selectOptions: [
          { value: "x86_64", label: "AMD 64bit" },
          { value: "aarch64", label: "ARM 64bit" },
          { value: "ppc64le", label: "PowerPC" },
          { value: "s390x", label: "S390" },
          { value: "noarch", label: "No Arch" },
        ],
      },
      {
        categoryKey: "license",
        title: "License",
        type: FilterType.asyncMultiselect,
        placeholderText: "Filter results by license",
        selectOptions: licenses.map((e) => {
          return {
            value: e.license,
            label: e.license,
          };
        }),
        onInputValueChange: setInputValueLicense,
      },
      {
        categoryKey: "has_vulnerabilities",
        title: "Vulnerabilities",
        type: FilterType.toggle,
        label: "Show only packages with vulnerabilities",
        useSwitch: true,
        showOutsideDropdown: true,
        excludeFromHubRequest: true,
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

  const hasVulnerabilities = parseBooleanIfPossible(
    tableControlState.filterState.filterValues.has_vulnerabilities?.[0],
  );
  const lightwellRemediationFilters =
    tableControlState.filterState.filterValues.lightwellRemediation ?? [];

  const {
    result: { data: packages, total: totalItemCount },
    isFetching,
    fetchError,
  } = useFetchPackages(
    getHubRequestParams({
      ...tableControlState,
      hubSortFieldKeys: {
        name: "name",
        namespace: "namespace",
        version: "version",
      },
    }),
    { hasVulnerabilities },
  );

  const enrichedPackages = React.useMemo(() => {
    const items = packages.map((item) => {
      const result: PackageTableData = {
        ...item,
        decomposedPurl: decomposePurl(item.purl),
      };
      return result;
    });

    if (!__MOCK_DATA__ || lightwellRemediationFilters.length === 0) {
      return items;
    }

    return items.filter((item) =>
      packageMatchesLightwellRemediationFilter(
        item.uuid,
        item.decomposedPurl?.name,
        lightwellRemediationFilters,
      ),
    );
  }, [packages, lightwellRemediationFilters]);

  const filteredTotalItemCount =
    __MOCK_DATA__ && lightwellRemediationFilters.length > 0
      ? enrichedPackages.length
      : totalItemCount;

  const tableControls = useTableControlProps({
    ...tableControlState,
    idProperty: "uuid",
    currentPageItems: enrichedPackages,
    totalItemCount: filteredTotalItemCount,
    isLoading: isFetching,
  });

  return (
    <PackageSearchContext.Provider
      value={{
        totalItemCount: filteredTotalItemCount,
        isFetching,
        fetchError,
        tableControls,
      }}
    >
      {children}
    </PackageSearchContext.Provider>
  );
};
