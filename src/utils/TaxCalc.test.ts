import {
  calculateAnnualGrossIncome,
  calculateTaxAllowance,
  calculateIncomeTax,
  calculateNationalInsurance,
  calculateStudentLoanRepayments,
  calculateChildBenefits,
  calculatePensionAnnualAllowance,
  calculateDividendTax,
  grossManualPensionContributions,
  calculateTaxes,
} from './TaxCalc';
import { taxYears } from './TaxYears';
import type { TaxInputs } from '../types/tax';

// Use 2024/25 tax year for consistent test results
const constants = taxYears['2024/25'];

describe('calculateAnnualGrossIncome', () => {
  it('should calculate total gross income from salary and bonus', () => {
    const result = calculateAnnualGrossIncome(50000, 5000);
    expect(result.total).toBe(55000);
    expect(result.breakdown).toHaveLength(2);
  });

  it('should handle zero values', () => {
    const result = calculateAnnualGrossIncome(0, 0);
    expect(result.total).toBe(0);
  });

  it('should handle salary only', () => {
    const result = calculateAnnualGrossIncome(30000, 0);
    expect(result.total).toBe(30000);
  });
});

describe('calculateTaxAllowance', () => {
  it('should return full personal allowance for low income', () => {
    const result = calculateTaxAllowance(30000, false, constants);
    expect(result.total).toBe(12570);
  });

  it('should taper personal allowance above £100,000', () => {
    // At £110,000: reduction = (110000 - 100000) * 0.5 = £5,000
    // Allowance = 12570 - 5000 = £7,570
    const result = calculateTaxAllowance(110000, false, constants);
    expect(result.total).toBe(7570);
  });

  it('should reduce personal allowance to zero at £125,140', () => {
    const result = calculateTaxAllowance(125140, false, constants);
    expect(result.total).toBe(0);
  });

  it('should add blind persons allowance when blind', () => {
    const result = calculateTaxAllowance(30000, true, constants);
    expect(result.total).toBe(12570 + 3070); // 15640 for 2024/25
    expect(result.breakdown).toHaveLength(2);
  });

  it('should taper personal allowance but keep blind allowance', () => {
    const result = calculateTaxAllowance(125140, true, constants);
    // Personal allowance tapered to 0, but blind allowance remains
    expect(result.total).toBe(3070);
  });
});

describe('calculateIncomeTax', () => {
  describe('rest of UK', () => {
    it('should calculate zero tax for zero taxable income', () => {
      const result = calculateIncomeTax(0, constants, false);
      expect(result.total).toBe(0);
    });

    it('should calculate basic rate tax only', () => {
      // £20,000 taxable income at 20%
      const result = calculateIncomeTax(20000, constants, false);
      expect(result.total).toBe(4000);
    });

    it('should calculate mixed basic and higher rate tax', () => {
      // £50,000 taxable income
      // First £37,700 at 20% = £7,540
      // Remaining £12,300 at 40% = £4,920
      // Total = £12,460
      const result = calculateIncomeTax(50000, constants, false);
      expect(result.total).toBe(12460);
    });

    it('should calculate tax including additional rate', () => {
      // £150,000 taxable income
      // First £37,700 at 20% = £7,540
      // Next £87,440 (to £125,140) at 40% = £34,976
      // Remaining £24,860 at 45% = £11,187
      // Total = £53,703
      const result = calculateIncomeTax(150000, constants, false);
      expect(result.total).toBe(53703);
    });
  });

  describe('Scotland', () => {
    it('should use Scottish tax bands', () => {
      // £30,000 taxable income in Scotland
      // Starter rate: £2,306 at 19% = £438.14
      // Basic rate: next £11,685 (to £13,991) at 20% = £2,337
      // Intermediate: next £16,009 (to £30,000) at 21% = £3,361.89
      // Total ≈ £6,137.03
      const result = calculateIncomeTax(30000, constants, true);
      expect(result.total).toBeCloseTo(6137.03, 0);
    });
  });
});

