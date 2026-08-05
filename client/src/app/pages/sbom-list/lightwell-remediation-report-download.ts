import { saveAs } from "file-saver";

import type { LightwellRemediationReport } from "./lightwell-remediation-report";

export const convertLightwellRemediationReportToCSV = (
  report: LightwellRemediationReport,
): string => {
  const lines: string[] = [
    "Summary",
    "selected_applications,addressable_applications,addressable_packages",
    [
      report.selectedApplicationCount,
      report.addressableApplicationCount,
      report.addressablePackageCount,
    ].join(","),
    "",
    "Applications Lightwell can help with",
    "application_name,addressable_package_count",
    ...report.applications.map(
      (application) =>
        `"${application.name.replace(/"/g, '""')}",${application.addressablePackageCount}`,
    ),
    "",
    "Packages Lightwell can help with",
    "package_name,version,applications",
    ...report.packages.map((pkg) => {
      const name = pkg.packageName.replace(/"/g, '""');
      const version = (pkg.version ?? "").replace(/"/g, '""');
      const apps = pkg.applicationNames.join("; ").replace(/"/g, '""');
      return `"${name}","${version}","${apps}"`;
    }),
  ];

  return lines.join("\n");
};

export const downloadLightwellRemediationReportCsv = (
  report: LightwellRemediationReport,
  fileName = "lightwell-remediation-report.csv",
) => {
  const csv = convertLightwellRemediationReportToCSV(report);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  saveAs(blob, fileName);
};
