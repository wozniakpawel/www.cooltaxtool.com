import { taxYears } from './TaxYears';
import { studentLoanOptions } from './studentLoanOptions';
import type {
    TaxYearConstants,
    TaxInputs,
    CalculationResult,
    TaxCalculationResult,
    BreakdownItem,
    StudentLoanPlan,
    ChildBenefitsInput,
    ChildBenefitRates,
    HICBCConstants,
    PensionAnnualAllowanceConstants,
    PensionAllowanceResult,
} from '../types/tax';

// Gross Income = Salary + Bonuses + Other Income (Dividends, Rental Income, etc.)
export function calculateAnnualGrossIncome(
    annualGrossSalary: number,
    annualGrossBonus: number
): CalculationResult {
    return {
        total: annualGrossSalary + annualGrossBonus,
        breakdown: [
            { rate: "Annual Gross Salary", amount: annualGrossSalary },
            { rate: "Annual Gross Bonus", amount: annualGrossBonus },
        ]
    };
}

// Tax Allowance = Personal Allowance (tapered) + Blind Person's Allowance
export function calculateTaxAllowance(
    income: number,
    isBlind: boolean,
    constants: TaxYearConstants
): CalculationResult {
    const {
        basicAllowance,
        taperThreshold,
        blindPersonsAllowance,
    } = constants.taxAllowance;

    const breakdown: BreakdownItem[] = [];
    const taperRate = 0.5;

    let personalAllowance = basicAllowance;
    if (income > taperThreshold) {
        const reduction = Math.floor((income - taperThreshold) * taperRate);
        personalAllowance = Math.max(0, basicAllowance - reduction);
    }
    breakdown.push({ rate: "Personal Allowance", amount: personalAllowance });

    let blindAllowance = 0;
    if (isBlind) {
        blindAllowance = blindPersonsAllowance;
        breakdown.push({ rate: "Blind Person's Allowance", amount: blindAllowance });
    }

    const total = personalAllowance + blindAllowance;
    return { total, breakdown };
}

// Calculate income tax
export function calculateIncomeTax(
    taxableIncome: number,
    constants: TaxYearConstants,
    residentInScotland: boolean
): CalculationResult {
    const taxBands = residentInScotland ? constants.incomeTax.scotland : constants.incomeTax.restOfUK;

    let incomeTax = 0;
    let remainingIncome = taxableIncome;
    const incomeTaxBreakdown: BreakdownItem[] = [];

    let previousLimit = 0;

    taxBands.forEach(([currentRate, currentLimit]) => {
        if (remainingIncome > 0) {
            const range = currentLimit - previousLimit;
            const taxableAtCurrentRate = Math.min(remainingIncome, range);
            const taxAtCurrentRate = taxableAtCurrentRate * currentRate;
            incomeTax += taxAtCurrentRate;
            remainingIncome -= taxableAtCurrentRate;
            incomeTaxBreakdown.push({ rate: currentRate, amount: taxAtCurrentRate });
            previousLimit = currentLimit;
        }
    });

    return { total: incomeTax, breakdown: incomeTaxBreakdown };
}

// Calculate national insurance contributions (employee and employer)
export function calculateNationalInsurance(
    income: number,
    constants: TaxYearConstants,
    employer: boolean,
    noNI: boolean
): CalculationResult {
    if (noNI) return { total: 0, breakdown: [] };

    const { primaryThreshold, secondaryThreshold, upperEarningsLimit, employeeRates, employerRates } = constants.nationalInsurance;
    const firstThreshold = employer ? secondaryThreshold : primaryThreshold;
    const rates = employer ? employerRates : employeeRates;

    let remainingIncome = Math.max(0, income - firstThreshold);
    let nationalInsuranceTotal = 0;
    const nationalInsuranceBreakdown: BreakdownItem[] = [];

    if (remainingIncome > 0) {
        const incomeInFirstBand = Math.min(remainingIncome, upperEarningsLimit - firstThreshold);
        if (incomeInFirstBand > 0) {
            const niInFirstBand = incomeInFirstBand * rates[0];
            nationalInsuranceTotal += niInFirstBand;
            remainingIncome -= incomeInFirstBand;
            nationalInsuranceBreakdown.push({ rate: rates[0], amount: niInFirstBand });
        }
    }

    if (remainingIncome > 0) {
        const niInSecondBand = remainingIncome * rates[1];
        nationalInsuranceTotal += niInSecondBand;
        nationalInsuranceBreakdown.push({ rate: rates[1], amount: niInSecondBand });
    }

    return {
        total: nationalInsuranceTotal,
        breakdown: nationalInsuranceBreakdown,
    };
}

