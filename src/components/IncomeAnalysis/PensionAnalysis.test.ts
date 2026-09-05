import { describe, expect, it } from 'vitest';
import { personalPensionSweep } from './PensionAnalysis';
import { defaultInputs } from '../../utils/defaultInputs';

describe('personal pension comparison', () => {
  it('includes provider relief even when the main pension switch is off', () => {
    const data = personalPensionSweep({ ...defaultInputs, annualGrossSalary: 40000 });
    const payment = data.find((d) => d.payment === 800)!;
    expect(payment.relief).toBeCloseTo(200, 2);
    expect(payment.reliefPercent).toBeCloseTo(25, 2);
    expect(data[0].reliefPercent).toBeNull();
  });

  it('includes higher-rate relief without counting the provider top-up twice', () => {
    const data = personalPensionSweep({ ...defaultInputs, annualGrossSalary: 60000 });
    const payment = data.find((d) => d.payment === 1200)!;
    expect(payment.relief).toBeCloseTo(600, 2);
    expect(payment.reliefPercent).toBeCloseTo(50, 2);
  });

  it('does not invent an effective rate when there is no income', () => {
    const data = personalPensionSweep({ ...defaultInputs, annualGrossSalary: 0 });
    expect(data.every((d) => d.effectiveRate === null)).toBe(true);
    expect(data.at(-1)?.relief).toBeCloseTo(250, 2);
  });
});
