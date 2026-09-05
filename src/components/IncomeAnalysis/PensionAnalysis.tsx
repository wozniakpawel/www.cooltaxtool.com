import { useMemo } from 'react';
import Chart from 'react-apexcharts';
import { calculateTaxes } from '../../utils/TaxCalc';
import { formatCurrency, formatPercent, getApexChartOptions } from '../../utils/chartUtils';
import type { TaxInputs } from '../../types/tax';

interface PensionAnalysisProps {
  inputs: TaxInputs;
  theme: string;
}

export function personalPensionSweep(inputs: TaxInputs) {
  const pensionInputs = { ...inputs, pensionEnabled: true };
  const baseline = calculateTaxes({
    ...pensionInputs,
    pensionContributions: { ...inputs.pensionContributions, personal: 0 },
  });
  const limit = Math.max(
    baseline.annualGrossIncome.total,
    inputs.pensionContributions.personal,
    1000,
  );
  return Array.from({ length: 201 }, (_, i) => {
    const payment = (i * limit) / 200;
    const result = calculateTaxes({
      ...pensionInputs,
      pensionContributions: { ...inputs.pensionContributions, personal: payment },
    });
    // Provider relief goes into the pension, not into take-home pay. Include it
    // alongside the reduction in tax liability, without counting it twice.
    const relief =
      baseline.combinedTaxes -
      result.combinedTaxes +
      result.pensionReliefAtSource -
      baseline.pensionReliefAtSource;
    const gross = result.annualGrossIncome.total + inputs.annualGrossDividends;
    return {
      payment,
      relief,
      reliefPercent: payment > 0 ? (100 * relief) / payment : null,
      effectiveRate: gross > 0 ? (100 * result.combinedTaxes) / gross : null,
    };
  });
}

const PensionAnalysis = ({ inputs, theme }: PensionAnalysisProps) => {
  const data = useMemo(() => personalPensionSweep(inputs), [inputs]);
  const base = getApexChartOptions(theme, {
    isPercentage: true,
    xAxisTitle: 'Annual personal pension payment',
    yAxisTitle: 'Percentage',
  });
  const options = {
    ...base,
    colors: ['#218466', '#6675da'],
    tooltip: {
      ...base.tooltip,
      shared: true,
      intersect: false,
      x: { formatter: (v: number) => `Personal payment: ${formatCurrency(v)}` },
    },
  };
  return (
    <>
      <h3>Tax relief and effective tax rate</h3>
      <p>
        See the reduction in tax, NI, loans and Child Benefit charge, plus any provider top-up, as a
        percentage of your personal payment. The effective rate is your remaining tax, NI, loans and
        Child Benefit charge as a percentage of gross income.
      </p>
      <Chart
        options={options}
        type="line"
        height={350}
        series={[
          {
            name: 'Tax savings & top-up / personal payment',
            data: data.map((d) => ({ x: d.payment, y: d.reliefPercent })),
          },
          {
            name: 'Effective tax & deductions rate',
            data: data.map((d) => ({ x: d.payment, y: d.effectiveRate })),
          },
        ]}
      />
      <details className="nested-details">
        <summary>View pension relief data</summary>
        <div className="table-scroll">
          <table className="breakdown-table">
            <thead>
              <tr>
                <th scope="col">Personal payment</th>
                <th scope="col">Tax savings & top-up</th>
                <th scope="col">% of payment</th>
                <th scope="col">Effective rate</th>
              </tr>
            </thead>
            <tbody>
              {data
                .filter((_, i) => i % 20 === 0)
                .map((d) => (
                  <tr key={d.payment}>
                    <th scope="row">{formatCurrency(d.payment)}</th>
                    <td>{formatCurrency(d.relief)}</td>
                    <td>{d.reliefPercent === null ? '—' : formatPercent(d.reliefPercent)}</td>
                    <td>{d.effectiveRate === null ? '—' : formatPercent(d.effectiveRate)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </details>
      <p className="chart-footnote">
        Other pension settings stay fixed. Provider top-ups go into your pension. Annual allowance
        charges are not included, so contributions beyond your allowance may cost more than shown.
      </p>
      {!inputs.selfEmployed && <AutoEnrolmentSweep inputs={inputs} theme={theme} />}
    </>
  );
};

const AutoEnrolmentSweep = ({ inputs, theme }: PensionAnalysisProps) => {
  const data = useMemo(
    () =>
      Array.from({ length: 61 }, (_, i) => {
        const rate = i * 0.5;
        const result = calculateTaxes({
          ...inputs,
          pensionEnabled: true,
          pensionContributions: { ...inputs.pensionContributions, autoEnrolment: rate },
        });
        return { rate, result };
      }),
    [inputs],
  );
  const base = getApexChartOptions(theme, {
    xAxisTitle: 'Employee workplace pension contribution',
    yAxisTitle: 'Annual amount',
  });
  const options = {
    ...base,
    colors: ['#218466', '#d29940', '#168aad'],
    stroke: { ...base.stroke, dashArray: [0, 3, 8] },
    xaxis: {
      ...base.xaxis,
      labels: { ...base.xaxis?.labels, formatter: (v: string) => formatPercent(Number(v)) },
    },
    tooltip: {
      ...base.tooltip,
      shared: true,
      intersect: false,
      x: { formatter: (v: number) => `Workplace contribution: ${formatPercent(v)}` },
    },
  };
  return (
    <>
      <h3>Workplace pension: cash now and money for later</h3>
      <p>
        Vary your workplace contribution from 0% to 30%. Your selected contribution method and
        earnings basis apply; your employer’s contribution rate stays fixed.
      </p>
      <Chart
        options={options}
        type="line"
        height={350}
        series={[
          {
            name: 'Take-home pay',
            data: data.map((d) => ({ x: d.rate, y: d.result.takeHomePay })),
          },
          {
            name: 'Into pension · includes employer',
            data: data.map((d) => ({ x: d.rate, y: d.result.pensionPot.total })),
          },
          {
            name: 'Total kept · cash, pension & Child Benefit',
            data: data.map((d) => ({ x: d.rate, y: d.result.totalYouKeep })),
          },
        ]}
      />
      <details className="nested-details">
        <summary>View workplace pension data</summary>
        <div className="table-scroll">
          <table className="breakdown-table">
            <thead>
              <tr>
                <th scope="col">Workplace contribution</th>
                <th scope="col">Take-home</th>
                <th scope="col">Into pension</th>
                <th scope="col">Total kept</th>
              </tr>
            </thead>
            <tbody>
              {data
                .filter((_, i) => i % 10 === 0)
                .map((d) => (
                  <tr key={d.rate}>
                    <th scope="row">{formatPercent(d.rate)}</th>
                    <td>{formatCurrency(d.result.takeHomePay)}</td>
                    <td>{formatCurrency(d.result.pensionPot.total)}</td>
                    <td>{formatCurrency(d.result.totalYouKeep)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </details>
    </>
  );
};
export default PensionAnalysis;
