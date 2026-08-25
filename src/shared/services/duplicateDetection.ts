export interface DuplicateCandidate {
  id: number | string;
  displayRef: string;
  description: string;
  category: string;
  location?: string | null;
  estimatedAffectedCitizens?: number | null;
  similarity: number;
}

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^\w\s\u0C00-\u0C7F]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2)
  );
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let intersection = 0;
  for (const t of a) {
    if (b.has(t)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export function findDuplicateIssues(
  candidate: {
    description: string;
    category: string;
    village?: string | null;
    ward?: string | null;
    location?: string | null;
  },
  existing: Array<{
    id: number | string;
    description: string;
    category: string;
    village?: string | null;
    ward?: string | null;
    location?: string | null;
    created_at?: string;
    createdAt?: string;
    status?: string;
    estimated_affected_citizens?: number | null;
    estimatedAffectedCitizens?: number | null;
  }>,
  options?: { threshold?: number; maxAgeDays?: number; formatRef?: (id: number | string) => string }
): DuplicateCandidate[] {
  const threshold = options?.threshold ?? 0.35;
  const maxAgeDays = options?.maxAgeDays ?? 30;
  const formatRef = options?.formatRef ?? ((id) => `GS-${id}`);
  const now = Date.now();
  const candidateTokens = tokenize(candidate.description);

  return existing
    .filter((issue) => {
      if (issue.status === "Closed") return false;
      const created = issue.created_at ?? issue.createdAt;
      if (created) {
        const ageDays = (now - new Date(created).getTime()) / 86_400_000;
        if (ageDays > maxAgeDays) return false;
      }
      if (candidate.village && issue.village && candidate.village !== issue.village) return false;
      if (candidate.ward && issue.ward && candidate.ward !== issue.ward) return false;
      if (issue.category.toLowerCase() !== candidate.category.toLowerCase()) return false;
      return true;
    })
    .map((issue) => {
      const tokens = tokenize(issue.description);
      let similarity = jaccardSimilarity(candidateTokens, tokens);
      if (
        candidate.location &&
        issue.location &&
        candidate.location.toLowerCase() === issue.location.toLowerCase()
      ) {
        similarity = Math.min(1, similarity + 0.25);
      }
      return {
        id: issue.id,
        displayRef: formatRef(issue.id),
        description: issue.description,
        category: issue.category,
        location: issue.location,
        estimatedAffectedCitizens:
          issue.estimated_affected_citizens ?? issue.estimatedAffectedCitizens ?? null,
        similarity,
      };
    })
    .filter((d) => d.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity);
}
