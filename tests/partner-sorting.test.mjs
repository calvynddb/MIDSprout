import test from "node:test";
import assert from "node:assert/strict";
import { nextPartnerSort, orderPartners } from "../src/lib/partner-sorting.ts";

const partner = (id, fields = {}) => ({ id, organizationName: "", acronym: "", category: "", primaryContact: "", email: "", ...fields });
const ids = (items) => items.map((item) => item.id);

test("text sorting is case insensitive, natural, deterministic and non-mutating", () => {
  const input = [partner("c", { organizationName: "Group 10" }), partner("b", { organizationName: "group 2" }), partner("a", { organizationName: "GROUP 2" })];
  assert.deepEqual(ids(orderPartners(input, "name-asc")), ["a", "b", "c"]);
  assert.deepEqual(ids(orderPartners(input, "name-desc")), ["c", "a", "b"]);
  assert.deepEqual(ids(input), ["c", "b", "a"]);
});

test("blank values stay last in either direction", () => {
  const input = [partner("a", { email: " " }), partner("b", { email: "b@example.org" }), partner("c", { email: "a@example.org" })];
  assert.deepEqual(ids(orderPartners(input, "email-asc")), ["c", "b", "a"]);
  assert.deepEqual(ids(orderPartners(input, "email-desc")), ["b", "c", "a"]);
});

test("branch, acronym and contact each support ascending and descending", () => {
  for (const [sort, field] of [["branch", "category"], ["acronym", "acronym"], ["contact", "primaryContact"]]) {
    const input = [partner("b", { [field]: "Beta" }), partner("a", { [field]: "Alpha" })];
    assert.deepEqual(ids(orderPartners(input, `${sort}-asc`)), ["a", "b"]);
    assert.deepEqual(ids(orderPartners(input, `${sort}-desc`)), ["b", "a"]);
  }
});

test("heading clicks toggle only the active field", () => {
  assert.equal(nextPartnerSort("name-asc", "name"), "name-desc");
  assert.equal(nextPartnerSort("name-desc", "name"), "name-asc");
  assert.equal(nextPartnerSort("name-desc", "email"), "email-asc");
});

test("IDs break case-insensitive value ties consistently, including case-only IDs", () => {
  const input = [partner("a", { organizationName: "Same" }), partner("A", { organizationName: "same" })];
  assert.deepEqual(ids(orderPartners(input, "name-asc")), ["A", "a"]);
  assert.deepEqual(ids(orderPartners(input, "name-desc")), ["A", "a"]);
});
