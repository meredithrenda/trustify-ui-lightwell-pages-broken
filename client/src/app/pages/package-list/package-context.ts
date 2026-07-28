import React from "react";

import type { AxiosError } from "axios";

import type { DecomposedPurl } from "@app/api/models";
import type { PurlSummary } from "@app/client";
import type { ITableControls } from "@app/hooks/table-controls";

export interface PackageTableData extends PurlSummary {
  decomposedPurl?: DecomposedPurl;
}

export interface IPackageSearchContext {
  tableControls: ITableControls<
    PackageTableData,
    | "name"
    | "namespace"
    | "version"
    | "type"
    | "licenses"
    | "recommendations"
    | "remediations"
    | "path"
    | "qualifiers"
    | "vulnerabilities",
    "name" | "namespace" | "version",
    | ""
    | "type"
    | "arch"
    | "license"
    | "has_vulnerabilities"
    | "lightwellRemediation",
    string
  >;

  totalItemCount: number;
  isFetching: boolean;
  fetchError: AxiosError | null;
}

const contextDefaultValue = {} as IPackageSearchContext;

export const PackageSearchContext =
  React.createContext<IPackageSearchContext>(contextDefaultValue);