// Self-employed National Insurance: Class 2 flat weekly rate when profits are
// above the small profits threshold (0 from 2024/25 when Class 2 was abolished),
// plus Class 4 on profits between the lower and upper limits and above.
export function calculateSelfEmployedNI(
    profits: number,
    constants: TaxYearConstants,
    noNI: boolean
): CalculationResult {
    if (noNI) return { total: 0, breakdown: [] };

    const { class2WeeklyRate, class2SmallProfitsThreshold, class4LowerLimit, class4UpperLimit, class4Rates } = constants.selfEmployedNI;

    let total = 0;
    const breakdown: BreakdownItem[] = [];

    if (class2WeeklyRate > 0 && profits > class2SmallProfitsThreshold) {
        const class2 = class2WeeklyRate * 52;
        total += class2;
        breakdown.push({ rate: "Class 2", amount: class2 });
    }

    const inFirstBand = Math.min(Math.max(0, profits - class4LowerLimit), class4UpperLimit - class4LowerLimit);
    if (inFirstBand > 0) {
        const ni = inFirstBand * class4Rates[0];
        total += ni;
        breakdown.push({ rate: class4Rates[0], amount: ni });
    }

    const aboveUpper = Math.max(0, profits - class4UpperLimit);
    if (aboveUpper > 0) {
        const ni = aboveUpper * class4Rates[1];
        total += ni;
        breakdown.push({ rate: class4Rates[1], amount: ni });
    }

    return { total, breakdown };
}

// Calculate student loan repayments
export function calculateStudentLoanRepayments(
    income: number,
    studentLoanPlans: StudentLoanPlan[],
    constants: TaxYearConstants
): CalculationResult {
    const { defaultRate, postgradRate, thresholds } = constants.studentLoan;
    let total = 0;
    let nonPostgradTotal = 0;
    const breakdown: BreakdownItem[] = [];

    if (studentLoanPlans.length === 0) {
        return {
            total,
            breakdown,
        };
    }

    // Filter postgraduate plan and sort the rest in ascending order of thresholds
    const nonPostgradPlans = studentLoanPlans
        .filter((plan): plan is Exclude<StudentLoanPlan, 'postgrad'> => plan !== "postgrad")
        .sort((a, b) => thresholds[a] - thresholds[b]);

    // Calculate repayments for non-postgraduate plans
    // If you selected multiple non-postgraduate plans,
    // you will still pay the same you would with only one non-postgraduate plan
    // but the payments will be split between the plans based on their thresholds
    nonPostgradPlans.forEach((plan, index) => {
        const option = studentLoanOptions.find(option => option.plan === plan);
        let amount: number;

        if (index === nonPostgradPlans.length - 1) {
            amount = (income <= thresholds[plan]) ? 0 : ((income - thresholds[plan]) * defaultRate);
        } else {
            amount = (income <= thresholds[plan]) ? 0 : ((Math.min(income, thresholds[nonPostgradPlans[index + 1]]) - thresholds[plan]) * defaultRate);
        }

        nonPostgradTotal += amount;
        breakdown.push({ rate: option?.label ?? plan, amount });
    });

    // round down the total amount for non-postgrad plans and adjust the last plan
    // Loop backward through the breakdown array (from the last non-postgrad plan to the first one)
    // until you finds a plan with an amount greater than 0. Then, try to deduct the adjustment
    // from this amount. If the adjustment is greater than the amount, deduct the whole amount
    // from the adjustment and set the amount to 0. Then, continue to the previous plan.
    // Carry on until the adjustment has been completely deducted or all the plans have been processed.
    let adjustment = nonPostgradTotal - Math.floor(nonPostgradTotal);
    for (let i = breakdown.length - 1; i >= 0; i--) {
        if (breakdown[i].amount > 0) {
            if (breakdown[i].amount >= adjustment) {
                breakdown[i].amount -= adjustment;
                nonPostgradTotal -= adjustment;
                adjustment = 0;
                break;
            } else {
                adjustment -= breakdown[i].amount;
                nonPostgradTotal -= breakdown[i].amount;
                breakdown[i].amount = 0;
            }
        }
    }

    total += Math.floor(nonPostgradTotal);

    // Calculate repayments for postgraduate plan
    // Postgraduate plan repayments are paid on top of all the other plans
    if (studentLoanPlans.includes("postgrad")) {
        const option = studentLoanOptions.find(option => option.plan === "postgrad");
        const amount = (income <= thresholds["postgrad"]) ? 0 : Math.floor((income - thresholds["postgrad"]) * postgradRate);
        total += amount;
        breakdown.push({ rate: option?.label ?? "Postgraduate", amount });
    }

    return {
        total,
        breakdown,
    };
}

