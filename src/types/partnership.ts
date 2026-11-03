export const PARTNER_CATEGORIES = [
  "Student Councils",
  "Societies",
  "COO",
  "Publications",
  "MSU-IIT Offices",
  "DOST Organizations",
  "External Organizations",
] as const;

export type PartnerCategory = (typeof PARTNER_CATEGORIES)[number];

export interface Partnership {
  id: string;
  logoUrl: string;
  acronym: string;
  organizationName: string;
  category: PartnerCategory;
  primaryContact: string;
  email: string;
  about: string;
  phone: string;
  address: string;
  contactFacebookLink: string;
  facebookPage: string;
  collaborationStatus: string;
  approvalDate: string;
  officerInContact: string;
  natureOfOrganization: string;
  officialEmail: string;
  partnershipEmail: string;
  organizationHeadName: string;
  organizationHeadDesignation: string;
  organizationHeadEmail: string;
  organizationHeadFacebookUrl: string;
  partnershipContactName: string;
  partnershipContactDesignation: string;
  partnershipContactNumber: string;
  partnershipContactEmail: string;
  partnershipContactFacebookUrl: string;
  organizationFacebookUrl: string;
  instagramUrl: string;
  xUrl: string;
  tiktokUrl: string;
  otherSocialMediaPlatforms: string;
}

export type PartnershipEventStatus = "planning" | "confirmed" | "completed" | "cancelled";

export interface EventParticipation {
  partnerId: string;
  /** Legacy per-organization committees are migrated to the collaboration. */
  committees?: string[];
}

export interface PartnershipEvent {
  id: string;
  name: string;
  collaborationType: string;
  committees: string[];
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  location: string;
  description: string;
  status: PartnershipEventStatus;
  participants: EventParticipation[];
}

export type CameraView = "root" | "tree" | "branches";
