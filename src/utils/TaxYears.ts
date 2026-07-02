import type { TaxYearsData } from '../types/tax';

export const taxYears: TaxYearsData = {
    '2025/26': {
        childBenefitRates: {
            firstChildRate: 26.05,
            additionalChildRate: 17.25,
        },
        hicbc: { threshold: 60000, taperDivisor: 200 },
        qualifyingEarnings: { lower: 6240, upper: 50270 },
        taxAllowance: {
            basicAllowance: 12570,
            taperThreshold: 100000,
            blindPersonsAllowance: 3130,
        },
        nationalInsurance: {
            lowerEarningsLimit: 6500,
            primaryThreshold: 12570,
            secondaryThreshold: 5000,
            upperEarningsLimit: 50270,
            employerRates: [0.15, 0.15],
            employeeRates: [0.08, 0.02],
        },
        studentLoan: {
            defaultRate: 0.09,
            postgradRate: 0.06,
            thresholds: {
                plan1: 26065,
                plan2: 28470,
                plan4: 31395,
                plan5: 25000,
                postgrad: 21000,
            },
        },
        incomeTax: {
            scotland: [
                [0.19, 2827],
                [0.20, 14921],
                [0.21, 31092],
                [0.42, 62430],
                [0.45, 125140],
                [0.48, Infinity],
            ],
            restOfUK: [
                [0.20, 37700],
                [0.40, 125140],
                [0.45, Infinity],
            ],
        },
    },
    '2024/25': {
        childBenefitRates: {
            firstChildRate: 25.60,
            additionalChildRate: 16.95,
        },
        hicbc: { threshold: 60000, taperDivisor: 200 },
        qualifyingEarnings: { lower: 6240, upper: 50270 },
        taxAllowance: {
            basicAllowance: 12570,
            taperThreshold: 100000,
            blindPersonsAllowance: 3070,
        },
        nationalInsurance: {
            lowerEarningsLimit: 6396,
            primaryThreshold: 12570,
            secondaryThreshold: 9100,
            upperEarningsLimit: 50270,
            employerRates: [0.138, 0.138],
            employeeRates: [0.08, 0.02],
        },
        studentLoan: {
            defaultRate: 0.09,
            postgradRate: 0.06,
            thresholds: {
                plan1: 24990,
                plan2: 27295,
                plan4: 31395,
                plan5: 25000,
                postgrad: 21000,
            },
        },
        incomeTax: {
            scotland: [
                [0.19, 2306],
                [0.20, 13991],
                [0.21, 31092],
                [0.42, 62430],
                [0.45, 125140],
                [0.48, Infinity],
            ],
            restOfUK: [
                [0.20, 37700],
                [0.40, 125140],
                [0.45, Infinity],
            ],
        },
    },
    '2023/24': {
        childBenefitRates: {
            firstChildRate: 24.00,
            additionalChildRate: 15.90,
        },
        hicbc: { threshold: 50000, taperDivisor: 100 },
        qualifyingEarnings: { lower: 6240, upper: 50270 },
        taxAllowance: {
            basicAllowance: 12570,
            taperThreshold: 100000,
            blindPersonsAllowance: 2870,
        },
        nationalInsurance: {
            lowerEarningsLimit: 6396,
            primaryThreshold: 12570,
            secondaryThreshold: 9100,
            upperEarningsLimit: 50270,
            employerRates: [0.138, 0.138],
            employeeRates: [0.12, 0.02],
        },
        studentLoan: {
            defaultRate: 0.09,
            postgradRate: 0.06,
            thresholds: {
                plan1: 22015,
                plan2: 27295,
                plan4: 27660,
                plan5: 25000,
                postgrad: 21000,
            },
        },
        incomeTax: {
            scotland: [
                [0.19, 2162],
                [0.20, 13118],
                [0.21, 31092],
                [0.42, 125140],
                [0.47, Infinity],
            ],
            restOfUK: [
                [0.20, 37700],
                [0.40, 125140],
                [0.45, Infinity],
            ],
        },
    },
    '2022/23': {
        childBenefitRates: {
            firstChildRate: 21.80,
            additionalChildRate: 14.45,
        },
        hicbc: { threshold: 50000, taperDivisor: 100 },
        qualifyingEarnings: { lower: 6240, upper: 50270 },
        taxAllowance: {
            basicAllowance: 12570,
            taperThreshold: 100000,
            blindPersonsAllowance: 2600,
        },
        // NI for 2022/23 will just be an estimate, due to the varying rates and thresholds
        nationalInsurance: {
            lowerEarningsLimit: 6396,
            primaryThreshold: 11904.89, // effective primary threshold
            secondaryThreshold: 9100,
            upperEarningsLimit: 50270,
            employerRates: [0.145314, 0.145314], // effective employer rates
            employeeRates: [0.127314, 0.027314], // effective employee rates
        },
        studentLoan: {
            defaultRate: 0.09,
            postgradRate: 0.06,
            thresholds: {
                plan1: 19895,
                plan2: 27295,
                plan4: 25000,
                plan5: Infinity,
                postgrad: 21000,
            },
        },
        incomeTax: {
            scotland: [
                [0.19, 2162],
                [0.20, 13118],
                [0.21, 31092],
                [0.41, 150000],
                [0.46, Infinity],
            ],
            restOfUK: [
                [0.20, 37700],
                [0.40, 150000],
                [0.45, Infinity],
            ],
        },
    },
    '2021/22': {
        childBenefitRates: {
            firstChildRate: 21.15,
            additionalChildRate: 14.00,
        },
        hicbc: { threshold: 50000, taperDivisor: 100 },
        qualifyingEarnings: { lower: 6240, upper: 50270 },
        taxAllowance: {
            basicAllowance: 12570,
            taperThreshold: 100000,
            blindPersonsAllowance: 2520,
        },
        nationalInsurance: {
            lowerEarningsLimit: 6240,
            primaryThreshold: 9568,
            secondaryThreshold: 8840,
            upperEarningsLimit: 50270,
            employerRates: [0.138, 0.138],
            employeeRates: [0.12, 0.02],
        },
        studentLoan: {
            defaultRate: 0.09,
            postgradRate: 0.06,
            thresholds: {
                plan1: 19895,
                plan2: 27295,
                plan4: 25000,
                plan5: Infinity,
                postgrad: 21000,
            },
        },
        incomeTax: {
            scotland: [
                [0.19, 2097],
                [0.20, 12726],
                [0.21, 31092],
                [0.41, 150000],
                [0.46, Infinity],
            ],
            restOfUK: [
                [0.20, 37700],
                [0.40, 150000],
                [0.45, Infinity],
            ],
        },
    },
    '2020/21': {
        childBenefitRates: {
            firstChildRate: 21.05,
            additionalChildRate: 13.95,
        },
        hicbc: { threshold: 50000, taperDivisor: 100 },
        qualifyingEarnings: { lower: 6240, upper: 50270 },
        taxAllowance: {
            basicAllowance: 12500,
            taperThreshold: 100000,
            blindPersonsAllowance: 2500,
        },
        nationalInsurance: {
            lowerEarningsLimit: 6240,
            primaryThreshold: 9500,
            secondaryThreshold: 8788,
            upperEarningsLimit: 50000,
            employerRates: [0.138, 0.138],
            employeeRates: [0.12, 0.02],
        },
        studentLoan: {
            defaultRate: 0.09,
            postgradRate: 0.06,
            thresholds: {
                plan1: 19390,
                plan2: 26575,
                plan4: Infinity,
                plan5: Infinity,
                postgrad: 21000,
            },
        },
        incomeTax: {
            scotland: [
                [0.19, 2085],
                [0.20, 12658],
                [0.21, 30930],
                [0.41, 150000],
                [0.46, Infinity],
            ],
            restOfUK: [
                [0.20, 37500],
                [0.40, 150000],
                [0.45, Infinity],
            ],
        },
    },
    '2019/20': {
        childBenefitRates: {
            firstChildRate: 20.70,
            additionalChildRate: 13.70,
        },
        hicbc: { threshold: 50000, taperDivisor: 100 },
        qualifyingEarnings: { lower: 6136, upper: 50000 },
        taxAllowance: {
            basicAllowance: 12500,
            taperThreshold: 100000,
            blindPersonsAllowance: 2450,
        },
        nationalInsurance: {
            lowerEarningsLimit: 6136,
            primaryThreshold: 8632,
            secondaryThreshold: 8632,
            upperEarningsLimit: 50000,
            employerRates: [0.138, 0.138],
            employeeRates: [0.12, 0.02],
        },
        studentLoan: {
            defaultRate: 0.09,
            postgradRate: 0.06,
            thresholds: {
                plan1: 18935,
                plan2: 25725,
                plan4: Infinity,
                plan5: Infinity,
                postgrad: 21000,
            },
        },
        incomeTax: {
            scotland: [
                [0.19, 2049],
                [0.20, 12444],
                [0.21, 30930],
                [0.41, 150000],
                [0.46, Infinity],
            ],
            restOfUK: [
                [0.20, 37500],
                [0.40, 150000],
                [0.45, Infinity],
            ],
        },
    },
    '2018/19': {
        childBenefitRates: {
            firstChildRate: 20.70,
            additionalChildRate: 13.70,
        },
        hicbc: { threshold: 50000, taperDivisor: 100 },
        qualifyingEarnings: { lower: 6032, upper: 46350 },
        taxAllowance: {
            basicAllowance: 11850,
            taperThreshold: 100000,
            blindPersonsAllowance: 2390,
        },
        nationalInsurance: {
            lowerEarningsLimit: 6032,
            primaryThreshold: 8424,
            secondaryThreshold: 8424,
            upperEarningsLimit: 46350,
            employerRates: [0.138, 0.138],
            employeeRates: [0.12, 0.02],
        },
        studentLoan: {
            defaultRate: 0.09,
            postgradRate: 0.06,
            thresholds: {
                plan1: 18330,
                plan2: 25000,
                plan4: Infinity,
                plan5: Infinity,
                postgrad: Infinity,
            },
        },
        incomeTax: {
            scotland: [
                [0.19, 2000],
                [0.20, 12150],
                [0.21, 31580],
                [0.41, 150000],
                [0.46, Infinity],
            ],
            restOfUK: [
                [0.20, 34500],
                [0.40, 150000],
                [0.45, Infinity],
            ],
        },
    },
    '2017/18': {
        childBenefitRates: {
            firstChildRate: 20.70,
            additionalChildRate: 13.70,
        },
        hicbc: { threshold: 50000, taperDivisor: 100 },
        qualifyingEarnings: { lower: 5876, upper: 45000 },
        taxAllowance: {
            basicAllowance: 11500,
            taperThreshold: 100000,
            blindPersonsAllowance: 2320,
        },
        nationalInsurance: {
            lowerEarningsLimit: 5876,
            primaryThreshold: 8164,
            secondaryThreshold: 8164,
            upperEarningsLimit: 45000,
            employerRates: [0.138, 0.138],
            employeeRates: [0.12, 0.02],
        },
        studentLoan: {
            defaultRate: 0.09,
            postgradRate: 0.06,
            thresholds: {
                plan1: 17775,
                plan2: 21000,
                plan4: Infinity,
                plan5: Infinity,
                postgrad: Infinity,
            },
        },
        incomeTax: {
            scotland: [
                [0.20, 31500],
                [0.40, 150000],
                [0.45, Infinity],
            ],
            restOfUK: [
                [0.20, 33500],
                [0.40, 150000],
                [0.45, Infinity],
            ],
        },
    },
};