// Monthly (per-pay-period) National Insurance, as PAYE actually charges it:
// the annual thresholds are divided by 12 and applied to each month's pay in
// isolation, so an uneven month (e.g. a bonus) changes what you actually pay
// compared to an annual-basis estimate.
export function calculateMonthlyNI(
    monthlyPay: number,
    constants: TaxYearConstants,
    employer: boolean,
    noNI: boolean
): CalculationResult {
    if (noNI) return { total: 0, breakdown: [] };

    const { primaryThreshold, secondaryThreshold, upperEarningsLimit, employeeRates, employerRates } = constants.nationalInsurance;
    const firstThreshold = (employer ? secondaryThreshold : primaryThreshold) / 12;
    const upperLimit = upperEarningsLimit / 12;
    const rates = employer ? employerRates : employeeRates;

    let remaining = Math.max(0, monthlyPay - firstThreshold);
    let total = 0;
    const breakdown: BreakdownItem[] = [];

    const inFirstBand = Math.min(remaining, upperLimit - firstThreshold);
    if (inFirstBand > 0) {
        const ni = inFirstBand * rates[0];
        total += ni;
        remaining -= inFirstBand;
        breakdown.push({ rate: rates[0], amount: ni });
    }
    if (remaining > 0) {
        const ni = remaining * rates[1];
        total += ni;
        breakdown.push({ rate: rates[1], amount: ni });
    }

    return { total, breakdown };
}

// Monthly (per-pay-period) student loan repayments: annual thresholds divided
// by 12, each month's repayment floored to the pound, matching payroll practice
export function calculateMonthlySL(
    monthlyPay: number,
    studentLoanPlans: StudentLoanPlan[],
    constants: TaxYearConstants
): CalculationResult {
    const { defaultRate, postgradRate, thresholds } = constants.studentLoan;
    let total = 0;
    const breakdown: BreakdownItem[] = [];

    if (studentLoanPlans.length === 0) return { total, breakdown };

    const nonPostgradPlans = studentLoanPlans
        .filter((plan): plan is Exclude<StudentLoanPlan, 'postgrad'> => plan !== "postgrad")
        .sort((a, b) => thresholds[a] - thresholds[b]);

    // Repayments are based on the plan with the lowest threshold, same as annually
    if (nonPostgradPlans.length > 0) {
        const plan = nonPostgradPlans[0];
        const monthlyThreshold = thresholds[plan] / 12;
        const amount = monthlyPay <= monthlyThreshold ? 0 : Math.floor((monthlyPay - monthlyThreshold) * defaultRate);
        total += amount;
        const option = studentLoanOptions.find(option => option.plan === plan);
        breakdown.push({ rate: option?.label ?? plan, amount });
    }

    if (studentLoanPlans.includes("postgrad")) {
        const monthlyThreshold = thresholds["postgrad"] / 12;
        const amount = monthlyPay <= monthlyThreshold ? 0 : Math.floor((monthlyPay - monthlyThreshold) * postgradRate);
        total += amount;
        const option = studentLoanOptions.find(option => option.plan === "postgrad");
        breakdown.push({ rate: option?.label ?? "Postgraduate", amount });
    }

    return { total, breakdown };
}

export interface ChildBenefitsResult {
    childBenefits: CalculationResult;
    hicbc: number;
}

export function calculateChildBenefits(
    adjustedNetIncome: number,
    childBenefits: ChildBenefitsInput,
    childBenefitRates: ChildBenefitRates,
    hicbc: HICBCConstants
): ChildBenefitsResult {
    const { firstChildRate, additionalChildRate } = childBenefitRates;

    if (childBenefits.mode === 'off') {
        return {
            childBenefits: { total: 0, breakdown: [] },
            hicbc: 0,
        };
    }

    const firstChildAmount = firstChildRate * 52;
    const additionalChildrenAmount = (childBenefits.numberOfChildren - 1) * additionalChildRate * 52;
    const childBenefitAmount = firstChildAmount + additionalChildrenAmount;

    let hicbcCharge = 0;
    if (adjustedNetIncome > hicbc.threshold) {
        const incomeExcess = adjustedNetIncome - hicbc.threshold;
        const chargePercentage = Math.min(100, Math.floor(incomeExcess / hicbc.taperDivisor));
        hicbcCharge = (childBenefitAmount * chargePercentage) / 100;
    }

    const showBenefits = childBenefits.mode === 'self';

    return {
        childBenefits: {
            total: showBenefits ? childBenefitAmount : 0,
            breakdown: showBenefits ? [
                { rate: "Child Benefits", amount: childBenefitAmount },
            ] : [],
        },
        hicbc: hicbcCharge,
    };
}

