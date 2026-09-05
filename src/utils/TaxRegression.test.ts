import { describe, it, expect } from 'vitest';
import { defaultInputs } from './defaultInputs';
import {
  calculateTaxes,
  calculateStudentLoanRepayments,
  calculatePeriodNI,
  grossManualPensionContributions,
} from './TaxCalc';
import { taxYears } from './TaxYears';
import { buildResultsCsv, periodDivisor } from './results';
import { calculatePayroll } from './Payroll';
import { salaryForTarget, scenarioInputs } from './scenarios';
import type { TaxInputs } from '../types/tax';
const calc = (overrides: Partial<TaxInputs> = {}) =>
  calculateTaxes({ ...defaultInputs, ...overrides });
const pension = (personal: number) => ({ ...defaultInputs.pensionContributions, personal });

describe('published 2026/27 rates', () => {
  it('calculates £45,000 standard earnings with 20% tax and 8% NI', () => {
    const r = calc();
    expect(r.incomeTax.total).toBeCloseTo(6486, 2);
    expect(r.employeeNI.total).toBeCloseTo(2594.4, 2);
    expect(r.takeHomePay).toBeCloseTo(35919.6, 2);
  });
  it('uses the new Scottish starter and basic bands', () => {
    expect(calc({ residentInScotland: true }).incomeTax.total).toBeCloseTo(6882.05, 2);
  });
  it('matches HMRC’s wages-plus-dividends example', () => {
    const r = calc({ annualGrossSalary: 29570, annualGrossDividends: 3000 });
    expect(r.incomeTax.total).toBe(3400);
    expect(r.dividendTax.total).toBe(268.75);
  });
  it('updates every student loan threshold and starts Plan 5 in April 2026', () => {
    const c = taxYears['2026/27'];
    for (const plan of ['plan1', 'plan2', 'plan4', 'plan5', 'postgrad'] as const) {
      const threshold = c.studentLoan.thresholds[plan];
      expect(calculateStudentLoanRepayments(threshold, [plan], c).total).toBe(0);
      expect(calculateStudentLoanRepayments(threshold + 1000, [plan], c).total).toBe(
        plan === 'postgrad' ? 60 : 90,
      );
    }
    for (const year of ['2023/24', '2024/25', '2025/26'])
      expect(calculateStudentLoanRepayments(50000, ['plan5'], taxYears[year]).total).toBe(0);
  });
  it('updates benefit and blind allowance amounts', () => {
    const r = calc({ blind: true, childBenefits: { mode: 'self', numberOfChildren: 2 } });
    expect(r.taxAllowance.total).toBe(15820);
    expect(r.childBenefits.total).toBeCloseTo(2337.4, 2);
  });
});

