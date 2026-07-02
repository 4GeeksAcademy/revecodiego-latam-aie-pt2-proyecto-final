// src/utils/transformations.ts
//
// Scoring de candidatos contra vacantes, ranking, agrupamiento y
// reportes agregados (conteos, promedios, top-N). Estas son las
// funciones que alimentarán el motor de matching de Nexova.

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

// Orden de niveles, del más junior al más senior / del más básico al
// más avanzado. El ÍNDICE en este array es lo que nos permite comparar
// "un nivel arriba", "un nivel abajo", o "cumple o excede", sin tener
// que escribir un enorme if/else con todas las combinaciones posibles.
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

/**
 * Calcula qué porcentaje de `requiredSkills` tiene el candidato,
 * comparando en minúsculas para que el matching sea case-insensitive.
 */
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

/**
 * Puntúa un candidato contra una vacante (0-100), sumando 5 categorías:
 * habilidades (40), experiencia (20), seniority (15), inglés (15) y
 * salario (10). 40+20+15+15+10 = 100, así que el máximo teórico es 100.
 */
export function calculateCandidateScore(
  candidate: Candidate,
  vacancy: Vacancy
): number {
  // --- 1. Habilidades (máx 40) ---
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

  // El enunciado fija el techo de esta categoría en 40 puntos, así que
  // el bonus de preferidas no puede hacer que se pase de ese límite.
  skillsScore = Math.min(skillsScore + preferredBonus, 40);

  // --- 2. Experiencia (máx 20) ---
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

  // --- 3. Seniority (máx 15) ---
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

  // --- 4. Inglés (máx 15) ---
  const candidateEnglishIndex = ENGLISH_ORDER.indexOf(candidate.englishLevel);
  const requiredEnglishIndex = ENGLISH_ORDER.indexOf(
    vacancy.requiredEnglishLevel
  );
  const englishScore = candidateEnglishIndex >= requiredEnglishIndex ? 15 : 0;

  // --- 5. Salario (máx 10) ---
  // Nota/asunción: si el salario esperado del candidato está POR DEBAJO
  // del mínimo de la vacante, igual se considera "dentro del presupuesto"
  // y otorga el puntaje completo (no perjudica a Nexova que el candidato
  // pida menos de lo presupuestado).
  let salaryScore = 0;
  const { expectedSalary } = candidate;
  const { salaryRangeMin, salaryRangeMax } = vacancy;

  if (expectedSalary <= salaryRangeMax) {
    // Dentro del rango, o por debajo del mínimo (más barato de lo
    // presupuestado): en ambos casos el puntaje completo aplica.
    salaryScore = 10;
  } else {
    const maxAcceptable = salaryRangeMax * 1.2;
    salaryScore = expectedSalary <= maxAcceptable ? 5 : 0;
  }

  return skillsScore + experienceScore + seniorityScore + englishScore + salaryScore;
}

/**
 * Puntúa a todos los candidatos contra una vacante y los retorna
 * ordenados de mayor a menor puntaje. No muta el array recibido.
 */
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

/**
 * Agrupa candidatos por nivel de seniority. Siempre incluye las 5 llaves
 * posibles (aunque estén vacías), porque el tipo de retorno es
 * `Record<SeniorityLevel, Candidate[]>`: TypeScript exige que las 5
 * llaves existan.
 */
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

/**
 * Cuenta cuántos candidatos hay en cada estado (`CandidateStatus`).
 * Igual que en groupCandidatesBySeniority, inicializamos las 4 llaves
 * en 0 para que el objeto siempre tenga la forma completa.
 */
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

/**
 * Calcula el salario esperado promedio, redondeado a 2 decimales.
 * Retorna 0 si el array está vacío (evita dividir por 0).
 */
export function calculateAverageSalary(candidates: Candidate[]): number {
  if (candidates.length === 0) return 0;

  const total = candidates.reduce(
    (sum, candidate) => sum + candidate.expectedSalary,
    0
  );

  return Math.round((total / candidates.length) * 100) / 100;
}

/**
 * Encuentra las `topN` habilidades más frecuentes entre todos los
 * candidatos, ordenadas de mayor a menor frecuencia.
 */
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

/**
 * Calcula el porcentaje de procesos de selección que terminaron en
 * estado "Hired". Retorna 0 si no hay procesos (evita dividir por 0).
 */
export function calculateVacancyFillRate(
  processes: SelectionProcess[]
): number {
  if (processes.length === 0) return 0;

  const hiredCount = processes.filter(
    (process) => process.stage === "Hired"
  ).length;

  return Math.round((hiredCount / processes.length) * 100 * 100) / 100;
}
