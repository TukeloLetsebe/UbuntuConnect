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
