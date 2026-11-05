import { test } from "node:test";
import assert from "node:assert/strict";
import ExcelJS from "exceljs";
import { ORGANIZATION_EXPORT_FIELDS, organizationsCsv, organizationsXlsx } from "../src/lib/organization-export.ts";

const record = { id: "00123", organizationName: 'Café, "Team"\nNext', phone: "0012345", email: "team@example.com", about: "=1+1", logoUrl: "data:image/png;base64,not-exported" };

test("CSV preserves quotes, newlines and Unicode, protects formulas, and excludes logos", () => {
  const csv = organizationsCsv([record]);
  assert.ok(csv.startsWith("\uFEFF"));
  assert.ok(csv.includes('"Café, ""Team""\nNext"'));
  assert.ok(csv.includes('"\'=1+1"'));
  assert.ok(csv.includes('"0012345"'));
  assert.ok(!csv.includes("not-exported"));
});

test("exports preserve order and do not alter source records", () => {
  const before = JSON.stringify(record);
  const csv = organizationsCsv([record, { id: "second", organizationName: "Second" }]);
  assert.ok(csv.indexOf('"00123"') < csv.indexOf('"second"'));
  assert.equal(JSON.stringify(record), before);
});

test("XLSX contains text IDs/phones, frozen header, filters and exact cell values", async () => {
  const bytes = await organizationsXlsx([record]);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(bytes);
  const sheet = workbook.getWorksheet("Organizations");
  const value = field => sheet.getRow(2).getCell(ORGANIZATION_EXPORT_FIELDS.indexOf(field) + 1).value;
  assert.equal(value("id"), "00123");
  assert.equal(value("phone"), "0012345");
  assert.equal(value("organizationName"), record.organizationName);
  assert.equal(value("about"), "=1+1");
  assert.equal(sheet.views[0].ySplit, 1);
  assert.ok(sheet.autoFilter);
  assert.equal(sheet.rowCount, 2);
});
