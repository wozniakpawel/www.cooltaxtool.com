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

export interface TaxYearConstants {
  childBenefitRates: ChildBenefitRates;
  hicbc: HICBCConstants;
  qualifyingEarnings: QualifyingEarningsBand;
  taxAllowance: TaxAllowanceConstants;
  nationalInsurance: NationalInsuranceConstants;
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
  annualGrossIncomeRange: number;
  workingDaysPerWeek: number; // 5 = full-time; salary is scaled by workingDaysPerWeek/5
  residentInScotland: boolean;
  noNI: boolean;
  blind: boolean;
  childBenefits: ChildBenefitsInput;
  pensionContributions: PensionContributionsInput;
  salarySacrificeIsPercentage: boolean; // salarySacrifice is % of gross income instead of £
  autoEnrolmentAsSalarySacrifice: boolean;
  autoEnrolmentOnQualifyingEarnings: boolean; // AE % applies to qualifying earnings band vs full pay
  taxReliefAtSource: boolean;
  incomeAnalysis: boolean;
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

export interface TaxCalculationResult {
  annualGrossIncome: CalculationResult;
  adjustedNetIncome: number;
  taxAllowance: CalculationResult;
  taxableIncome: number;
  incomeTax: CalculationResult;
  employeeNI: CalculationResult;
  employerNI: CalculationResult;
  studentLoanRepayments: CalculationResult;
  combinedTaxes: number;
  hicbc: number;
  childBenefits: CalculationResult;
  takeHomePay: number;
  pensionPot: CalculationResult;
  yourMoney: number;
}