describe('pension relief is granted once, using relevant earnings', () => {
  it('adds provider relief but does not reduce a basic-rate taxpayer’s income tax', () => {
    const r = calc({ pensionEnabled: true, pensionContributions: pension(800) });
    expect(r.pensionPot.total).toBe(1000);
    expect(r.pensionReliefAtSource).toBe(200);
    expect(r.incomeTax.total).toBe(calc().incomeTax.total);
    expect(r.takeHomePay).toBeCloseTo(calc().takeHomePay - 800, 2);
  });
  it('grants only additional relief through extended tax bands at higher rates', () => {
    const r = calc({
      annualGrossSalary: 60000,
      pensionEnabled: true,
      pensionContributions: pension(800),
    });
    expect(r.incomeTax.total).toBe(11232);
    expect(r.takeHomePay).toBeCloseTo(calc({ annualGrossSalary: 60000 }).takeHomePay - 600, 2);
  });
  it('grants Scottish 22% additional relief and leaves the starter band alone', () => {
    const r = calc({
      annualGrossSalary: 60000,
      residentInScotland: true,
      pensionEnabled: true,
      pensionContributions: pension(800),
    });
    expect(
      calc({ annualGrossSalary: 60000, residentInScotland: true }).incomeTax.total -
        r.incomeTax.total,
    ).toBeCloseTo(220, 2);
    expect(
      calc({
        annualGrossSalary: 15000,
        residentInScotland: true,
        pensionEnabled: true,
        pensionContributions: pension(800),
      }).incomeTax.total,
    ).toBe(calc({ annualGrossSalary: 15000, residentInScotland: true }).incomeTax.total);
  });
  it('does not invent taxable-earnings deductions against dividends for RAS', () => {
    const r = calc({
      annualGrossSalary: 0,
      annualGrossDividends: 20000,
      pensionEnabled: true,
      pensionContributions: pension(2880),
    });
    expect(r.dividendTax.total).toBeCloseTo(744.975, 3); // (20,000 - 12,570 - 500) × 10.75% = 744.975
    expect(r.incomeTax.total).toBe(0);
    expect(r.pensionPot.total).toBe(3600);
  });
  it('allows low earners relief up to earnings and caps non-earners at £3,600 gross', () => {
    expect(grossManualPensionContributions(5000, true, 10000, 12570)).toBe(6250);
    expect(grossManualPensionContributions(5000, true, 0, 12570)).toBe(5720);
    const r = calc({
      annualGrossSalary: 0,
      pensionEnabled: true,
      pensionContributions: pension(5000),
    });
    expect(r.unrelievedPensionContributions).toBe(2120);
    expect(r.takeHomePay).toBe(-5000);
  });
  it('limits earnings relief after salary sacrifice and net-pay contributions', () => {
    const r = calc({
      annualGrossSalary: 20000,
      pensionEnabled: true,
      pensionContributions: { ...pension(8000), salarySacrifice: 15000 },
    });
    expect(r.pensionReliefAtSource).toBe(1000);
    expect(r.unrelievedPensionContributions).toBe(4000);
  });
  it('restores Personal Allowance based on ANI while extending the basic band', () => {
    const r = calc({
      annualGrossSalary: 110000,
      pensionEnabled: true,
      pensionContributions: pension(8000),
    });
    expect(r.adjustedNetIncome).toBe(100000);
    expect(r.taxAllowance.total).toBe(12570);
    expect(r.incomeTax.total).toBe(29432);
  });
  it('does not remove employer NI when the employee is exempt', () => {
    expect(calc({ noNI: true }).employeeNI.total).toBe(0);
    expect(calc({ noNI: true }).employerNI.total).toBe(6000);
  });
  it('ignores employment-only pensions for sole traders and preserves Class 4 profits', () => {
    const r = calc({
      selfEmployed: true,
      pensionEnabled: true,
      dbPensionEnabled: true,
      dbMemberContribution: 10,
      pensionContributions: {
        autoEnrolment: 5,
        autoEnrolmentEmployer: 3,
        salarySacrifice: 10000,
        personal: 800,
      },
    });
    expect(r.employeeNI.total).toBeCloseTo(1945.8, 2);
    expect(r.employerNI.total).toBe(0);
    expect(r.pensionPot.total).toBe(1000);
    expect(r.dbPension.accrued).toBe(0);
  });
});

describe('deductions reconcile to gross income (GitHub #42)', () => {
  for (const salary of [0, 12570, 45000, 60000, 100000, 125140, 200000]) {
    it(`reconciles every cash pound at £${salary}`, () => {
      const r = calc({
        annualGrossSalary: salary,
        annualGrossDividends: 3000,
        pensionEnabled: true,
        studentLoanEnabled: true,
        studentLoan: ['plan2', 'postgrad'],
        childBenefits: { mode: 'partner', numberOfChildren: 2 },
        pensionContributions: {
          autoEnrolment: 5,
          autoEnrolmentEmployer: 3,
          salarySacrifice: 1000,
          personal: 800,
        },
      });
      expect(r.takeHomePay + r.combinedDeductions).toBeCloseTo(salary + 3000, 6);
      expect(r.combinedDeductions).toBeCloseTo(r.combinedTaxes + r.employeePensionContributions, 6);
      expect(r.pensionPot.total).toBeCloseTo(
        r.pensionPot.breakdown.reduce((s, b) => s + b.amount, 0),
        6,
      );
    });
  }
  it('caps sacrifice to actual available pay', () => {
    const r = calc({
      annualGrossSalary: 1000,
      pensionEnabled: true,
      pensionContributions: { ...pension(0), salarySacrifice: 5000 },
    });
    expect(r.pensionPot.total).toBe(1000);
    expect(r.takeHomePay).toBe(0);
  });
  it('exports deductions, periods and calculation assumptions', () => {
    const csv = buildResultsCsv(calc(), defaultInputs);
    expect(csv).toContain(
      '"Total deductions (including your pension)","9080.40","756.70","174.62"',
    );
    expect(csv).toContain('2026/27');
    expect(csv).toContain('Relief at source');
    expect(csv).toContain('Monthly GBP');
    expect(periodDivisor('daily', { ...defaultInputs, workingDaysPerWeek: 3 })).toBe(156);
  });
});

