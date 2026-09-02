// Canonical technology dictionary for alias normalization
const SKILL_DICTIONARY: Record<string, string> = {
  js: 'JavaScript',
  javascript: 'JavaScript',
  ts: 'TypeScript',
  typescript: 'TypeScript',
  react: 'React',
  reactjs: 'React',
  node: 'Node.js',
  nodejs: 'Node.js',
  express: 'Express',
  expressjs: 'Express',
  mongo: 'MongoDB',
  mongodb: 'MongoDB',
  docker: 'Docker',
  k8s: 'Kubernetes',
  kubernetes: 'Kubernetes',
  aws: 'AWS',
  amazonwebservices: 'AWS',
  git: 'Git',
  github: 'Git',
  sql: 'SQL',
  postgres: 'PostgreSQL',
  postgresql: 'PostgreSQL',
  python: 'Python',
  java: 'Java',
  csharp: 'C#',
  rest: 'REST APIs',
  restapi: 'REST APIs',
  restapis: 'REST APIs',
  graphql: 'GraphQL',
  tailwind: 'Tailwind CSS',
  tailwindcss: 'Tailwind CSS',
};

export interface MatchResult {
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  totalRequirements: number;
}

// Normalize skill token (strips punctuation and maps aliases)
export const normalizeSkill = (rawSkill: string): string => {
  const cleaned = rawSkill.toLowerCase().replace(/[^a-z0-9#+]/g, '');
  return SKILL_DICTIONARY[cleaned] || rawSkill.trim();
};

// Deterministic matching pipeline
export const calculateSkillMatch = (
  userSkills: string[],
  cvRawText: string,
  requiredSkills: string[]
): MatchResult => {
  if (!requiredSkills || requiredSkills.length === 0) {
    return {
      matchScore: 100,
      matchedSkills: [],
      missingSkills: [],
      totalRequirements: 0,
    };
  }

  // Combine user profile skills with text extracted from CV
  const normalizedUserSkills = new Set<string>(
    userSkills.map((s) => normalizeSkill(s).toLowerCase())
  );
  const lowerCvText = (cvRawText || '').toLowerCase();

  const matched: string[] = [];
  const missing: string[] = [];

  requiredSkills.forEach((req) => {
    const canon = normalizeSkill(req);
    const target = canon.toLowerCase();

    // Check if skill is in user's profile array OR found directly inside CV text
    const inProfile = normalizedUserSkills.has(target);
    const inCvText = lowerCvText.includes(target);

    if (inProfile || inCvText) {
      matched.push(canon);
    } else {
      missing.push(canon);
    }
  });

  const matchScore = Math.round((matched.length / requiredSkills.length) * 100);

  return {
    matchScore,
    matchedSkills: matched,
    missingSkills: missing,
    totalRequirements: requiredSkills.length,
  };
};