import type { TaxInputs } from '../types/tax';
import { taxYears } from './TaxYears';
import { calculatePeriodNI, calculatePeriodSL, calculateTaxes } from './TaxCalc';
export interface PayrollRow {
  salary: number;
  bonus: number;
}

// Keep per-period cash deductions and the annual liability on the same inputs.
export function calculatePayroll(rows: PayrollRow[], inputs: TaxInputs, periodsPerYear: number) {
  const c = taxYears[inputs.taxYear];
  const p = inputs.pensionEnabled
    ? inputs.pensionContributions
    : { personal: 0, salarySacrifice: 0, autoEnrolment: 0, autoEnrolmentEmployer: 0 };
  const threshold = (annual: number) =>
    periodsPerYear === 26 ? Math.round(annual / 52) * 2 : Math.round(annual / periodsPerYear);
  const perPeriod = rows.map(({ salary, bonus }) => {
    const grossPay = Math.max(0, salary) + Math.max(0, bonus);
    const sacrifice = Math.min(
      grossPay,
      inputs.salarySacrificeIsPercentage
        ? (grossPay * p.salarySacrifice) / 100
        : p.salarySacrifice / periodsPerYear,
    );
    const afterSacrifice = grossPay - sacrifice;
    const aeBase = inputs.autoEnrolmentOnQualifyingEarnings
      ? Math.min(
          Math.max(0, afterSacrifice - threshold(c.qualifyingEarnings.lower)),
          threshold(c.qualifyingEarnings.upper) - threshold(c.qualifyingEarnings.lower),
        )
      : afterSacrifice;
    const ae = (aeBase * p.autoEnrolment) / 100;
    const employer = (aeBase * p.autoEnrolmentEmployer) / 100;
    const db =
      inputs.pensionEnabled && inputs.dbPensionEnabled
        ? Math.min(
            Math.max(0, afterSacrifice - ae),
            (Math.max(0, salary) * inputs.dbMemberContribution) / 100,
          )
        : 0;
    const pension = sacrifice + ae + db + p.personal / periodsPerYear;
    const niablePay = Math.max(
      0,
      afterSacrifice - (inputs.autoEnrolmentAsSalarySacrifice ? ae : 0),
    );
    const ni = calculatePeriodNI(niablePay, periodsPerYear, c, false, inputs.noNI).total;
    const sl = calculatePeriodSL(
      niablePay,
      periodsPerYear,
      inputs.studentLoanEnabled ? inputs.studentLoan : [],
      c,
    ).total;
    return {
      grossPay,
      sacrifice,
      ae,
      employer,
      db,
      pension,
      ni,
      sl,
      netIsh: grossPay - pension - ni - sl,
    };
  });
  const totals = perPeriod.reduce(
    (a, r) => ({
      grossPay: a.grossPay + r.grossPay,
      sacrifice: a.sacrifice + r.sacrifice,
      ae: a.ae + r.ae,
      employer: a.employer + r.employer,
      db: a.db + r.db,
      pension: a.pension + r.pension,
      ni: a.ni + r.ni,
      sl: a.sl + r.sl,
      netIsh: a.netIsh + r.netIsh,
    }),
    { grossPay: 0, sacrifice: 0, ae: 0, employer: 0, db: 0, pension: 0, ni: 0, sl: 0, netIsh: 0 },
  );
  const salary = rows.reduce((sum, r) => sum + Math.max(0, r.salary), 0);
  const bonus = rows.reduce((sum, r) => sum + Math.max(0, r.bonus), 0);
  const fullBase = Math.max(0, salary + bonus - totals.sacrifice);
  // Express the actual contributions as effective full-pay percentages for the
  // annual engine, so uneven qualifying earnings don't create a second pension.
  const annualBasis = calculateTaxes({
    ...inputs,
    annualGrossSalary: salary,
    annualGrossBonus: bonus,
    salarySacrificeIsPercentage: false,
    autoEnrolmentOnQualifyingEarnings: false,
    pensionContributions: {
      ...p,
      salarySacrifice: totals.sacrifice,
      autoEnrolment: fullBase ? (totals.ae / fullBase) * 100 : 0,
      autoEnrolmentEmployer: fullBase ? (totals.employer / fullBase) * 100 : 0,
    },
    dbMemberContribution: salary ? (totals.db / salary) * 100 : 0,
  });
  // Annual loan liability may additionally include dividends via Self Assessment.
  const extraAnnualLoan =
    inputs.annualGrossDividends > 2000
      ? Math.max(0, annualBasis.studentLoanRepayments.total - totals.sl)
      : 0;
  const takeHomePay =
    annualBasis.takeHomePay +
    annualBasis.employeeNI.total -
    totals.ni +
    annualBasis.studentLoanRepayments.total -
    totals.sl -
    extraAnnualLoan;
  return { perPeriod, totals, annualBasis, takeHomePay, extraAnnualLoan };
}
