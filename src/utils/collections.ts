// src/utils/collections.ts
//
// Funciones para filtrar y ordenar colecciones de candidatos.
// Todas son funciones puras: reciben un array, devuelven uno nuevo,
// y nunca modifican el array original.

import type {
  Candidate,
  SeniorityLevel,
  AvailabilityStatus,
} from "../types/models";

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

export function filterCandidatesBySeniority(
  candidates: Candidate[],
  seniority: SeniorityLevel
): Candidate[] {
  return candidates.filter((candidate) => candidate.seniority === seniority);
}

export function filterCandidatesByAvailability(
  candidates: Candidate[],
  availability: AvailabilityStatus[]
): Candidate[] {
  return candidates.filter((candidate) =>
    availability.includes(candidate.availability)
  );
}

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
