// src/demo.ts
//
// Script de prueba manual. Corre con: npx tsx src/demo.ts
// Usa los datos de ejemplo del CONTEXT-Nexova.md para ejercitar cada
// función y mostrar el resultado por consola. No es un test automatizado
// (no hay asserts), es una forma rápida de "ver" que la lógica funciona.

import type { Candidate, Vacancy, SelectionProcess } from "./types/models";
import {
  filterCandidatesBySkills,
  filterCandidatesBySeniority,
  filterCandidatesByAvailability,
  sortCandidatesBySalary,
  sortCandidatesByExperience,
} from "./utils/collections";
import {
  findCandidateById,
  findCandidateByEmail,
  binarySearchCandidateBySalary,
} from "./utils/search";
import {
  calculateCandidateScore,
  rankCandidatesForVacancy,
  groupCandidatesBySeniority,
  countCandidatesByStatus,
  calculateAverageSalary,
  findTopSkills,
  calculateVacancyFillRate,
} from "./utils/transformations";
import { validateCandidate, validateVacancy, isValidEmail } from "./utils/validations";

const sampleCandidates: Candidate[] = [
  {
    id: "C-2024-0451",
    fullName: "María González",
    email: "maria.gonzalez@email.com",
    phone: "+56912345678",
    yearsOfExperience: 5,
    skills: ["TypeScript", "React", "Node.js", "PostgreSQL"],
    englishLevel: "B2",
    seniority: "Semi-Senior",
    currentSalary: 3500,
    expectedSalary: 4200,
    availability: "1 month",
    location: "Valencia, España",
    remoteOnly: false,
    status: "Active",
  },
  {
    id: "C-2024-0452",
    fullName: "Juan Pérez",
    email: "juan.perez@email.com",
    phone: "+56987654321",
    yearsOfExperience: 3,
    skills: ["JavaScript", "React", "CSS", "HTML"],
    englishLevel: "B1",
    seniority: "Junior",
    currentSalary: 2200,
    expectedSalary: 2800,
    availability: "Immediate",
    location: "Miami, Florida, Estados Unidos",
    remoteOnly: true,
    status: "Active",
  },
  {
    id: "C-2024-0453",
    fullName: "Carolina Silva",
    email: "carolina.silva@email.com",
    phone: "+56911223344",
    yearsOfExperience: 8,
    skills: ["TypeScript", "Node.js", "PostgreSQL", "Docker", "AWS"],
    englishLevel: "C1",
    seniority: "Senior",
    currentSalary: 5500,
    expectedSalary: 6500,
    availability: "2 weeks",
    location: "Valencia, España",
    remoteOnly: false,
    status: "Active",
  },
];

const sampleVacancy: Vacancy = {
  id: "V-2024-0892",
  title: "Senior Full-Stack Developer",
  companyName: "TechCorp Solutions",
  requiredSkills: ["TypeScript", "React", "Node.js"],
  preferredSkills: ["PostgreSQL", "Docker"],
  minYearsExperience: 4,
  maxYearsExperience: 8,
  requiredEnglishLevel: "B2",
  requiredSeniority: "Senior",
  salaryRangeMin: 5000,
  salaryRangeMax: 7000,
  isRemote: true,
  location: "Remote",
  status: "Open",
};

const sampleProcesses: SelectionProcess[] = [
  {
    id: "SP-2024-1523",
    candidateId: "C-2024-0451",
    vacancyId: "V-2024-0892",
    stage: "Interview",
    score: 72,
    notes: "Buen fit técnico, falta validar disponibilidad",
    createdAt: new Date("2024-05-01"),
    updatedAt: new Date("2024-05-10"),
  },
  {
    id: "SP-2024-1524",
    candidateId: "C-2024-0453",
    vacancyId: "V-2024-0892",
    stage: "Hired",
    score: 91,
    notes: "Oferta aceptada",
    createdAt: new Date("2024-05-02"),
    updatedAt: new Date("2024-05-20"),
  },
  {
    id: "SP-2024-1525",
    candidateId: "C-2024-0452",
    vacancyId: "V-2024-0892",
    stage: "Rejected",
    score: 40,
    notes: "No cumple experiencia mínima",
    createdAt: new Date("2024-05-03"),
    updatedAt: new Date("2024-05-08"),
  },
];

