/**
 * Telangana Government schemes — Welfare Hub UI + Vikas Sahayak AI context.
 */

export interface WelfareScheme {
  name: string;
  tagline: string;
  keyPoints: string[];
  howToApply: string[];
  applyAt: string;
  portalUrl?: string;
}

/** Short listings for Welfare Hub (no long descriptions). */
export const WELFARE_SCHEMES: WelfareScheme[] = [
  {
    name: "Maha Lakshmi",
    tagline: "₹2,500 assistance, ₹500 LPG cylinders & free TSRTC bus travel for eligible women.",
    keyPoints: ["₹2,500 assistance", "₹500 LPG cylinders", "Free TSRTC bus travel"],
    applyAt: "MeeSeva centre or Gram Panchayat",
    howToApply: [
      "Carry Aadhaar, ration card & active bank passbook.",
      "Visit MeeSeva or Gram Panchayat and submit the Maha Lakshmi application.",
      "Track status through MeeSeva / official updates from Panchayat.",
    ],
  },
  {
    name: "Cheyutha / Rajiv Aarogyasri",
    tagline: "Health coverage up to ₹10 lakh for eligible families.",
    keyPoints: ["Up to ₹10 lakh coverage", "Eligible families"],
    applyAt: "Empanelled hospital or MeeSeva",
    howToApply: [
      "Check eligibility (white ration card / BPL categories as notified).",
      "Enrol at an empanelled Aarogyasri hospital or MeeSeva with family ID proof.",
      "Use health card at network hospitals for covered treatment.",
    ],
  },
  {
    name: "Aasara Pensions",
    tagline: "Social-security pensions for elderly, widows, PwD & other vulnerable groups.",
    keyPoints: ["Old age & widow pensions", "Disability support", "Monthly disbursement"],
    applyAt: "MeeSeva / Pension portal",
    howToApply: [
      "Confirm category (old age, widow, disability, etc.) and age/eligibility norms.",
      "Apply at MeeSeva with Aadhaar, age/disability certificate & bank details.",
      "Pension is credited monthly after approval — check status at MeeSeva.",
    ],
  },
  {
    name: "Rythu Bharosa",
    tagline: "Agricultural income support for eligible farmers.",
    keyPoints: ["Farmer income support", "Seasonal assistance"],
    applyAt: "Agriculture office / online farmer portal",
    howToApply: [
      "Ensure land records (Pattadar passbook) and bank account are updated.",
      "Register as farmer at Mandal Agriculture office if not already enrolled.",
      "Amount is usually credited directly — verify with agriculture / Panchayat.",
    ],
  },
  {
    name: "Rythu Bima",
    tagline: "Life-insurance support for eligible farmers.",
    keyPoints: ["Farmer life insurance", "Eligible beneficiaries"],
    applyAt: "Mandal Agriculture office / MeeSeva",
    howToApply: [
      "Farmer must be registered with valid land & bank details.",
      "Nominee details are collected during enrollment at agriculture office.",
      "Claims are filed through the designated channel with death certificate & land proof.",
    ],
  },
  {
    name: "Kalyana Lakshmi / Shaadi Mubarak",
    tagline: "Marriage assistance for eligible families.",
    keyPoints: ["Marriage grant", "Eligible families"],
    applyAt: "MeeSeva (apply before marriage date)",
    howToApply: [
      "Apply before the marriage date with bride details & income/eligibility proof.",
      "Submit at MeeSeva with Aadhaar, age certificate & marriage invitation (if available).",
      "Assistance is released after verification as per scheme rules.",
    ],
  },
  {
    name: "Telangana ePASS Scholarships",
    tagline: "Scholarships for eligible students via the official state ePASS portal.",
    keyPoints: ["Student scholarships", "Official ePASS portal"],
    applyAt: "telanganaepass.cgg.gov.in",
    portalUrl: "https://telanganaepass.cgg.gov.in",
    howToApply: [
      "Open the official Telangana ePASS portal and select your scholarship type.",
      "Register with hall ticket, Aadhaar, income & caste certificates as required.",
      "Submit online and note application ID to track renewal / status.",
    ],
  },
  {
    name: "Housing Schemes",
    tagline: "Housing assistance for eligible economically weaker families.",
    keyPoints: ["EWS housing support", "Panchayat / state programs"],
    applyAt: "Gram Panchayat / housing department",
    howToApply: [
      "Check if your village has an active housing scheme (PMAY / state programs).",
      "Apply at Gram Panchayat with Aadhaar, income proof & land/house details.",
      "Beneficiary list is published at Panchayat — follow up for sanction & construction support.",
    ],
  },
  {
    name: "Economic Welfare Schemes",
    tagline: "Assistance through BC, SC, ST & Minority Welfare departments.",
    keyPoints: ["BC Welfare", "SC/ST Welfare", "Minority Welfare"],
    applyAt: "Respective Welfare department / MeeSeva",
    howToApply: [
      "Identify your category (BC / SC / ST / Minority) and the specific scheme.",
      "Collect caste/income certificate and apply at MeeSeva or welfare office.",
      "Track application through the department or MeeSeva receipt.",
    ],
  },
  {
    name: "Mission Bhagiratha",
    tagline: "Safe piped drinking water to every rural household.",
    keyPoints: ["Tap connections", "Water quality monitoring"],
    applyAt: "Gram Panchayat / water board",
    howToApply: [
      "Household tap connections are usually provided village-wide — confirm with Panchayat.",
      "For new connections or supply issues, report at Gram Panchayat office.",
      "Water quality grievances can be raised through Panchayat / helpline.",
    ],
  },
  {
    name: "Rythu Bandhu",
    tagline: "₹5,000 per acre per season investment support for farmers.",
    keyPoints: ["Yasangi & Kharif", "Direct bank transfer"],
    applyAt: "Agriculture department (auto-linked to land records)",
    howToApply: [
      "Update Pattadar passbook and linked bank account at agriculture office.",
      "Ensure land is recorded in your name for the eligible acreage.",
      "Support is credited seasonally — verify disbursement in passbook / bank SMS.",
    ],
  },
  {
    name: "Palle Pragathi",
    tagline: "Village development — cleanliness, greenery & rural infrastructure.",
    keyPoints: ["Sanitation drives", "Plantation", "Local roads"],
    applyAt: "Gram Panchayat / Sarpanch",
    howToApply: [
      "Village works are planned at Gram Sabha — participate and raise local needs.",
      "Contact Sarpanch or Panchayat secretary for sanitation / road / plantation requests.",
      "Track progress through ward member or Panchayat meetings.",
    ],
  },
  {
    name: "Grama Jyothi",
    tagline: "24×7 power supply for agriculture & villages.",
    keyPoints: ["Free farm power", "Village electrification"],
    applyAt: "DISCOM / Gram Panchayat",
    howToApply: [
      "Farm connections: apply at DISCOM with land proof & applicant ID.",
      "For outages or voltage issues, lodge complaint on DISCOM helpline / app.",
      "New domestic connections follow standard DISCOM application process.",
    ],
  },
];

export const SCHEME_KNOWLEDGE = Object.fromEntries(
  WELFARE_SCHEMES.map((s) => [
    s.name,
    {
      description: s.tagline,
      keyPoints: s.keyPoints,
      howToApply: s.howToApply,
      applyAt: s.applyAt,
      ...(s.portalUrl ? { portalUrl: s.portalUrl } : {}),
    },
  ])
) as Record<
  string,
  {
    description: string;
    keyPoints: string[];
    howToApply: string[];
    applyAt: string;
    portalUrl?: string;
    statusNote?: string;
  }
>;

export function getSchemeSummary(): string {
  return WELFARE_SCHEMES.map((s) => `${s.name}: ${s.tagline}`).join("\n");
}
