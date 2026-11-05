import type { Partnership } from "../types/partnership";

export function deduplicatedEmails(partners: readonly Partnership[]): string {
  const emails = new Map<string, string>();
  for (const partner of partners) {
    const email = (partner.email || partner.officialEmail || partner.partnershipEmail || partner.partnershipContactEmail || "").trim();
    if (email && !emails.has(email.toLowerCase())) emails.set(email.toLowerCase(), email);
  }
  return [...emails.values()].join("; ");
}

export function contactEmails(partner: Partial<Partnership>) {
  return [
    { role: "official", label: "Official email", value: partner.officialEmail || partner.email },
    { role: "partnership", label: "Partnership email", value: partner.partnershipEmail },
    { role: "contact", label: "Contact person email", value: partner.partnershipContactEmail },
    { role: "head", label: "Organization head email", value: partner.organizationHeadEmail },
  ].map((email) => ({ ...email, value: (email.value || "").trim() })).filter((email) => email.value);
}

export function contactLinks(partner: Partial<Partnership>) {
  return [
    ["Facebook", partner.organizationFacebookUrl || partner.facebookPage],
    ["Instagram", partner.instagramUrl], ["X", partner.xUrl], ["TikTok", partner.tiktokUrl],
    ["Contact Facebook", partner.partnershipContactFacebookUrl || partner.contactFacebookLink],
    ["Head Facebook", partner.organizationHeadFacebookUrl],
  ].flatMap(([label, value]) => {
    try {
      const url = new URL((value || "").trim());
      return url.protocol === "https:" || url.protocol === "http:" ? [{ label, href: url.href }] : [];
    } catch { return []; }
  });
}