describe('calculateNationalInsurance', () => {
  describe('employee NI', () => {
    it('should return zero for income below threshold', () => {
      const result = calculateNationalInsurance(10000, constants, false, false);
      expect(result.total).toBe(0);
    });

    it('should calculate NI for income in first band', () => {
      // £30,000 income
      // Above primary threshold (£12,570) up to UEL (£50,270)
      // £17,430 at 8% = £1,394.40
      const result = calculateNationalInsurance(30000, constants, false, false);
      expect(result.total).toBeCloseTo(1394.40, 2);
    });

    it('should calculate NI for income above UEL', () => {
      // £60,000 income
      // £12,570 to £50,270 = £37,700 at 8% = £3,016
      // £50,270 to £60,000 = £9,730 at 2% = £194.60
      // Total = £3,210.60
      const result = calculateNationalInsurance(60000, constants, false, false);
      expect(result.total).toBeCloseTo(3210.60, 2);
    });

    it('should return zero when noNI is true', () => {
      const result = calculateNationalInsurance(60000, constants, false, true);
      expect(result.total).toBe(0);
    });
  });

  describe('employer NI', () => {
    it('should use employer rates and thresholds', () => {
      // £30,000 income
      // Above secondary threshold (£9,100) up to UEL (£50,270)
      // £20,900 at 13.8% = £2,884.20
      const result = calculateNationalInsurance(30000, constants, true, false);
      expect(result.total).toBeCloseTo(2884.20, 2);
    });
  });
});

describe('calculateStudentLoanRepayments', () => {
  it('should return zero for no plans', () => {
    const result = calculateStudentLoanRepayments(50000, [], constants);
    expect(result.total).toBe(0);
    expect(result.breakdown).toHaveLength(0);
  });

  it('should calculate Plan 1 repayments', () => {
    // £50,000 income, Plan 1 threshold £24,990
    // (50000 - 24990) * 0.09 = £2,250.90, floored = £2,250
    const result = calculateStudentLoanRepayments(50000, ['plan1'], constants);
    expect(result.total).toBe(2250);
  });

  it('should calculate Plan 2 repayments', () => {
    // £50,000 income, Plan 2 threshold £27,295
    // (50000 - 27295) * 0.09 = £2,043.45, floored = £2,043
    const result = calculateStudentLoanRepayments(50000, ['plan2'], constants);
    expect(result.total).toBe(2043);
  });

  it('should calculate postgraduate loan repayments', () => {
    // £50,000 income, Postgrad threshold £21,000
    // (50000 - 21000) * 0.06 = £1,740
    const result = calculateStudentLoanRepayments(50000, ['postgrad'], constants);
    expect(result.total).toBe(1740);
  });

  it('should stack postgraduate with other plans', () => {
    // Plan 2: £2,043 + Postgrad: £1,740 = £3,783
    const result = calculateStudentLoanRepayments(50000, ['plan2', 'postgrad'], constants);
    expect(result.total).toBe(2043 + 1740);
  });

  it('should return zero for income below threshold', () => {
    const result = calculateStudentLoanRepayments(20000, ['plan2'], constants);
    expect(result.total).toBe(0);
  });
});

