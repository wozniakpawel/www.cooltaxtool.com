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

// Top-level function to calculate taxes
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

    // Calculate auto enrolment pension contributions
    const autoEnrolmentContribution = incomeAfterSalarySacrifice * (pensionContributions.autoEnrolment / 100);

    // Employer auto enrolment contribution: paid by the employer on top of pay,
    // so it goes into the pension pot without affecting the employee's income or taxes
    const autoEnrolmentEmployerContribution = incomeAfterSalarySacrifice * (pensionContributions.autoEnrolmentEmployer / 100);

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

    // Calculate adjusted net income (employer contributions never came out of your income)
    const adjustedNetIncome = Math.max(0, annualGrossIncome.total - (pensionPot.total - autoEnrolmentEmployerContribution));

    // Calculate employee national insurance contributions
    const employeeNI = calculateNationalInsurance(incomeAfterSalarySacrifice, constants, false, inputs.noNI);

    // Calculate employer national insurance contributions
    const employerNI = calculateNationalInsurance(incomeAfterSalarySacrifice, constants, true, inputs.noNI);

    // Calculate student loan repayments
    const studentLoanRepayments = calculateStudentLoanRepayments(incomeAfterSalarySacrifice, studentLoan, constants);

    // Determine the tax allowance (considering personal allowance taper and blind person's allowance)
    const taxAllowance = calculateTaxAllowance(adjustedNetIncome, inputs.blind, constants);

    // Calculate taxable income
    const taxableIncome = Math.max(0, adjustedNetIncome - taxAllowance.total);

    // Calculate income tax
    const incomeTax = calculateIncomeTax(taxableIncome, constants, inputs.residentInScotland);

    // Calculate child benefits and HICBC
    const childBenefitsResult = calculateChildBenefits(adjustedNetIncome, inputs.childBenefits, constants.childBenefitRates, constants.hicbc);

    // Calculate combined taxes (including HICBC)
    const combinedTaxes = incomeTax.total + employeeNI.total + studentLoanRepayments.total + childBenefitsResult.hicbc;

    // Calculate how much you actually keep
    // Pension amounts the employee pays out of remaining income (not already deducted via salary sacrifice)
    const netPensionDeductions =
        (autoEnrolmentAsSalarySacrifice ? 0 : autoEnrolmentContribution)
        + pensionContributions.personal;

    const takeHomePay = Math.max(0, incomeAfterSalarySacrifice - netPensionDeductions - combinedTaxes);
    const yourMoney = pensionPot.total + takeHomePay + childBenefitsResult.childBenefits.total;

    return {
        annualGrossIncome,
        adjustedNetIncome,
        taxAllowance,
        taxableIncome,
        incomeTax,
        employeeNI,
        employerNI,
        studentLoanRepayments,
        combinedTaxes,
        hicbc: childBenefitsResult.hicbc,
        childBenefits: childBenefitsResult.childBenefits,
        takeHomePay,
        pensionPot,
        yourMoney,
    };
}
