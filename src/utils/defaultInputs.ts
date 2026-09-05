import type { TaxInputs } from '../types/tax';
import { taxYears } from './TaxYears';

export const defaultInputs: TaxInputs = {
  taxYear: Object.keys(taxYears)[0],
  studentLoan: [],
  annualGrossSalary: 45000,
  annualGrossBonus: 0,
  annualGrossDividends: 0,
  annualGrossIncomeRange: 150000,
  workingDaysPerWeek: 5,
  selfEmployed: false,
  residentInScotland: false,
  noNI: false,
  blind: false,
  childBenefits: { mode: 'off', numberOfChildren: 1 },
  pensionContributions: {
    autoEnrolment: 0,
    autoEnrolmentEmployer: 0,
    salarySacrifice: 0,
    personal: 0,
  },
  salarySacrificeIsPercentage: false,
  autoEnrolmentAsSalarySacrifice: true,
  autoEnrolmentOnQualifyingEarnings: false,
  employerNISavingsToPension: false,
  dbPensionEnabled: false,
  dbMemberContribution: 0,
  dbAccrualDenominator: 57,
  taxReliefAtSource: true,
  pensionEnabled: false,
  studentLoanEnabled: false,
};
