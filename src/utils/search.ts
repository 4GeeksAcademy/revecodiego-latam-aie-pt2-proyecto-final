// src/utils/search.ts
//
// Búsqueda LINEAL (recorre elemento por elemento, O(n), funciona en
// cualquier array) vs. búsqueda BINARIA (requiere array ya ordenado
// por el campo buscado, descarta la mitad de opciones en cada paso,
// O(log n)).

import type { Candidate } from "../types/models";

export function findCandidateById(
  candidates: Candidate[],
  id: string
): Candidate | null {
  for (const candidate of candidates) {
    if (candidate.id === id) {
      return candidate;
    }
  }
  return null;
}

export function findCandidateByEmail(
  candidates: Candidate[],
  email: string
): Candidate | null {
  const normalizedEmail = email.toLowerCase();

  for (const candidate of candidates) {
    if (candidate.email.toLowerCase() === normalizedEmail) {
      return candidate;
    }
  }
  return null;
}

export function binarySearchCandidateBySalary(
  sortedCandidates: Candidate[],
  targetSalary: number
): number {
  let low = 0;
  let high = sortedCandidates.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const midSalary = sortedCandidates[mid].expectedSalary;

    if (midSalary === targetSalary) {
      return mid;
    }

    if (midSalary < targetSalary) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return -1;
}
