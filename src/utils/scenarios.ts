import type { TaxInputs } from '../types/tax';
import { calculateTaxes } from './TaxCalc';

export function scenarioInputs(
  baseline: TaxInputs,
  salary: number,
  extraPension: number,
): TaxInputs {
  const p = baseline.pensionEnabled
    ? baseline.pensionContributions
    : { personal: 0, salarySacrifice: 0, autoEnrolment: 0, autoEnrolmentEmployer: 0 };
  return {
    ...baseline,
    annualGrossSalary: salary,
    pensionEnabled: extraPension > 0 || baseline.pensionEnabled,
    salarySacrificeIsPercentage: false,
    pensionContributions: {
      ...p,
      salarySacrifice: baseline.selfEmployed
        ? 0
        : (baseline.salarySacrificeIsPercentage
            ? ((salary + baseline.annualGrossBonus) * p.salarySacrifice) / 100
            : p.salarySacrifice) + extraPension,
      personal: p.personal + (baseline.selfEmployed ? extraPension : 0),
    },
  };
}

// Find a salary that meets an annual cash target. This is an estimate within a
// bounded range, not a claim of a globally minimal salary at stepped tax cliffs.
export function salaryForTarget(
  baseline: TaxInputs,
  annualTarget: number,
  extraPension = 0,
): number | null {
  if (!Number.isFinite(annualTarget) || annualTarget < 0) return null;
  const cash = (salary: number) =>
    calculateTaxes(scenarioInputs(baseline, salary, extraPension)).takeHomePay;
  let low = 0,
    high = 1000000;
  if (cash(low) >= annualTarget) return 0;
  if (cash(high) < annualTarget) return null;
  for (let i = 0; i < 60; i++) {
    const middle = (low + high) / 2;
    if (cash(middle) >= annualTarget) high = middle;
    else low = middle;
  }
  let salary = Math.ceil(high * 100) / 100;
  // Rounding up can cross a stepped Child Benefit charge; find a funded value.
  for (let i = 0; i < 1000 && salary <= 1000000; i++, salary += 1) {
    if (cash(salary) >= annualTarget) return salary;
  }
  return null;
}
