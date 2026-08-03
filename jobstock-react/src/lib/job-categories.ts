export const JOB_CATEGORIES = [
  "IT & Software",
  "BPO/ITES",
  "Sales & BD",
  "Freshers & Internships",
  "Healthcare",
  "Engineering & Core",
  "Design & Creative",
  "Blue Collar & Local",
] as const;

export const CATEGORY_ICONS: Record<string, string> = {
  "IT & Software": "fa-solid fa-laptop-code",
  "BPO/ITES": "fa-solid fa-headset",
  "Sales & BD": "fa-solid fa-chart-line",
  "Freshers & Internships": "fa-solid fa-user-graduate",
  "Healthcare": "fa-solid fa-briefcase-medical",
  "Engineering & Core": "fa-solid fa-gears",
  "Design & Creative": "fa-solid fa-pen-ruler",
  "Blue Collar & Local": "fa-solid fa-helmet-safety",
};