function section(title: string): void {
  console.log(`\n=== ${title} ===`);
}

section("filterCandidatesBySkills(['typescript', 'react'])");
console.log(
  filterCandidatesBySkills(sampleCandidates, ["typescript", "react"]).map(
    (c) => c.fullName
  )
);

section("filterCandidatesBySeniority('Senior')");
console.log(
  filterCandidatesBySeniority(sampleCandidates, "Senior").map((c) => c.fullName)
);

section("filterCandidatesByAvailability(['Immediate', '2 weeks'])");
console.log(
  filterCandidatesByAvailability(sampleCandidates, ["Immediate", "2 weeks"]).map(
    (c) => c.fullName
  )
);

section("sortCandidatesBySalary('asc')");
console.log(
  sortCandidatesBySalary(sampleCandidates, "asc").map(
    (c) => `${c.fullName}: $${c.expectedSalary}`
  )
);

section("sortCandidatesByExperience('desc')");
console.log(
  sortCandidatesByExperience(sampleCandidates, "desc").map(
    (c) => `${c.fullName}: ${c.yearsOfExperience} años`
  )
);

section("findCandidateById('C-2024-0452')");
console.log(findCandidateById(sampleCandidates, "C-2024-0452")?.fullName);

section("findCandidateByEmail('MARIA.GONZALEZ@EMAIL.COM')");
console.log(
  findCandidateByEmail(sampleCandidates, "MARIA.GONZALEZ@EMAIL.COM")?.fullName
);

section("binarySearchCandidateBySalary (sobre array ordenado asc)");
const sortedBySalary = sortCandidatesBySalary(sampleCandidates, "asc");
console.log(
  "índice de salario 4200:",
  binarySearchCandidateBySalary(sortedBySalary, 4200)
);
console.log(
  "índice de salario 9999 (no existe):",
  binarySearchCandidateBySalary(sortedBySalary, 9999)
);

section("calculateCandidateScore por candidato vs sampleVacancy");
for (const candidate of sampleCandidates) {
  console.log(`${candidate.fullName}: ${calculateCandidateScore(candidate, sampleVacancy)} pts`);
}

section("rankCandidatesForVacancy");
console.log(
  rankCandidatesForVacancy(sampleCandidates, sampleVacancy).map(
    (r) => `${r.candidate.fullName}: ${r.score} pts`
  )
);

section("groupCandidatesBySeniority");
console.log(groupCandidatesBySeniority(sampleCandidates));

section("countCandidatesByStatus");
console.log(countCandidatesByStatus(sampleCandidates));

section("calculateAverageSalary");
console.log(calculateAverageSalary(sampleCandidates));

section("findTopSkills(2)");
console.log(findTopSkills(sampleCandidates, 2));

section("calculateVacancyFillRate");
console.log(`${calculateVacancyFillRate(sampleProcesses)}%`);

section("isValidEmail");
console.log("maria.gonzalez@email.com ->", isValidEmail("maria.gonzalez@email.com"));
console.log("no-valido@@sin-punto ->", isValidEmail("no-valido@@sin-punto"));

section("validateCandidate (candidato inválido de prueba)");
console.log(
  validateCandidate({
    ...sampleCandidates[0],
    yearsOfExperience: -1,
    skills: [],
    phone: "",
  })
);

section("validateVacancy (vacante inválida de prueba)");
console.log(
  validateVacancy({
    ...sampleVacancy,
    maxYearsExperience: 1,
    salaryRangeMax: 100,
  })
);
