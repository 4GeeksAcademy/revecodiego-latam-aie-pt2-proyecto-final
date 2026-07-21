// src/utils/transformations.ts
//
// Scoring de candidatos contra vacantes, ranking, agrupamiento y
// reportes agregados (conteos, promedios, top-N).

import type {
  Candidate,
  Vacancy,
  SelectionProcess,
  SeniorityLevel,
  EnglishLevel,
  CandidateStatus,
  ScoredCandidate,
  SkillFrequency,
} from "../types/models";

const SENIORITY_ORDER: SeniorityLevel[] = [
  "Junior",
  "Semi-Senior",
  "Senior",
  "Lead",
  "Executive",
];

const ENGLISH_ORDER: EnglishLevel[] = [
  "A1",
  "A2",
  "B1",
  "B2",
  "C1",
  "C2",
  "Native",
];

function calculateSkillMatchRatio(
  candidateSkills: string[],
  requiredSkills: string[]
): number {
  if (requiredSkills.length === 0) return 1;

  const normalizedCandidateSkills = candidateSkills.map((s) => s.toLowerCase());
  const normalizedRequired = requiredSkills.map((s) => s.toLowerCase());

  const matchedCount = normalizedRequired.filter((skill) =>
    normalizedCandidateSkills.includes(skill)
  ).length;

  return matchedCount / normalizedRequired.length;
}

export function calculateCandidateScore(
  candidate: Candidate,
  vacancy: Vacancy
): number {
  const matchRatio = calculateSkillMatchRatio(
    candidate.skills,
    vacancy.requiredSkills
  );

  let skillsScore = 0;
  if (matchRatio === 1) {
    skillsScore = 40;
  } else if (matchRatio >= 0.5) {
    skillsScore = 20;
  }

  const normalizedCandidateSkills = candidate.skills.map((s) => s.toLowerCase());
  const preferredSkillsMatched = vacancy.preferredSkills.filter((skill) =>
    normalizedCandidateSkills.includes(skill.toLowerCase())
  ).length;
  const preferredBonus = Math.min(preferredSkillsMatched * 10, 20);

  skillsScore = Math.min(skillsScore + preferredBonus, 40);

  let experienceScore = 0;
  const { yearsOfExperience } = candidate;
  const { minYearsExperience, maxYearsExperience } = vacancy;

  if (
    yearsOfExperience >= minYearsExperience &&
    yearsOfExperience <= maxYearsExperience
  ) {
    experienceScore = 20;
  } else {
    const distanceOutsideRange =
      yearsOfExperience < minYearsExperience
        ? minYearsExperience - yearsOfExperience
        : yearsOfExperience - maxYearsExperience;

    if (distanceOutsideRange <= 2) {
      experienceScore = 10;
    }
  }

  const candidateSeniorityIndex = SENIORITY_ORDER.indexOf(candidate.seniority);
  const requiredSeniorityIndex = SENIORITY_ORDER.indexOf(
    vacancy.requiredSeniority
  );
  const seniorityDistance = Math.abs(
    candidateSeniorityIndex - requiredSeniorityIndex
  );

  let seniorityScore = 0;
  if (seniorityDistance === 0) {
    seniorityScore = 15;
  } else if (seniorityDistance === 1) {
    seniorityScore = 7;
  }

  const candidateEnglishIndex = ENGLISH_ORDER.indexOf(candidate.englishLevel);
  const requiredEnglishIndex = ENGLISH_ORDER.indexOf(
    vacancy.requiredEnglishLevel
  );
  const englishScore = candidateEnglishIndex >= requiredEnglishIndex ? 15 : 0;

  let salaryScore = 0;
  const { expectedSalary } = candidate;
  const { salaryRangeMin, salaryRangeMax } = vacancy;

  if (expectedSalary >= salaryRangeMin && expectedSalary <= salaryRangeMax) {
    salaryScore = 10;
  } else {
    const maxAcceptable = salaryRangeMax * 1.2;
    salaryScore = expectedSalary <= maxAcceptable ? 5 : 0;
  }

  return skillsScore + experienceScore + seniorityScore + englishScore + salaryScore;
}

export function rankCandidatesForVacancy(
  candidates: Candidate[],
  vacancy: Vacancy
): ScoredCandidate[] {
  const scored: ScoredCandidate[] = candidates.map((candidate) => ({
    candidate,
    score: calculateCandidateScore(candidate, vacancy),
  }));

  return scored.sort((a, b) => b.score - a.score);
}

export function groupCandidatesBySeniority(
  candidates: Candidate[]
): Record<SeniorityLevel, Candidate[]> {
  const groups: Record<SeniorityLevel, Candidate[]> = {
    Junior: [],
    "Semi-Senior": [],
    Senior: [],
    Lead: [],
    Executive: [],
  };

  for (const candidate of candidates) {
    groups[candidate.seniority].push(candidate);
  }

  return groups;
}

export function countCandidatesByStatus(
  candidates: Candidate[]
): Record<CandidateStatus, number> {
  const counts: Record<CandidateStatus, number> = {
    Active: 0,
    "In process": 0,
    Hired: 0,
    Inactive: 0,
  };

  for (const candidate of candidates) {
    counts[candidate.status] += 1;
  }

  return counts;
}

export function calculateAverageSalary(candidates: Candidate[]): number {
  if (candidates.length === 0) return 0;

  const total = candidates.reduce(
    (sum, candidate) => sum + candidate.expectedSalary,
    0
  );

  return Math.round((total / candidates.length) * 100) / 100;
}

export function findTopSkills(
  candidates: Candidate[],
  topN: number
): SkillFrequency[] {
  const skillCounts = new Map<string, number>();

  for (const candidate of candidates) {
    for (const skill of candidate.skills) {
      skillCounts.set(skill, (skillCounts.get(skill) ?? 0) + 1);
    }
  }

  const frequencies: SkillFrequency[] = Array.from(
    skillCounts.entries()
  ).map(([skill, count]) => ({ skill, count }));

  frequencies.sort((a, b) => b.count - a.count);

  return frequencies.slice(0, topN);
}

export function calculateVacancyFillRate(
  processes: SelectionProcess[]
): number {
  if (processes.length === 0) return 0;

  const hiredCount = processes.filter(
    (process) => process.stage === "Hired"
  ).length;

  return Math.round((hiredCount / processes.length) * 100 * 100) / 100;
}
