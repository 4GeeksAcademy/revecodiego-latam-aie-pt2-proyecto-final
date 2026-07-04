// src/utils/validations.ts
//
// Validaciones de negocio para Candidate y Vacancy. Cada validador
// revisa TODAS las reglas (no corta en el primer error) y acumula
// los mensajes en un array.

import type { Candidate, Vacancy, ValidationResult } from "../types/models";

export function isValidEmail(email: string): boolean {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
}

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
