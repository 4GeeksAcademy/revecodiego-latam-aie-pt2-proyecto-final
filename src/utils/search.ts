// src/utils/search.ts
//
// Dos formas de buscar en un array, con costos muy distintos:
//
// - Búsqueda LINEAL: recorre el array elemento por elemento hasta
//   encontrar coincidencia. Funciona en cualquier array (ordenado o no).
//   Costo: O(n) — en el peor caso revisa los n elementos.
//
// - Búsqueda BINARIA: solo funciona si el array YA está ordenado por el
//   campo que buscas. En cada paso descarta la mitad de las opciones
//   restantes comparando contra el elemento del medio.
//   Costo: O(log n) — mucho más rápido en arrays grandes, pero requiere
//   que el array esté ordenado de antemano (por eso se usa junto con
//   sortCandidatesBySalary en collections.ts).

import type { Candidate } from "../types/models";

/**
 * Búsqueda LINEAL de un candidato por ID.
 * Retorna el candidato si se encuentra, null en caso contrario.
 */
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

/**
 * Búsqueda LINEAL de un candidato por email (case-insensitive).
 * Retorna el candidato si se encuentra, null en caso contrario.
 */
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

/**
 * Búsqueda BINARIA de un candidato por salario esperado.
 *
 * Precondición: `sortedCandidates` YA debe estar ordenado ascendentemente
 * por `expectedSalary` (usa `sortCandidatesBySalary(candidates, "asc")`
 * antes de llamar a esta función).
 *
 * Retorna el índice del candidato encontrado, o -1 si no existe ninguno
 * con ese salario exacto. Si hay varios candidatos con el mismo salario,
 * puede retornar cualquiera de sus índices válidos.
 */
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
      low = mid + 1; // el objetivo está en la mitad derecha
    } else {
      high = mid - 1; // el objetivo está en la mitad izquierda
    }
  }

  return -1;
}
