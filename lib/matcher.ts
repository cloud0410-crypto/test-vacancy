export type MatchResult = {
  score: number;
  verdict: string;
  matchedSkills: string[];
  missingSkills: string[];
  strengths: string[];
  improvements: string[];
  breakdown: { label: string; score: number; weight: number }[];
};

const SKILL_GROUPS: Record<string, string[]> = {
  "Product strategy": ["product strategy", "product vision", "roadmap", "prioritization", "prioritisation", "north star", "product-led"],
  "Discovery & research": ["user research", "customer research", "discovery", "customer interviews", "usability", "jobs to be done", "jtbd"],
  "Analytics & experimentation": ["sql", "analytics", "experimentation", "a/b testing", "ab testing", "metrics", "kpi", "north star metric", "funnels"],
  "Execution & delivery": ["agile", "scrum", "backlog", "sprint", "stakeholder management", "cross-functional", "cross functional", "launch", "go-to-market", "gtm"],
  "Technical fluency": ["api", "platform", " saas", "cloud", "ai", "machine learning", "technical", "architecture", "integration"],
  "Business impact": ["revenue", "growth", "retention", "monetization", "monetisation", "pricing", "p&l", "business case", "market analysis"]
};

const clean = (s: string) => s.toLowerCase().replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ");

function contains(text: string, term: string) {
  return clean(text).includes(term.toLowerCase());
}

export function analyzeResume(resume: string, jd: string): MatchResult {
  const r = clean(resume);
  const j = clean(jd);
  const entries = Object.entries(SKILL_GROUPS);
  const matched: string[] = [];
  const missing: string[] = [];
  const breakdown = entries.map(([group, terms]) => {
    const relevant = terms.filter((t) => contains(j, t));
    const hits = relevant.filter((t) => contains(r, t));
    if (hits.length) matched.push(group);
    if (relevant.length && hits.length < Math.max(1, Math.ceil(relevant.length * 0.35))) missing.push(group);
    const score = relevant.length ? Math.round((hits.length / relevant.length) * 100) : (hits.length ? 100 : 65);
    return { label: group, score, weight: group === "Product strategy" || group === "Business impact" ? 22 : 14 };
  });
  const weighted = breakdown.reduce((sum, x) => sum + x.score * x.weight, 0) / breakdown.reduce((sum, x) => sum + x.weight, 0);
  const evidenceTerms = ["launched", "increased", "improved", "reduced", "grew", "delivered", "%", "revenue", "users", "conversion"];
  const evidenceHits = evidenceTerms.filter((t) => contains(r, t)).length;
  const evidenceScore = Math.min(100, evidenceHits * 12);
  const score = Math.max(18, Math.min(97, Math.round(weighted * 0.82 + evidenceScore * 0.18)));
  const strengths = [
    matched.length ? `Your resume contains evidence related to ${matched.slice(0, 3).join(", ")}.` : "Add clearer evidence of product-management capabilities.",
    evidenceHits >= 3 ? "Your resume includes outcome-oriented language and measurable impact." : "Make business outcomes more measurable with metrics, baselines and results."
  ];
  const improvements = [
    ...missing.slice(0, 3).map((x) => `Strengthen evidence for ${x.toLowerCase()} using a specific example from your experience.`),
    "Mirror the job description's terminology naturally where it accurately reflects your experience.",
    "Rewrite responsibility-led bullets as action + scope + measurable outcome."
  ];
  return {
    score,
    verdict: score >= 80 ? "Strong alignment" : score >= 65 ? "Promising alignment" : score >= 45 ? "Partial alignment" : "Low alignment",
    matchedSkills: matched,
    missingSkills: missing,
    strengths,
    improvements: improvements.slice(0, 5),
    breakdown
  };
}