// Calculate personal pension contribution value, depending if the tax is relieved at source.
// Non-taxpayers (income <= basicAllowance) only get relief on the first £2,880 per HMRC rules.
const LOW_INCOME_RELIEF_CAP = 2880;

export function grossManualPensionContributions(
    personalContribution: number,
    taxReliefAtSource: boolean,
    annualGrossIncome: number,
    basicAllowance: number
): number {
    if (!taxReliefAtSource) return personalContribution;

    if (annualGrossIncome > basicAllowance) {
        return personalContribution * 1.25;
    }

    const relieved = Math.min(personalContribution, LOW_INCOME_RELIEF_CAP);
    const unrelieved = Math.max(0, personalContribution - LOW_INCOME_RELIEF_CAP);
    return relieved * 1.25 + unrelieved;
}

// Dividend tax. Dividends stack on top of non-dividend taxable income and are
// taxed at the dividend rates of whichever band they fall into. Band boundaries
// are always the rest-of-UK income tax bands — Scottish rates do not apply to
// dividends. The dividend allowance taxes the first slice at 0% but still
// consumes band space. There is no NI on dividends.
export function calculateDividendTax(
    dividends: number,
    nonDividendTaxableIncome: number,
    personalAllowanceRemaining: number,
    constants: TaxYearConstants
): CalculationResult {
    const taxableDividends = Math.max(0, dividends - personalAllowanceRemaining);
    if (taxableDividends <= 0) {
        return { total: 0, breakdown: [] };
    }

    const bands = constants.incomeTax.restOfUK;
    const { allowance, rates } = constants.dividends;

    const breakdown: BreakdownItem[] = [];
    const allowanceUsed = Math.min(allowance, taxableDividends);
    if (allowanceUsed > 0) {
        breakdown.push({ rate: "Dividend Allowance (0%)", amount: 0 });
    }

    let position = nonDividendTaxableIncome;
    let allowanceLeft = allowanceUsed;
    let taxableLeft = taxableDividends - allowanceUsed;
    let total = 0;

    for (let i = 0; i < bands.length && (allowanceLeft > 0 || taxableLeft > 0); i++) {
        const [, limit] = bands[i];
        if (position >= limit) continue;

        let capacity = limit - position;

        const allowanceHere = Math.min(allowanceLeft, capacity);
        allowanceLeft -= allowanceHere;
        position += allowanceHere;
        capacity -= allowanceHere;

        const taxedHere = Math.min(taxableLeft, capacity);
        if (taxedHere > 0) {
            const taxAtRate = taxedHere * rates[i];
            total += taxAtRate;
            breakdown.push({ rate: rates[i], amount: taxAtRate });
            taxableLeft -= taxedHere;
            position += taxedHere;
        }
    }

    return { total, breakdown };
}

// Pension annual allowance, tapered for high earners: reduced by £1 for every
// £2 of adjusted income over the limit (only when threshold income is also over
// its limit), down to the minimum. Carry-forward and the MPAA are not modelled.
export function calculatePensionAnnualAllowance(
    thresholdIncome: number,
    adjustedIncome: number,
    constants: PensionAnnualAllowanceConstants
): number {
    const { standard, taperThresholdIncome, taperAdjustedIncome, minimum } = constants;
    if (thresholdIncome <= taperThresholdIncome || adjustedIncome <= taperAdjustedIncome) {
        return standard;
    }
    const reduction = Math.floor((adjustedIncome - taperAdjustedIncome) / 2);
    return Math.max(minimum, standard - reduction);
}