describe('calculateChildBenefits', () => {
  const selfInput = { mode: 'self' as const, numberOfChildren: 2 };
  const partnerInput = { mode: 'partner' as const, numberOfChildren: 2 };

  it('should return zeros when mode is off', () => {
    const result = calculateChildBenefits(50000, { mode: 'off', numberOfChildren: 2 }, constants.childBenefitRates, constants.hicbc);
    expect(result.childBenefits.total).toBe(0);
    expect(result.hicbc).toBe(0);
  });

  describe('self mode', () => {
    it('should return gross benefits and zero hicbc below threshold', () => {
      // First child: 25.60 * 52 = 1331.20
      // Additional child: 16.95 * 52 = 881.40
      // Total = 2212.60
      const result = calculateChildBenefits(40000, selfInput, constants.childBenefitRates, constants.hicbc);
      expect(result.childBenefits.total).toBeCloseTo(2212.60, 2);
      expect(result.hicbc).toBe(0);
    });

    it('should return gross benefits and hicbc above threshold', () => {
      // At 70000: excess = 10000, charge % = floor(10000/200) = 50%
      // Benefits = 2212.60, HICBC = 2212.60 * 50% = 1106.30
      const result = calculateChildBenefits(70000, selfInput, constants.childBenefitRates, constants.hicbc);
      expect(result.childBenefits.total).toBeCloseTo(2212.60, 2);
      expect(result.hicbc).toBeCloseTo(1106.30, 2);
    });

    it('should clawback full benefits at 80000+', () => {
      const result = calculateChildBenefits(80000, selfInput, constants.childBenefitRates, constants.hicbc);
      expect(result.childBenefits.total).toBeCloseTo(2212.60, 2);
      expect(result.hicbc).toBeCloseTo(2212.60, 2);
    });
  });

  describe('partner mode', () => {
    it('should return zero benefits and zero hicbc below threshold', () => {
      const result = calculateChildBenefits(40000, partnerInput, constants.childBenefitRates, constants.hicbc);
      expect(result.childBenefits.total).toBe(0);
      expect(result.hicbc).toBe(0);
    });

    it('should return zero benefits and hicbc above threshold', () => {
      const result = calculateChildBenefits(70000, partnerInput, constants.childBenefitRates, constants.hicbc);
      expect(result.childBenefits.total).toBe(0);
      expect(result.hicbc).toBeCloseTo(1106.30, 2);
    });

    it('should return zero benefits and full hicbc at 80000+', () => {
      const result = calculateChildBenefits(80000, partnerInput, constants.childBenefitRates, constants.hicbc);
      expect(result.childBenefits.total).toBe(0);
      expect(result.hicbc).toBeCloseTo(2212.60, 2);
    });
  });

  describe('pre-2024/25 HICBC (threshold 50k, taper divisor 100)', () => {
    const oldConstants = taxYears['2023/24'];

    it('should apply HICBC above 50000 in self mode', () => {
      // At 55000: excess = 5000, charge % = floor(5000/100) = 50%
      // First child: 24.00 * 52 = 1248.00
      // Additional child: 15.90 * 52 = 826.80
      // Benefits = 2074.80, HICBC = 1037.40
      const result = calculateChildBenefits(55000, selfInput, oldConstants.childBenefitRates, oldConstants.hicbc);
      expect(result.childBenefits.total).toBeCloseTo(2074.80, 2);
      expect(result.hicbc).toBeCloseTo(1037.40, 2);
    });

    it('should return full hicbc at 60000+ in partner mode', () => {
      const result = calculateChildBenefits(60000, partnerInput, oldConstants.childBenefitRates, oldConstants.hicbc);
      expect(result.childBenefits.total).toBe(0);
      expect(result.hicbc).toBeCloseTo(2074.80, 2);
    });
  });
});

describe('grossManualPensionContributions', () => {
  it('should gross up contributions with tax relief at source', () => {
    // £800 contribution becomes £1,000 with 25% tax relief (taxpayer)
    const result = grossManualPensionContributions(800, true, 50000, 12570);
    expect(result).toBe(1000);
  });

  it('should not gross up contributions without tax relief at source', () => {
    const result = grossManualPensionContributions(800, false, 50000, 12570);
    expect(result).toBe(800);
  });

  it('should cap relief at £2,880 for non-taxpayers', () => {
    // Non-taxpayer (income £10,000, allowance £12,570) contributing £5,000
    // Only first £2,880 gets grossed up: £2,880 * 1.25 + £2,120 = £5,720
    const result = grossManualPensionContributions(5000, true, 10000, 12570);
    expect(result).toBe(5720);
  });

  it('should give full relief to non-taxpayers contributing under £2,880', () => {
    // Non-taxpayer contributing £2,000 — all gets relief
    const result = grossManualPensionContributions(2000, true, 10000, 12570);
    expect(result).toBe(2500);
  });

  it('should give full relief to taxpayers regardless of amount', () => {
    // Taxpayer (income £50,000) contributing £5,000 — full relief
    const result = grossManualPensionContributions(5000, true, 50000, 12570);
    expect(result).toBe(6250);
  });

  it('should not gross up non-taxpayer contributions without relief at source', () => {
    const result = grossManualPensionContributions(5000, false, 10000, 12570);
    expect(result).toBe(5000);
  });
});

describe('calculatePensionAnnualAllowance', () => {
  const aa = constants.pensionAnnualAllowance; // 2024/25: 60k standard, 200k/260k taper, 10k min

  it('should return the standard allowance below the taper limits', () => {
    expect(calculatePensionAnnualAllowance(150000, 180000, aa)).toBe(60000);
  });

  it('should not taper when threshold income is under its limit even if adjusted income is over', () => {
    expect(calculatePensionAnnualAllowance(190000, 270000, aa)).toBe(60000);
  });

  it('should taper £1 for every £2 of adjusted income over the limit', () => {
    // Adjusted 300,000: reduction = (300,000 - 260,000) / 2 = 20,000
    expect(calculatePensionAnnualAllowance(250000, 300000, aa)).toBe(40000);
  });

  it('should floor the allowance at the minimum', () => {
    // Adjusted 400,000: reduction 70,000 would exceed 60k - 10k
    expect(calculatePensionAnnualAllowance(350000, 400000, aa)).toBe(10000);
  });
});

