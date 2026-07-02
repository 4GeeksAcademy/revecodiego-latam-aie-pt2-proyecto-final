// src/utils/validations.ts
//
// Validaciones de negocio para Candidate y Vacancy. Cada validador
// revisa TODAS las reglas (no corta en el primer error) y acumula
// los mensajes en un array, para que quien use la función vea de una
// vez todo lo que está mal, en vez de corregir un error a la vez.

import type { Candidate, Vacancy, ValidationResult } from "../types/models";

/**
 * Validación básica de formato de email: exige un "@", al menos un "."
 * después del "@", y contenido no vacío antes/entre/después de esos
 * caracteres. No es de nivel producción (no cubre todos los casos RFC),
 * pero cumple con el criterio pedido: "contiene @ y . en posiciones
 * correctas".
 */
export function isValidEmail(email: string): boolean {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
}

/**
 * Valida las reglas de negocio de un candidato:
 * - yearsOfExperience entre 0 y 50
 * - currentSalary y expectedSalary > 0
 * - skills con al menos 1 elemento
 * - email con formato válido
 * - phone no vacío
 */
export function validateCandidate(candidate: Candidate): ValidationResult {
  const errors: string[] = [];

  if (candidate.yearsOfExperience < 0 || candidate.yearsOfExperience > 50) {
    errors.push("yearsOfExperience debe estar entre 0 y 50");
  }

  if (candidate.currentSalary <= 0) {
    errors.push("currentSalary debe ser mayor a 0");
  }

  if (candidate.expectedSalary <= 0) {
    errors.push("expectedSalary debe ser mayor a 0");
  }

  if (candidate.skills.length < 1) {
    errors.push("skills debe contener al menos 1 habilidad");
  }

  if (!isValidEmail(candidate.email)) {
    errors.push("email no tiene un formato válido");
  }

  if (candidate.phone.trim().length === 0) {
    errors.push("phone no debe estar vacío");
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Valida las reglas de negocio de una vacante:
 * - requiredSkills con al menos 1 elemento
 * - minYearsExperience >= 0
 * - maxYearsExperience >= minYearsExperience
 * - salaryRangeMax >= salaryRangeMin
 * - ambos valores de salario > 0
 */
export function validateVacancy(vacancy: Vacancy): ValidationResult {
  const errors: string[] = [];

  if (vacancy.requiredSkills.length < 1) {
    errors.push("requiredSkills debe contener al menos 1 habilidad");
  }

  if (vacancy.minYearsExperience < 0) {
    errors.push("minYearsExperience debe ser mayor o igual a 0");
  }

  if (vacancy.maxYearsExperience < vacancy.minYearsExperience) {
    errors.push(
      "maxYearsExperience debe ser mayor o igual a minYearsExperience"
    );
  }

  if (vacancy.salaryRangeMin <= 0) {
    errors.push("salaryRangeMin debe ser mayor a 0");
  }

  if (vacancy.salaryRangeMax <= 0) {
    errors.push("salaryRangeMax debe ser mayor a 0");
  }

  if (vacancy.salaryRangeMax < vacancy.salaryRangeMin) {
    errors.push("salaryRangeMax debe ser mayor o igual a salaryRangeMin");
  }

  return { valid: errors.length === 0, errors };
}
