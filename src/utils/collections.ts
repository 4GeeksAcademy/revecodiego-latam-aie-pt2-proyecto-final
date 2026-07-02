// src/utils/collections.ts
//
// Funciones para filtrar y ordenar colecciones de candidatos.
// Todas son funciones puras: reciben un array, devuelven uno nuevo,
// y NUNCA modifican (mutan) el array original. Esto es clave porque
// en un sistema real, otros módulos podrían seguir usando el array
// original después de llamar a estas funciones — si lo mutáramos,
// romperíamos ese código sin avisar.

import type {
  Candidate,
  SeniorityLevel,
  AvailabilityStatus,
} from "../types/models";

/**
 * Retorna los candidatos que tienen TODAS las habilidades requeridas.
 * El matching es case-insensitive (p. ej. "typescript" === "TypeScript").
 */
export function filterCandidatesBySkills(
  candidates: Candidate[],
  requiredSkills: string[]
): Candidate[] {
  const normalizedRequired = requiredSkills.map((skill) => skill.toLowerCase());

  return candidates.filter((candidate) => {
    const candidateSkills = candidate.skills.map((skill) => skill.toLowerCase());
    return normalizedRequired.every((required) =>
      candidateSkills.includes(required)
    );
  });
}

/**
 * Retorna los candidatos con el nivel de seniority especificado.
 */
export function filterCandidatesBySeniority(
  candidates: Candidate[],
  seniority: SeniorityLevel
): Candidate[] {
  return candidates.filter((candidate) => candidate.seniority === seniority);
}

/**
 * Retorna los candidatos cuya disponibilidad coincide con cualquiera
 * de los estados proporcionados.
 */
export function filterCandidatesByAvailability(
  candidates: Candidate[],
  availability: AvailabilityStatus[]
): Candidate[] {
  return candidates.filter((candidate) =>
    availability.includes(candidate.availability)
  );
}

/**
 * Retorna una copia de los candidatos ordenados por salario esperado.
 * No muta el array original: se copia con el spread operator (`[...array]`)
 * antes de ordenar, porque `Array.prototype.sort` ordena "in place".
 */
export function sortCandidatesBySalary(
  candidates: Candidate[],
  order: "asc" | "desc"
): Candidate[] {
  const sorted = [...candidates];
  sorted.sort((a, b) =>
    order === "asc"
      ? a.expectedSalary - b.expectedSalary
      : b.expectedSalary - a.expectedSalary
  );
  return sorted;
}

/**
 * Retorna una copia de los candidatos ordenados por años de experiencia.
 * No muta el array original.
 */
export function sortCandidatesByExperience(
  candidates: Candidate[],
  order: "asc" | "desc"
): Candidate[] {
  const sorted = [...candidates];
  sorted.sort((a, b) =>
    order === "asc"
      ? a.yearsOfExperience - b.yearsOfExperience
      : b.yearsOfExperience - a.yearsOfExperience
  );
  return sorted;
}
