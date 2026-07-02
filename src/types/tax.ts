// Student loan plan types
export type StudentLoanPlan = 'plan1' | 'plan2' | 'plan4' | 'plan5' | 'postgrad';

export interface StudentLoanOption {
  plan: StudentLoanPlan;
  label: string;
}

// Tax year constants types
export interface ChildBenefitRates {
  firstChildRate: number;
  additionalChildRate: number;
}

export interface TaxAllowanceConstants {
  basicAllowance: number;
  taperThreshold: number;
  blindPersonsAllowance: number;
}

export interface NationalInsuranceConstants {
  lowerEarningsLimit: number;
  primaryThreshold: number;
  secondaryThreshold: number;
  upperEarningsLimit: number;
  employerRates: [number, number];
  employeeRates: [number, number];
}

export interface StudentLoanThresholds {
  plan1: number;
  plan2: number;
  plan4: number;
  plan5: number;
  postgrad: number;
}

export interface StudentLoanConstants {
  defaultRate: number;
  postgradRate: number;
  thresholds: StudentLoanThresholds;
}

// Tax band: [rate, upper limit]
export type TaxBand = [number, number];

export interface IncomeTaxConstants {
  scotland: TaxBand[];
  restOfUK: TaxBand[];
}

export interface HICBCConstants {
  threshold: number;
  taperDivisor: number; // 100 (pre-2024/25) or 200 (2024/25+)
}

// Auto enrolment qualifying earnings band (DWP annual review)
export interface QualifyingEarningsBand {
  lower: number;
  upper: number;
}

// Dividend allowance and dividend tax rates (basic/higher/additional)
export interface DividendConstants {
  allowance: number;
  rates: [number, number, number];
}

// Self-employed National Insurance (Class 2 flat rate + Class 4 on profits)
export interface SelfEmployedNIConstants {
  class2WeeklyRate: number; // 0 when Class 2 is abolished / voluntary only
  class2SmallProfitsThreshold: number;
  class4LowerLimit: number;
  class4UpperLimit: number;
  class4Rates: [number, number];
}

// Pension annual allowance and its taper for high earners
export interface PensionAnnualAllowanceConstants {
  standard: number;
  taperThresholdIncome: number; // taper only applies if threshold income exceeds this
  taperAdjustedIncome: number; // reduced £1 per £2 of adjusted income over this
  minimum: number;
}

export interface TaxYearConstants {
  childBenefitRates: ChildBenefitRates;
  hicbc: HICBCConstants;
  qualifyingEarnings: QualifyingEarningsBand;
  pensionAnnualAllowance: PensionAnnualAllowanceConstants;
  dividends: DividendConstants;
  taxAllowance: TaxAllowanceConstants;
  nationalInsurance: NationalInsuranceConstants;
  selfEmployedNI: SelfEmployedNIConstants;
  studentLoan: StudentLoanConstants;
  incomeTax: IncomeTaxConstants;
}

export type TaxYearKey = string;

export type TaxYearsData = Record<TaxYearKey, TaxYearConstants>;

// User input types
export type ChildBenefitsMode = 'off' | 'self' | 'partner';

export interface ChildBenefitsInput {
  mode: ChildBenefitsMode;
  numberOfChildren: number;
}

export interface PensionContributionsInput {
  autoEnrolment: number; // employee contribution %
  autoEnrolmentEmployer: number; // employer contribution %
  salarySacrifice: number;
  personal: number;
}

export interface TaxInputs {
  taxYear: TaxYearKey;
  studentLoan: StudentLoanPlan[];
  annualGrossSalary: number;
  annualGrossBonus: number;
  annualGrossDividends: number;
  annualGrossIncomeRange: number;
  workingDaysPerWeek: number; // 5 = full-time; salary is scaled by workingDaysPerWeek/5
  selfEmployed: boolean; // salary is trading profits; Class 2/4 NICs replace Class 1
  residentInScotland: boolean;
  noNI: boolean;
  blind: boolean;
  childBenefits: ChildBenefitsInput;
  pensionContributions: PensionContributionsInput;
  salarySacrificeIsPercentage: boolean; // salarySacrifice is % of gross income instead of £
  autoEnrolmentAsSalarySacrifice: boolean;
  autoEnrolmentOnQualifyingEarnings: boolean; // AE % applies to qualifying earnings band vs full pay
  employerNISavingsToPension: boolean; // employer passes NI saved on sacrificed salary into the pension
  dbPensionEnabled: boolean; // defined benefit scheme section
  dbMemberContribution: number; // % of gross salary, net pay arrangement (reduces tax, not NI)
  dbAccrualDenominator: number; // annual pension accrued = salary / N
  taxReliefAtSource: boolean;
  pensionEnabled: boolean;
  studentLoanEnabled: boolean;
}

// Calculation result types
export interface BreakdownItem {
  rate: string | number;
  amount: number;
}

export interface CalculationResult {
  total: number;
  breakdown: BreakdownItem[];
}

export interface PensionAllowanceResult {
  allowance: number; // annual allowance after any taper
  used: number; // total contributions counted against it
  tapered: boolean; // allowance was reduced below the year's standard amount
  exceeded: boolean;
}

export interface DBPensionResult {
  accrued: number; // annual pension earned this year (salary / accrual denominator)
  memberContribution: number; // gross member contribution deducted from pay
}

export interface TaxCalculationResult {
  annualGrossIncome: CalculationResult;
  adjustedNetIncome: number;
  taxAllowance: CalculationResult;
  taxableIncome: number;
  incomeTax: CalculationResult;
  dividendTax: CalculationResult;
  employeeNI: CalculationResult;
  employerNI: CalculationResult;
  studentLoanRepayments: CalculationResult;
  combinedTaxes: number;
  hicbc: number;
  childBenefits: CalculationResult;
  takeHomePay: number;
  pensionPot: CalculationResult;
  pensionAnnualAllowance: PensionAllowanceResult;
  dbPension: DBPensionResult;
  totalYouKeep: number;
}