describe('payroll cash flow', () => {
  it('uses published monthly, weekly and fortnightly NI thresholds', () => {
    const c = taxYears['2026/27'];
    expect(calculatePeriodNI(1048, 12, c, false, false).total).toBe(0);
    expect(calculatePeriodNI(242, 52, c, false, false).total).toBe(0);
    expect(calculatePeriodNI(484, 26, c, false, false).total).toBe(0);
    expect(calculatePeriodNI(3000, 12, c, false, false).total).toBe(156.16);
  });
  it('counts salary sacrifice, net-pay AE, DB and personal payments without giving all of them NI relief', () => {
    const inputs = {
      ...defaultInputs,
      annualGrossSalary: 60000,
      pensionEnabled: true,
      autoEnrolmentAsSalarySacrifice: false,
      dbPensionEnabled: true,
      dbMemberContribution: 5,
      pensionContributions: {
        autoEnrolment: 5,
        autoEnrolmentEmployer: 3,
        salarySacrifice: 1200,
        personal: 1200,
      },
    };
    const r = calculatePayroll(
      Array.from({ length: 12 }, () => ({ salary: 5000, bonus: 0 })),
      inputs,
      12,
    );
    // Monthly: £100 sacrifice, £245 workplace, £250 DB, £100 personal.
    expect(r.perPeriod[0].pension).toBe(695);
    expect(r.perPeriod[0].ni).toBe(265.5); // NI on £4,900, not on £4,305
    expect(r.totals.pension).toBeCloseTo(r.annualBasis.employeePensionContributions, 6);
    expect(
      r.takeHomePay + r.totals.pension + r.totals.ni + r.totals.sl + r.annualBasis.incomeTax.total,
    ).toBeCloseTo(60000, 6);
  });
  it('reconciles uneven qualifying-earnings contributions with the year-end liability', () => {
    const r = calculatePayroll(
      [
        { salary: 24000, bonus: 0 },
        ...Array.from({ length: 11 }, () => ({ salary: 1000, bonus: 0 })),
      ],
      {
        ...defaultInputs,
        pensionEnabled: true,
        autoEnrolmentOnQualifyingEarnings: true,
        pensionContributions: { ...pension(0), autoEnrolment: 5, autoEnrolmentEmployer: 3 },
      },
      12,
    );
    expect(r.totals.ae).toBeCloseTo((4189 - 520) * 0.05 + 11 * (1000 - 520) * 0.05, 6);
    expect(r.annualBasis.employeePensionContributions).toBeCloseTo(r.totals.pension, 6);
    expect(
      r.takeHomePay + r.totals.pension + r.totals.ni + r.annualBasis.incomeTax.total,
    ).toBeCloseTo(35000, 6);
  });
});

describe('reverse salary estimates', () => {
  it('finds a salary that meets a target without changing pension assumptions', () => {
    const salary = salaryForTarget(defaultInputs, 42000)!;
    expect(salary).toBeCloseTo(54211.38, 2);
    const cash = calculateTaxes(scenarioInputs(defaultInputs, salary, 0)).takeHomePay;
    expect(cash).toBeGreaterThanOrEqual(42000);
    expect(cash).toBeLessThan(42000.01);
  });
  it('reports an unreachable target when all earnings are sacrificed', () => {
    expect(
      salaryForTarget(
        {
          ...defaultInputs,
          pensionEnabled: true,
          salarySacrificeIsPercentage: true,
          pensionContributions: { ...pension(0), salarySacrifice: 100 },
        },
        42000,
      ),
    ).toBeNull();
  });
  it('handles targets met by other income and rejects non-finite targets', () => {
    expect(salaryForTarget({ ...defaultInputs, annualGrossDividends: 50000 }, 12000)).toBe(0);
    expect(salaryForTarget(defaultInputs, Infinity)).toBeNull();
  });
});
