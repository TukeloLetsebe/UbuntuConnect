// Predefined option lists for structured registration inputs (Task 9).
// "Other" entries reveal a free-text field so users aren't boxed in.

export const OTHER = "Other";

export const NPO_FOCUS_AREAS = [
  "Education",
  "Health",
  "Youth Development",
  "Environment",
  "Poverty Alleviation",
  "Human Rights",
  "Animal Welfare",
  "Arts & Culture",
  "Community Development",
  "Disaster Relief",
  OTHER,
];

// Volunteer skill checkboxes — shared by the individual application form and
// the NPO "skills required" selector so they stay in sync.
export const VOLUNTEER_SKILLS = [
  "Teaching / Tutoring",
  "Mentoring",
  "First Aid",
  "Administration",
  "Fundraising",
  "Social Media",
  "Event Planning",
  "Gardening",
  "Cooking / Catering",
  "Driving",
  "IT / Computer Skills",
  "Photography",
  "Translation",
  "Counselling",
  "Construction / Handywork",
];

// Categories an NPO can tag a volunteer opportunity with.
export const OPPORTUNITY_CATEGORIES = [
  "Education",
  "Health",
  "Youth Development",
  "Environment",
  "Poverty Alleviation",
  "Human Rights",
  "Animal Welfare",
  "Arts & Culture",
  "Community Development",
  "Disaster Relief",
  "Sports & Recreation",
  "Administration",
  OTHER,
];

// Preset time-commitment options for a volunteer opportunity.
export const TIME_COMMITMENTS = [
  "A few hours (once-off)",
  "2-4 hours/week",
  "5-10 hours/week",
  "10+ hours/week",
  "Weekends only",
  "Flexible",
  OTHER,
];

// Preset duration options for a volunteer opportunity.
export const DURATIONS = [
  "Once-off",
  "Less than 1 month",
  "1-3 months",
  "3-6 months",
  "6-12 months",
  "Ongoing / Open-ended",
  OTHER,
];

export const INDIVIDUAL_CAUSES = [
  "Education",
  "Health",
  "Environment",
  "Poverty Alleviation",
  "Youth Development",
  "Human Rights",
  "Animal Welfare",
  "Arts & Culture",
  "Gender Equality",
  "Food Security",
];

export const BUSINESS_INDUSTRIES = [
  "Technology",
  "Finance",
  "Retail",
  "Manufacturing",
  "Mining",
  "Agriculture",
  "Healthcare",
  "Construction",
  "Telecommunications",
  "Energy",
  "Transport & Logistics",
  "Hospitality",
  OTHER,
];

export const CSR_BBEE_GOALS = [
  "B-BBEE Compliance",
  "Socio-Economic Development (SED)",
  "Enterprise & Supplier Development (ESD)",
  "Skills Development",
  "Employment Equity",
  "Community Investment",
  "Environmental Sustainability",
  OTHER,
];

// South African provinces and a representative set of cities/towns per province.
export const SA_PROVINCES_CITIES: Record<string, string[]> = {
  "Eastern Cape": ["Gqeberha (Port Elizabeth)", "East London", "Mthatha", "Queenstown", "Uitenhage"],
  "Free State": ["Bloemfontein", "Welkom", "Bethlehem", "Sasolburg", "Kroonstad"],
  "Gauteng": ["Johannesburg", "Pretoria", "Soweto", "Sandton", "Benoni", "Vereeniging"],
  "KwaZulu-Natal": ["Durban", "Pietermaritzburg", "Newcastle", "Richards Bay", "Ladysmith"],
  "Limpopo": ["Polokwane", "Tzaneen", "Thohoyandou", "Mokopane", "Musina"],
  "Mpumalanga": ["Mbombela (Nelspruit)", "Witbank (eMalahleni)", "Secunda", "Standerton", "Barberton"],
  "North West": ["Mahikeng", "Rustenburg", "Potchefstroom", "Klerksdorp", "Brits"],
  "Northern Cape": ["Kimberley", "Upington", "Springbok", "De Aar", "Kuruman"],
  "Western Cape": ["Cape Town", "Stellenbosch", "George", "Paarl", "Worcester", "Mossel Bay"],
};

export const SA_PROVINCES = Object.keys(SA_PROVINCES_CITIES);

/** Label used for records whose province can't be determined from the string. */
export const PROVINCE_OTHER = "Other / Unspecified";

/**
 * Extracts the SA province from a stored location string. Locations are stored
 * as "City, Province" (see composeLocation), so the province is normally the
 * last comma-separated segment. We also scan all segments as a fallback for
 * free-text values like "Soweto, Gauteng, SA" or just "Gauteng". Returns null
 * when no known province is present (e.g. a bare "Johannesburg").
 */
export function parseProvince(location: string | null | undefined): string | null {
  if (!location) return null;
  const segments = location.split(",").map((s) => s.trim()).filter(Boolean);
  // Prefer an exact (case-insensitive) match on any segment.
  for (const seg of segments) {
    const hit = SA_PROVINCES.find((p) => p.toLowerCase() === seg.toLowerCase());
    if (hit) return hit;
  }
  // Fallback: a known province name appearing anywhere in the string.
  const lower = location.toLowerCase();
  const loose = SA_PROVINCES.find((p) => lower.includes(p.toLowerCase()));
  return loose ?? null;
}

/**
 * Splits a stored "City, Province" location back into its parts so an editable
 * form can pre-select them. City is the leading segment; province is matched
 * against the known SA provinces. Either part may be empty.
 */
export function parseLocation(location: string | null | undefined): { province: string; city: string } {
  if (!location) return { province: "", city: "" };
  const province = parseProvince(location) ?? "";
  const segments = location.split(",").map((s) => s.trim()).filter(Boolean);
  // City = first segment that isn't the province.
  const city = segments.find((s) => s.toLowerCase() !== province.toLowerCase()) ?? "";
  return { province, city };
}
