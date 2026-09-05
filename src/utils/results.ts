import type { TaxInputs, TaxCalculationResult } from '../types/tax';

export const periods = {
  monthly: { label: 'Monthly', noun: 'month', divisor: 12 },
  annual: { label: 'Annual', noun: 'year', divisor: 1 },
  weekly: { label: 'Weekly', noun: 'week', divisor: 52 },
  daily: { label: 'Daily', noun: 'working day', divisor: 260 },
};
export type Period = keyof typeof periods;
export function periodDivisor(period: Period, inputs: TaxInputs) {
  return period === 'daily' ? inputs.workingDaysPerWeek * 52 : periods[period].divisor;
}
export const colors = {
  takeHome: '#218466',
  tax: '#6675da',
  ni: '#e5ae55',
  loan: '#bc7cba',
  pension: '#6caaa5',
  hicbc: '#cb775e',
};
export function deductionRows(r: TaxCalculationResult, inputs: TaxInputs) {
  return [
    { label: 'Income Tax', amount: r.incomeTax.total, color: colors.tax },
    { label: 'Dividend tax', amount: r.dividendTax.total, color: colors.tax },
    {
      label: inputs.selfEmployed ? 'National Insurance · Class 2 & 4' : 'National Insurance',
      amount: r.employeeNI.total,
      color: colors.ni,
    },
    { label: 'Student loan repayments', amount: r.studentLoanRepayments.total, color: colors.loan },
    { label: 'Child Benefit tax charge', amount: r.hicbc, color: colors.hicbc },
    {
      label: 'Your pension contributions',
      amount: r.employeePensionContributions,
      color: colors.pension,
    },
  ];
}
export function resultRows(r: TaxCalculationResult, inputs: TaxInputs) {
  return [
    { label: 'Gross salary / trading profit', amount: inputs.annualGrossSalary },
    { label: 'Gross bonus / other profit', amount: inputs.annualGrossBonus },
    { label: 'Gross dividends', amount: inputs.annualGrossDividends },
    ...deductionRows(r, inputs),
    { label: 'Total deductions (including your pension)', amount: r.combinedDeductions },
    { label: 'Take-home pay (before Child Benefit)', amount: r.takeHomePay },
    { label: 'Child Benefit received', amount: r.childBenefits.total },
    {
      label: 'Spendable cash including Child Benefit',
      amount: r.takeHomePay + r.childBenefits.total,
    },
    {
      label: 'Total into pension (includes employer and provider relief)',
      amount: r.pensionPot.total,
    },
    { label: 'DB annual pension accrued (future annual income)', amount: r.dbPension.accrued },
    { label: 'Employer NI (not deducted from your pay)', amount: r.employerNI.total },
  ];
}
export function buildResultsCsv(r: TaxCalculationResult, inputs: TaxInputs) {
  const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const assumptions: (string | number)[][] = [
    ['CoolTaxTool annual estimate', inputs.taxYear],
    ['Region', inputs.residentInScotland ? 'Scotland' : 'England, Wales & Northern Ireland'],
    ['Income type', inputs.selfEmployed ? 'Self-employed' : 'Employed'],
    ['Working days per week', inputs.workingDaysPerWeek],
    ['Employee / self-employed NI exempt', String(inputs.noNI)],
    ['Blind Person’s Allowance', String(inputs.blind)],
    ['Student loans', inputs.studentLoanEnabled ? inputs.studentLoan.join(', ') : 'Off'],
    ['Pension enabled', String(inputs.pensionEnabled)],
    ['Workplace employee percent', inputs.pensionContributions.autoEnrolment],
    ['Workplace employer percent', inputs.pensionContributions.autoEnrolmentEmployer],
    ['Workplace salary sacrifice', String(inputs.autoEnrolmentAsSalarySacrifice)],
    ['Qualifying earnings basis', String(inputs.autoEnrolmentOnQualifyingEarnings)],
    ['Additional salary sacrifice', inputs.pensionContributions.salarySacrifice],
    ['Additional sacrifice unit', inputs.salarySacrificeIsPercentage ? 'Percent' : 'GBP'],
    ['Employer NI saving added', String(inputs.employerNISavingsToPension)],
    ['Personal pension payment GBP', inputs.pensionContributions.personal],
    ['Relief at source', String(inputs.taxReliefAtSource)],
    ['DB enabled', String(inputs.dbPensionEnabled)],
    ['DB contribution percent', inputs.dbMemberContribution],
    ['DB accrual denominator', inputs.dbAccrualDenominator],
    ['Child Benefit recipient', inputs.childBenefits.mode],
    ['Children', inputs.childBenefits.numberOfChildren],
    ['Adjusted net income GBP', r.adjustedNetIncome.toFixed(2)],
    ['Personal and blind allowance GBP', r.taxAllowance.total.toFixed(2)],
    [
      'Basis',
      'Annual liability including eligible pension relief claimed from HMRC. Periods are annual averages, not payslips.',
    ],
    [],
    ['Item', 'Annual GBP', 'Monthly GBP', 'Weekly GBP'],
  ];
  return (
    '\uFEFF' +
    [
      ...assumptions,
      ...resultRows(r, inputs).map((row) => [
        row.label,
        row.amount.toFixed(2),
        (row.amount / 12).toFixed(2),
        (row.amount / 52).toFixed(2),
      ]),
    ]
      .map((row) => row.map(escape).join(','))
      .join('\r\n')
  );
}
export function downloadResults(r: TaxCalculationResult, inputs: TaxInputs) {
  const url = URL.createObjectURL(
    new Blob([buildResultsCsv(r, inputs)], { type: 'text/csv;charset=utf-8;' }),
  );
  const a = document.createElement('a');
  a.href = url;
  a.download = `cooltaxtool-${inputs.taxYear.replace('/', '-')}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
