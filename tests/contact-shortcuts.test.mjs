import test from "node:test";
import assert from "node:assert/strict";
import { contactEmails, contactLinks, deduplicatedEmails } from "../src/lib/contact-shortcuts.ts";

test("copied address lists trim and deduplicate without changing original case", () => {
  const partners = [{ email: " TEAM@example.com " }, { email: "team@example.com" }, { email: "" }, { officialEmail: "another@example.com" }];
  assert.equal(deduplicatedEmails(partners), "TEAM@example.com; another@example.com");
  assert.equal(partners[0].email, " TEAM@example.com ");
});

test("email choices retain roles, trim values, and support the V1 email field", () => {
  assert.deepEqual(contactEmails({ email: " old@example.com ", partnershipContactEmail: " person@example.com " }), [
    { role: "official", label: "Official email", value: "old@example.com" },
    { role: "contact", label: "Contact person email", value: "person@example.com" },
  ]);
  assert.equal(contactEmails({ officialEmail: "new@example.com", email: "old@example.com" })[0].value, "new@example.com");
});

test("empty contact records produce no choices", () => {
  assert.deepEqual(contactEmails({}), []);
  assert.deepEqual(contactLinks({}), []);
});

test("social shortcuts accept only HTTP(S) and preserve legacy Facebook fields", () => {
  const record = { facebookPage: "https://facebook.com/team", instagramUrl: "javascript:alert(1)", xUrl: "file:///etc/passwd", tiktokUrl: "not a URL", contactFacebookLink: "http://facebook.com/person" };
  assert.deepEqual(contactLinks(record), [
    { label: "Facebook", href: "https://facebook.com/team" },
    { label: "Contact Facebook", href: "http://facebook.com/person" },
  ]);
  assert.equal(record.instagramUrl, "javascript:alert(1)");
});
