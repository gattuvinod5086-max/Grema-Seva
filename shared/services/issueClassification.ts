import type { IssueCategory, IssuePriority } from "@shared/constants/governance";
import { getDepartmentForCategory } from "@shared/services/departmentRouting";

export interface ClassificationResult {
  category: IssueCategory;
  priority: IssuePriority;
  suggestedDepartment: string;
  confidence: number;
  isMock: true;
}

type Rule = {
  keywords: string[];
  category: IssueCategory;
  priority: IssuePriority;
  weight: number;
};

const RULES: Rule[] = [
  { keywords: ["water", "tap", "drinking", "bhagiratha", "నీరు", "తాగునీరు", "నీటి"], category: "Water", priority: "HIGH", weight: 1 },
  { keywords: ["road", "pothole", "street", "drainage", "రోడ్", "వీధి", "దారి"], category: "Roads", priority: "MEDIUM", weight: 1 },
  { keywords: ["garbage", "sanitation", "toilet", "drain", "చెత్త", "శుభ్రత"], category: "Sanitation", priority: "MEDIUM", weight: 1 },
  { keywords: ["electric", "power", "light", "transformer", "current", "విద్యుత్", "కరెంట్", "లైట్"], category: "Electricity", priority: "MEDIUM", weight: 1 },
  { keywords: ["pension", "aasara", "welfare", "scheme", "ration", "పెన్షన్", "ఆసర"], category: "Welfare", priority: "LOW", weight: 1 },
  { keywords: ["crop", "farm", "rythu", "agriculture", "pest", "పంట", "రైతు"], category: "Agriculture", priority: "MEDIUM", weight: 1 },
  { keywords: ["urgent", "emergency", "danger", "critical", "అత్యవసర"], category: "Other", priority: "CRITICAL", weight: 0.8 },
  { keywords: ["no water", "leak", "broken pipe", "రావడం లేదు"], category: "Water", priority: "HIGH", weight: 1.2 },
];

/**
 * Keyword-based classification for local/demo mode.
 * Replace with real AI provider via same interface when configured.
 */
export function classifyIssue(description: string): ClassificationResult {
  const text = description.toLowerCase().trim();
  let best: { category: IssueCategory; priority: IssuePriority; score: number } | null = null;

  for (const rule of RULES) {
    const hits = rule.keywords.filter((k) => text.includes(k.toLowerCase())).length;
    if (hits === 0) continue;
    const score = hits * rule.weight;
    if (!best || score > best.score) {
      best = { category: rule.category, priority: rule.priority, score };
    }
  }

  const category = best?.category ?? "Other";
  const priority = best?.priority ?? "MEDIUM";
  const confidence = best ? Math.min(98, 60 + Math.round(best.score * 15)) : 45;

  return {
    category,
    priority,
    suggestedDepartment: getDepartmentForCategory(category),
    confidence,
    isMock: true,
  };
}
