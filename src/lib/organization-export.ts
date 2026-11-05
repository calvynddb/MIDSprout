import type { Partnership } from "@/types/partnership";

export const ORGANIZATION_EXPORT_FIELDS: Array<keyof Partnership> = [
  "id", "organizationName", "acronym", "category", "natureOfOrganization", "about", "address",
  "email", "officialEmail", "partnershipEmail", "primaryContact", "phone",
  "organizationHeadName", "organizationHeadDesignation", "organizationHeadEmail", "organizationHeadFacebookUrl",
  "partnershipContactName", "partnershipContactDesignation", "partnershipContactNumber", "partnershipContactEmail", "partnershipContactFacebookUrl",
  "organizationFacebookUrl", "facebookPage", "contactFacebookLink", "instagramUrl", "xUrl", "tiktokUrl", "otherSocialMediaPlatforms",
  "collaborationStatus", "approvalDate", "officerInContact",
];

function csvCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function organizationsCsv(partners: readonly Partnership[]): string {
  const rows = [ORGANIZATION_EXPORT_FIELDS, ...partners.map((partner) => ORGANIZATION_EXPORT_FIELDS.map((field) => partner[field] ?? ""))];
  return "\uFEFF" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
}

export async function organizationsXlsx(partners: readonly Partnership[]): Promise<ArrayBuffer> {
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Organizations");
  sheet.columns = ORGANIZATION_EXPORT_FIELDS.map((field) => ({ header: field, key: field, width: field === "organizationName" ? 48 : field === "id" ? 38 : 26 }));
  for (const partner of partners) sheet.addRow(ORGANIZATION_EXPORT_FIELDS.map((field) => String(partner[field] ?? "")));
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: Math.max(1, sheet.rowCount), column: ORGANIZATION_EXPORT_FIELDS.length } };
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF007BFF" } };
  sheet.getRow(1).height = 25;
  sheet.eachRow((row, index) => { if (index > 1) row.eachCell((cell) => { cell.numFmt = "@"; }); });
  const bytes = await workbook.xlsx.writeBuffer();
  return new Blob([bytes]).arrayBuffer();
}
