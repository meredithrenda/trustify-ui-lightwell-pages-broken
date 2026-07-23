import { useQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import type { HubRequestParams } from "@app/api/models";

import { client } from "../axios-config/apiInit";
import { getPurl, listPackages, listPurl } from "../client";
import { requestParamsQuery } from "../hooks/table-controls";
import {
  getMockSbomPackages,
  getMockSbomPackagesByNames,
  mockPackageUuidsWithVulnerabilities,
  mockPackages,
} from "@app/mocks/packages";

declare const __MOCK_DATA__: boolean;

export const PackagesQueryKey = "packages";

export type UseFetchPackagesOptions = {
  disableQuery?: boolean;
  /**
   * When true, request only packages with at least one vulnerability (`has_vulnerabilities`
   * query param). Mock data filters the same way for UX development.
   */
  hasVulnerabilities?: boolean;
};

const normalizeFetchPackagesOptions = (
  opts?: boolean | UseFetchPackagesOptions,
): UseFetchPackagesOptions => {
  if (opts === undefined) {
    return {};
  }
  if (typeof opts === "boolean") {
    return { disableQuery: opts };
  }
  return opts;
};

export const useFetchPackages = (
  params: HubRequestParams = {},
  opts?: boolean | UseFetchPackagesOptions,
) => {
  const { disableQuery = false, hasVulnerabilities = false } =
    normalizeFetchPackagesOptions(opts);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [PackagesQueryKey, params, hasVulnerabilities],
    queryFn: () => {
      const baseQuery = requestParamsQuery(params);
      const query = {
        ...baseQuery,
        ...(hasVulnerabilities ? { has_vulnerabilities: true as const } : {}),
      };

      if (__MOCK_DATA__) {
        let items = [...mockPackages];
        if (hasVulnerabilities) {
          items = items.filter((p) =>
            mockPackageUuidsWithVulnerabilities.has(p.uuid),
          );
        }
        return Promise.resolve({
          data: { items, total: items.length },
        });
      }
      return listPurl({
        client: client,
        query,
      });
    },
    enabled: !disableQuery,
  });

  return {
    result: {
      data: data?.data?.items || [],
      total: data?.data?.total ?? 0,
      params: params,
    },
    isFetching: isLoading,
    fetchError: error as AxiosError | null,
    refetch,
  };
};

export const packageByIdQueryOptions = (id: string) => ({
  queryKey: [PackagesQueryKey, id],
  queryFn: () => {
    if (__MOCK_DATA__) {
      const found = mockPackages.find((p) => p.uuid === id);
      return Promise.resolve({ data: found ?? mockPackages[0] });
    }
    return getPurl({ client, path: { key: id } });
  },
});

export const useFetchPackageById = (id: string) => {
  const { data, isLoading, error } = useQuery(packageByIdQueryOptions(id));

  return {
    pkg: data?.data,
    isFetching: isLoading,
    fetchError: error as AxiosError | null,
  };
};

export const useFetchPackagesBySbomId = (
  sbomId: string,
  params: HubRequestParams = {},
) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [PackagesQueryKey, "by-sbom", sbomId, params],
    queryFn: () => {
      if (__MOCK_DATA__) {
        const nameFilter = params.filters?.find(
          (filter) => filter.field === "name",
        );
        let packageNames: string[] = [];
        if (nameFilter) {
          if (
            typeof nameFilter.value === "object" &&
            Array.isArray(nameFilter.value.list)
          ) {
            packageNames = nameFilter.value.list.map(String);
          } else if (
            nameFilter.value !== undefined &&
            nameFilter.value !== null
          ) {
            packageNames = [String(nameFilter.value)];
          }
        }

        const items =
          packageNames.length > 0
            ? getMockSbomPackagesByNames(sbomId, packageNames)
            : getMockSbomPackages(sbomId);

        return Promise.resolve({
          data: { items, total: items.length },
        });
      }
      return listPackages({
        client,
        path: { id: sbomId },
        query: { ...requestParamsQuery(params) },
      });
    },
  });

  return {
    result: {
      data: data?.data?.items || [],
      total: data?.data?.total ?? 0,
      params,
    },
    isFetching: isLoading,
    fetchError: error as AxiosError | null,
    refetch,
  };
};