// Top-level function to calculate taxes.
//
// Naming convention, mapped to ONS/HMRC terminology:
// - annualGrossIncome ≈ gross earnings: remuneration from employment (salary +
//   bonus) before any deductions. Will diverge from "income" once other income
//   sources (dividends, rental) are added.
// - adjustedNetIncome = adjusted net income per HMRC: gross income minus the
//   gross pension contributions paid by the individual (employer contributions
//   never count). Used for the personal allowance taper and HICBC.
// - takeHomePay = gross earnings minus employee deductions (Income Tax,
//   employee NI, student loan, pension contributions) — ONS "take-home pay".
// - totalYouKeep = takeHomePay + pension pot + child benefit. No ONS
//   equivalent; tool-specific measure of the full value received.
export function calculateTaxes(inputs: TaxInputs): TaxCalculationResult {
    const constants = taxYears[inputs.taxYear];
    if (!constants) {
        throw new Error(`Unsupported tax year: "${inputs.taxYear}". Available: ${Object.keys(taxYears).join(', ')}`);
    }

    const pensionContributions = inputs.pensionEnabled
        ? inputs.pensionContributions
        : { autoEnrolment: 0, autoEnrolmentEmployer: 0, salarySacrifice: 0, personal: 0 };
    const autoEnrolmentAsSalarySacrifice = inputs.pensionEnabled
        ? inputs.autoEnrolmentAsSalarySacrifice
        : true;
    const taxReliefAtSource = inputs.pensionEnabled
        ? inputs.taxReliefAtSource
        : true;
    const studentLoan = inputs.studentLoanEnabled
        ? inputs.studentLoan
        : [];

    const annualGrossIncome = calculateAnnualGrossIncome(inputs.annualGrossSalary, inputs.annualGrossBonus);

    // Resolve salary sacrifice to a £ amount (it can be entered as a % of gross income)
    const salarySacrificeAmount = inputs.salarySacrificeIsPercentage
        ? annualGrossIncome.total * (Math.min(100, pensionContributions.salarySacrifice) / 100)
        : pensionContributions.salarySacrifice;

    // Apply salary sacrifice
    let incomeAfterSalarySacrifice = Math.max(0, annualGrossIncome.total - salarySacrificeAmount);

    // Auto enrolment earnings base: by law contributions are due on the qualifying
    // earnings band, but many schemes contribute on full pay instead
    const { lower: qeLower, upper: qeUpper } = constants.qualifyingEarnings;
    const autoEnrolmentBase = inputs.autoEnrolmentOnQualifyingEarnings
        ? Math.min(Math.max(0, incomeAfterSalarySacrifice - qeLower), qeUpper - qeLower)
        : incomeAfterSalarySacrifice;

    // Calculate auto enrolment pension contributions
    const autoEnrolmentContribution = autoEnrolmentBase * (pensionContributions.autoEnrolment / 100);

    // Employer auto enrolment contribution: paid by the employer on top of pay,
    // so it goes into the pension pot without affecting the employee's income or taxes
    const autoEnrolmentEmployerContribution = autoEnrolmentBase * (pensionContributions.autoEnrolmentEmployer / 100);

    // Deduct auto enrolment contributions from gross income, but only if they are salary sacrificed
    if (autoEnrolmentAsSalarySacrifice)
        incomeAfterSalarySacrifice -= autoEnrolmentContribution;

    // Calculate personal pension contribution (with tax relief at source)
    const grossedPersonalContribution = grossManualPensionContributions(
        pensionContributions.personal,
        taxReliefAtSource,
        annualGrossIncome.total,
        constants.taxAllowance.basicAllowance
    );

    // Calculate how much you will have in your pension pot at the end of the tax year
    const pensionPot: CalculationResult = {
        total: salarySacrificeAmount + autoEnrolmentContribution + autoEnrolmentEmployerContribution + grossedPersonalContribution,
        breakdown: [
            { rate: "Salary sacrifice", amount: salarySacrificeAmount },
            { rate: "Auto enrolment (you)", amount: autoEnrolmentContribution },
            { rate: "Auto enrolment (employer)", amount: autoEnrolmentEmployerContribution },
            { rate: "Gross Personal", amount: grossedPersonalContribution },
        ],
    };

    const dividends = inputs.annualGrossDividends;

    // Calculate adjusted net income (employer contributions never came out of
    // your income). Dividends count towards ANI, which drives the personal
    // allowance taper and HICBC.
    const individualPensionContributions = pensionPot.total - autoEnrolmentEmployerContribution;
    const adjustedNetIncome = Math.max(0, annualGrossIncome.total + dividends - individualPensionContributions);

    // Split ANI into its earnings part and its dividend part: pension deductions
    // shelter earnings first, and any excess shelters dividends
    const nonDividendANI = Math.min(adjustedNetIncome, Math.max(0, annualGrossIncome.total - individualPensionContributions));
    const dividendANI = adjustedNetIncome - nonDividendANI;

    // National insurance: the self-employed pay Class 2/4 on profits instead of
    // Class 1, and there is no employer NI
    const employeeNI = inputs.selfEmployed
        ? calculateSelfEmployedNI(incomeAfterSalarySacrifice, constants, inputs.noNI)
        : calculateNationalInsurance(incomeAfterSalarySacrifice, constants, false, inputs.noNI);

    const employerNI = inputs.selfEmployed
        ? { total: 0, breakdown: [] as BreakdownItem[] }
        : calculateNationalInsurance(incomeAfterSalarySacrifice, constants, true, inputs.noNI);

    // Some employers pass the NI they save on sacrificed salary into the pension
    // (never applies to the self-employed — there is no employer NI to save)
    let employerNISaving = 0;
    if (inputs.pensionEnabled && inputs.employerNISavingsToPension && !inputs.selfEmployed) {
        const employerNIWithoutSacrifice = calculateNationalInsurance(annualGrossIncome.total, constants, true, inputs.noNI);
        employerNISaving = employerNIWithoutSacrifice.total - employerNI.total;
        pensionPot.total += employerNISaving;
        pensionPot.breakdown.push({ rate: "Employer NI saving", amount: employerNISaving });
    }

    // Calculate student loan repayments
    const studentLoanRepayments = calculateStudentLoanRepayments(incomeAfterSalarySacrifice, studentLoan, constants);

    // Determine the tax allowance (considering personal allowance taper and blind person's allowance)
    const taxAllowance = calculateTaxAllowance(adjustedNetIncome, inputs.blind, constants);

    // Calculate taxable income (earnings only — dividends are taxed separately)
    const taxableIncome = Math.max(0, nonDividendANI - taxAllowance.total);

    // Calculate income tax
    const incomeTax = calculateIncomeTax(taxableIncome, constants, inputs.residentInScotland);

    // Any personal allowance not used by earnings shelters dividends
    const allowanceRemainingForDividends = Math.max(0, taxAllowance.total - nonDividendANI);
    const dividendTax = calculateDividendTax(dividendANI, taxableIncome, allowanceRemainingForDividends, constants);

    // Calculate child benefits and HICBC
    const childBenefitsResult = calculateChildBenefits(adjustedNetIncome, inputs.childBenefits, constants.childBenefitRates, constants.hicbc);

    // Calculate combined taxes (including HICBC)
    const combinedTaxes = incomeTax.total + dividendTax.total + employeeNI.total + studentLoanRepayments.total + childBenefitsResult.hicbc;

    // Calculate how much you actually keep
    // Pension amounts the employee pays out of remaining income (not already deducted via salary sacrifice)
    const netPensionDeductions =
        (autoEnrolmentAsSalarySacrifice ? 0 : autoEnrolmentContribution)
        + pensionContributions.personal;

    // Dividends land in your pocket too; combinedTaxes already includes the
    // dividend tax, so adding gross dividends here nets them off correctly
    const takeHomePay = Math.max(0, incomeAfterSalarySacrifice + dividends - netPensionDeductions - combinedTaxes);
    const totalYouKeep = pensionPot.total + takeHomePay + childBenefitsResult.childBenefits.total;

    // Pension annual allowance check.
    // Threshold income: income net of gross personal contributions (salary
    // sacrificed after July 2015 must be added back, so sacrifice is not deducted).
    // Adjusted income: income plus all employer pension contributions.
    const thresholdIncome = Math.max(0, annualGrossIncome.total + dividends - grossedPersonalContribution);
    const adjustedIncome = annualGrossIncome.total + dividends + autoEnrolmentEmployerContribution + employerNISaving;
    const allowance = calculatePensionAnnualAllowance(thresholdIncome, adjustedIncome, constants.pensionAnnualAllowance);
    const pensionAnnualAllowance: PensionAllowanceResult = {
        allowance,
        used: pensionPot.total,
        tapered: allowance < constants.pensionAnnualAllowance.standard,
        exceeded: pensionPot.total > allowance,
    };

    return {
        annualGrossIncome,
        adjustedNetIncome,
        taxAllowance,
        taxableIncome,
        incomeTax,
        dividendTax,
        employeeNI,
        employerNI,
        studentLoanRepayments,
        combinedTaxes,
        hicbc: childBenefitsResult.hicbc,
        childBenefits: childBenefitsResult.childBenefits,
        takeHomePay,
        pensionPot,
        pensionAnnualAllowance,
        totalYouKeep,
    };
}