describe('calculateTaxes', () => {
  const baseInputs: TaxInputs = {
    taxYear: '2024/25',
    studentLoan: [],
    annualGrossSalary: 50000,
    annualGrossBonus: 0,
    annualGrossDividends: 0,
    annualGrossIncomeRange: 150000,
    workingDaysPerWeek: 5,
    residentInScotland: false,
    noNI: false,
    blind: false,
    childBenefits: { mode: 'off', numberOfChildren: 1 },
    pensionContributions: { autoEnrolment: 0, autoEnrolmentEmployer: 0, salarySacrifice: 0, personal: 0 },
    salarySacrificeIsPercentage: false,
    autoEnrolmentAsSalarySacrifice: true,
    autoEnrolmentOnQualifyingEarnings: false,
    employerNISavingsToPension: false,
    taxReliefAtSource: true,
    incomeAnalysis: false,
    pensionEnabled: false,
    studentLoanEnabled: false,
  };

  it('should calculate taxes for a basic salary', () => {
    const result = calculateTaxes(baseInputs);

    expect(result.annualGrossIncome.total).toBe(50000);
    expect(result.adjustedNetIncome).toBe(50000);
    expect(result.taxAllowance.total).toBe(12570);
    expect(result.taxableIncome).toBe(37430);
    // Tax: 37430 at 20% = £7,486
    expect(result.incomeTax.total).toBe(7486);
  });

  it('should reduce taxable income with salary sacrifice pension', () => {
    const inputs: TaxInputs = {
      ...baseInputs,
      pensionEnabled: true,
      pensionContributions: { ...baseInputs.pensionContributions, salarySacrifice: 5000 },
    };
    const result = calculateTaxes(inputs);

    expect(result.adjustedNetIncome).toBe(45000);
    expect(result.pensionPot.total).toBe(5000);
  });

  it('should add employer auto enrolment contributions to the pension pot without affecting pay', () => {
    const withoutEmployer = calculateTaxes({
      ...baseInputs,
      pensionEnabled: true,
      pensionContributions: { ...baseInputs.pensionContributions, autoEnrolment: 5 },
    });
    const withEmployer = calculateTaxes({
      ...baseInputs,
      pensionEnabled: true,
      pensionContributions: { ...baseInputs.pensionContributions, autoEnrolment: 5, autoEnrolmentEmployer: 3 },
    });

    // Employer pays 3% of £50,000 = £1,500 into the pot
    expect(withEmployer.pensionPot.total).toBeCloseTo(withoutEmployer.pensionPot.total + 1500, 6);
    // Employee's taxes and take-home pay are unchanged
    expect(withEmployer.takeHomePay).toBe(withoutEmployer.takeHomePay);
    expect(withEmployer.combinedTaxes).toBe(withoutEmployer.combinedTaxes);
    expect(withEmployer.adjustedNetIncome).toBe(withoutEmployer.adjustedNetIncome);
  });

  it('should flag when pension contributions exceed the annual allowance', () => {
    const result = calculateTaxes({
      ...baseInputs,
      annualGrossSalary: 120000,
      pensionEnabled: true,
      pensionContributions: { ...baseInputs.pensionContributions, salarySacrifice: 65000 },
    });

    expect(result.pensionAnnualAllowance.allowance).toBe(60000);
    expect(result.pensionAnnualAllowance.used).toBe(65000);
    expect(result.pensionAnnualAllowance.exceeded).toBe(true);
    expect(result.pensionAnnualAllowance.tapered).toBe(false);
  });

  it('should taper the allowance for high earners with employer contributions', () => {
    const result = calculateTaxes({
      ...baseInputs,
      annualGrossSalary: 280000,
      pensionEnabled: true,
      pensionContributions: { ...baseInputs.pensionContributions, autoEnrolmentEmployer: 10 },
    });

    // Adjusted income = 280,000 + 28,000 employer = 308,000 → reduction (308,000-260,000)/2 = 24,000
    expect(result.pensionAnnualAllowance.allowance).toBe(36000);
    expect(result.pensionAnnualAllowance.tapered).toBe(true);
  });

  it('should add employer NI savings on sacrificed salary to the pension pot when enabled', () => {
    const inputs: TaxInputs = {
      ...baseInputs,
      pensionEnabled: true,
      employerNISavingsToPension: true,
      pensionContributions: { ...baseInputs.pensionContributions, salarySacrifice: 5000 },
    };
    const result = calculateTaxes(inputs);

    // 2024/25 employer NI is 13.8%; £5,000 sacrificed entirely above the
    // secondary threshold saves the employer 5,000 * 0.138 = £690
    expect(result.pensionPot.total).toBeCloseTo(5000 + 690, 2);
    const niSaving = result.pensionPot.breakdown.find(b => b.rate === 'Employer NI saving');
    expect(niSaving?.amount).toBeCloseTo(690, 2);

    // Take-home pay and employee taxes are unaffected by the employer's top-up
    const withoutTopUp = calculateTaxes({ ...inputs, employerNISavingsToPension: false });
    expect(result.takeHomePay).toBe(withoutTopUp.takeHomePay);
    expect(result.combinedTaxes).toBe(withoutTopUp.combinedTaxes);
    expect(result.adjustedNetIncome).toBe(withoutTopUp.adjustedNetIncome);
  });

  it('should add no employer NI saving when nothing is sacrificed or NI is excluded', () => {
    const noSacrifice = calculateTaxes({
      ...baseInputs,
      pensionEnabled: true,
      employerNISavingsToPension: true,
    });
    expect(noSacrifice.pensionPot.breakdown.find(b => b.rate === 'Employer NI saving')?.amount).toBe(0);

    const noNI = calculateTaxes({
      ...baseInputs,
      noNI: true,
      pensionEnabled: true,
      employerNISavingsToPension: true,
      pensionContributions: { ...baseInputs.pensionContributions, salarySacrifice: 5000 },
    });
    expect(noNI.pensionPot.breakdown.find(b => b.rate === 'Employer NI saving')?.amount).toBe(0);
  });

  describe('dividend tax', () => {
    it('should tax dividends above earnings at the higher dividend rate', () => {
      const result = calculateTaxes({
        ...baseInputs,
        annualGrossSalary: 50000,
        annualGrossDividends: 10000,
      });

      // PA fully used by salary. Non-dividend taxable = 37,430. £500 allowance
      // consumes the last £270 of the basic band + £230 of the higher band;
      // remaining £9,500 all in the higher band at 33.75% = £3,206.25
      expect(result.dividendTax.total).toBeCloseTo(3206.25, 2);
      // No NI on dividends
      const withoutDividends = calculateTaxes({ ...baseInputs, annualGrossSalary: 50000 });
      expect(result.employeeNI.total).toBe(withoutDividends.employeeNI.total);
      expect(result.employerNI.total).toBe(withoutDividends.employerNI.total);
      // Dividends net of dividend tax land in take-home pay
      expect(result.takeHomePay).toBeCloseTo(withoutDividends.takeHomePay + 10000 - 3206.25, 2);
    });

    it('should shelter dividends with unused personal allowance', () => {
      const result = calculateTaxes({
        ...baseInputs,
        annualGrossSalary: 10000,
        annualGrossDividends: 5000,
      });

      // PA 12,570; earnings use 10,000, leaving 2,570 for dividends.
      // Taxable dividends 2,430; £500 allowance at 0%; 1,930 at 8.75% = £168.875
      expect(result.dividendTax.total).toBeCloseTo(168.88, 2);
    });

    it('should be zero with no dividends', () => {
      const result = calculateTaxes(baseInputs);
      expect(result.dividendTax.total).toBe(0);
      expect(result.dividendTax.breakdown).toHaveLength(0);
    });

    it('should use rest-of-UK bands and rates for Scottish residents', () => {
      const scot = calculateTaxes({
        ...baseInputs,
        annualGrossSalary: 50000,
        annualGrossDividends: 10000,
        residentInScotland: true,
      });
      const ruk = calculateTaxes({
        ...baseInputs,
        annualGrossSalary: 50000,
        annualGrossDividends: 10000,
        residentInScotland: false,
      });

      expect(scot.dividendTax.total).toBeCloseTo(ruk.dividendTax.total, 6);
      expect(scot.incomeTax.total).not.toBe(ruk.incomeTax.total);
    });

    it('should include dividends in adjusted net income for the PA taper', () => {
      // 95,000 salary + 20,000 dividends = 115,000 ANI → PA tapered by 7,500
      const result = calculateTaxes({
        ...baseInputs,
        annualGrossSalary: 95000,
        annualGrossDividends: 20000,
      });
      expect(result.adjustedNetIncome).toBe(115000);
      expect(result.taxAllowance.total).toBe(12570 - 7500);
    });
  });

  describe('qualifying earnings band', () => {
    // 2024/25 band: £6,240 – £50,270
    it('should apply AE percentages to the qualifying earnings slice when enabled', () => {
      const result = calculateTaxes({
        ...baseInputs,
        annualGrossSalary: 30000,
        pensionEnabled: true,
        autoEnrolmentOnQualifyingEarnings: true,
        pensionContributions: { ...baseInputs.pensionContributions, autoEnrolment: 5, autoEnrolmentEmployer: 3 },
      });

      // Base = 30,000 - 6,240 = 23,760; employee 5% = 1,188; employer 3% = 712.80
      expect(result.pensionPot.breakdown[1].amount).toBeCloseTo(1188, 2);
      expect(result.pensionPot.breakdown[2].amount).toBeCloseTo(712.80, 2);
    });

    it('should cap the qualifying earnings base at the upper limit', () => {
      const result = calculateTaxes({
        ...baseInputs,
        annualGrossSalary: 80000,
        pensionEnabled: true,
        autoEnrolmentOnQualifyingEarnings: true,
        pensionContributions: { ...baseInputs.pensionContributions, autoEnrolment: 5 },
      });

      // Base capped at 50,270 - 6,240 = 44,030; 5% = 2,201.50
      expect(result.pensionPot.breakdown[1].amount).toBeCloseTo(2201.50, 2);
    });

    it('should contribute nothing below the lower limit', () => {
      const result = calculateTaxes({
        ...baseInputs,
        annualGrossSalary: 6000,
        pensionEnabled: true,
        autoEnrolmentOnQualifyingEarnings: true,
        pensionContributions: { ...baseInputs.pensionContributions, autoEnrolment: 5 },
      });

      expect(result.pensionPot.total).toBe(0);
    });

    it('should use full pay when the switch is off', () => {
      const result = calculateTaxes({
        ...baseInputs,
        annualGrossSalary: 30000,
        pensionEnabled: true,
        autoEnrolmentOnQualifyingEarnings: false,
        pensionContributions: { ...baseInputs.pensionContributions, autoEnrolment: 5 },
      });

      // 5% of full £30,000
      expect(result.pensionPot.breakdown[1].amount).toBeCloseTo(1500, 2);
    });
  });

  it('should treat salary sacrifice as a percentage of gross income when the flag is set', () => {
    const inputs: TaxInputs = {
      ...baseInputs,
      pensionEnabled: true,
      salarySacrificeIsPercentage: true,
      pensionContributions: { ...baseInputs.pensionContributions, salarySacrifice: 10 },
    };
    const result = calculateTaxes(inputs);

    // 10% of £50,000 = £5,000 sacrificed
    expect(result.adjustedNetIncome).toBe(45000);
    expect(result.pensionPot.total).toBe(5000);
    expect(result.pensionPot.breakdown[0].amount).toBe(5000);
  });

  it('should cap percentage salary sacrifice at 100%', () => {
    const inputs: TaxInputs = {
      ...baseInputs,
      pensionEnabled: true,
      salarySacrificeIsPercentage: true,
      pensionContributions: { ...baseInputs.pensionContributions, salarySacrifice: 150 },
    };
    const result = calculateTaxes(inputs);

    expect(result.pensionPot.total).toBe(50000);
    expect(result.adjustedNetIncome).toBe(0);
    expect(result.takeHomePay).toBe(0);
  });

  it('should include percentage sacrifice of the bonus too', () => {
    const inputs: TaxInputs = {
      ...baseInputs,
      annualGrossBonus: 10000,
      pensionEnabled: true,
      salarySacrificeIsPercentage: true,
      pensionContributions: { ...baseInputs.pensionContributions, salarySacrifice: 10 },
    };
    const result = calculateTaxes(inputs);

    // 10% of £60,000 = £6,000 sacrificed
    expect(result.pensionPot.total).toBe(6000);
    expect(result.adjustedNetIncome).toBe(54000);
  });

  it('should calculate combined taxes correctly', () => {
    const result = calculateTaxes(baseInputs);

    const expectedCombined = result.incomeTax.total + result.employeeNI.total + result.studentLoanRepayments.total + result.hicbc;
    expect(result.combinedTaxes).toBe(expectedCombined);
  });

  it('should calculate take home pay correctly', () => {
    const result = calculateTaxes(baseInputs);

    // takeHomePay = incomeAfterSalarySacrifice - netPensionDeductions - combinedTaxes, floored at 0
    // With baseInputs (no pension contributions), this simplifies to grossIncome - combinedTaxes
    expect(result.takeHomePay).toBe(result.annualGrossIncome.total - result.combinedTaxes);
  });

  it('should handle Scottish tax rates', () => {
    const inputs: TaxInputs = { ...baseInputs, residentInScotland: true };
    const resultScotland = calculateTaxes(inputs);
    const resultEngland = calculateTaxes(baseInputs);

    // Scottish rates are generally higher for same income
    expect(resultScotland.incomeTax.total).not.toBe(resultEngland.incomeTax.total);
  });

  it('should handle student loan repayments', () => {
    const inputs: TaxInputs = { ...baseInputs, studentLoanEnabled: true, studentLoan: ['plan2'] };
    const result = calculateTaxes(inputs);

    expect(result.studentLoanRepayments.total).toBeGreaterThan(0);
    expect(result.combinedTaxes).toBeGreaterThan(calculateTaxes(baseInputs).combinedTaxes);
  });

  it('should handle child benefits with HICBC in self mode', () => {
    const inputs: TaxInputs = {
      ...baseInputs,
      annualGrossSalary: 70000,
      childBenefits: { mode: 'self', numberOfChildren: 2 },
    };
    const result = calculateTaxes(inputs);

    expect(result.childBenefits.total).toBeCloseTo(2212.60, 2);
    expect(result.hicbc).toBeCloseTo(1106.30, 2);
    expect(result.combinedTaxes).toBe(result.incomeTax.total + result.employeeNI.total + result.studentLoanRepayments.total + result.hicbc);
  });

  it('should handle HICBC in partner mode', () => {
    const inputs: TaxInputs = {
      ...baseInputs,
      annualGrossSalary: 70000,
      childBenefits: { mode: 'partner', numberOfChildren: 2 },
    };
    const result = calculateTaxes(inputs);

    expect(result.childBenefits.total).toBe(0);
    expect(result.hicbc).toBeCloseTo(1106.30, 2);
    expect(result.combinedTaxes).toBe(result.incomeTax.total + result.employeeNI.total + result.studentLoanRepayments.total + result.hicbc);
  });

  it('should include hicbc in combinedTaxes', () => {
    const result = calculateTaxes(baseInputs);
    expect(result.combinedTaxes).toBe(result.incomeTax.total + result.employeeNI.total + result.studentLoanRepayments.total + result.hicbc);
  });

  describe("section toggles", () => {
    it("ignores pension contributions when pensionEnabled is false", () => {
        const result = calculateTaxes({
            ...baseInputs,
            pensionEnabled: false,
            pensionContributions: { autoEnrolment: 5, autoEnrolmentEmployer: 0, salarySacrifice: 5000, personal: 3000 },
        });
        expect(result.pensionPot.total).toBe(0);
    });

    it("includes pension contributions when pensionEnabled is true", () => {
        const result = calculateTaxes({
            ...baseInputs,
            pensionEnabled: true,
            annualGrossSalary: 50000,
            pensionContributions: { autoEnrolment: 5, autoEnrolmentEmployer: 0, salarySacrifice: 5000, personal: 3000 },
        });
        expect(result.pensionPot.total).toBeGreaterThan(0);
    });

    it("ignores student loans when studentLoanEnabled is false", () => {
        const result = calculateTaxes({
            ...baseInputs,
            studentLoanEnabled: false,
            studentLoan: ["plan2" as const],
            annualGrossSalary: 50000,
        });
        expect(result.studentLoanRepayments.total).toBe(0);
    });

    it("includes student loans when studentLoanEnabled is true", () => {
        const result = calculateTaxes({
            ...baseInputs,
            studentLoanEnabled: true,
            studentLoan: ["plan2" as const],
            annualGrossSalary: 50000,
        });
        expect(result.studentLoanRepayments.total).toBeGreaterThan(0);
    });
  });
});
