import type { IssueCategory } from "@/shared/constants/governance";

export interface DepartmentRoute {
  category: IssueCategory;
  department: string;
  secondary?: string;
}

/** Configurable department routing — not hard-coded in UI */
export const DEPARTMENT_ROUTES: DepartmentRoute[] = [
  { category: "Water", department: "Water/Panchayat", secondary: "Mission Bhagiratha" },
  { category: "Roads", department: "Panchayat/R&B" },
  { category: "Sanitation", department: "Panchayat" },
  { category: "Electricity", department: "Electricity Department" },
  { category: "Welfare", department: "Welfare Department" },
  { category: "Agriculture", department: "Agriculture Department" },
  { category: "Other", department: "Panchayat" },
];

export function getDepartmentForCategory(category: string): string {
  const route = DEPARTMENT_ROUTES.find(
    (r) => r.category.toLowerCase() === category.toLowerCase()
  );
  return route?.department ?? "Panchayat";
}

export function getDepartmentRoute(category: string): DepartmentRoute | undefined {
  return DEPARTMENT_ROUTES.find(
    (r) => r.category.toLowerCase() === category.toLowerCase()
  );
}
