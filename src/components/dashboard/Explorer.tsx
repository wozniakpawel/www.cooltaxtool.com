import { lazy, Suspense, useMemo, useState } from 'react';
import Chart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import type { TaxInputs, TaxCalculationResult } from '../../types/tax';
import { calculateTaxes } from '../../utils/TaxCalc';
import {
  formatCurrency as money,
  formatPercent,
  getApexChartOptions,
} from '../../utils/chartUtils';
import { NumberField } from '../UserMenu';
import PensionAnalysis from '../IncomeAnalysis/PensionAnalysis';
const AdvancedExplorer = lazy(() => import('../TaxYearOverview'));

const measures = [
  { name: 'Take-home pay', color: '#218466', value: (r: TaxCalculationResult) => r.takeHomePay },
  {
    name: 'Total deductions · includes your pension',
    color: '#6675da',
    value: (r: TaxCalculationResult) => r.combinedDeductions,
  },
  {
    name: 'Into pension · includes employer',
    color: '#d29940',
    value: (r: TaxCalculationResult) => r.pensionPot.total,
  },
  {
    name: 'Total kept · cash, pension & Child Benefit',
    color: '#168aad',
    value: (r: TaxCalculationResult) => r.totalYouKeep,
  },
  { name: 'Income Tax', color: '#a855a0', value: (r: TaxCalculationResult) => r.incomeTax.total },
  {
    name: 'Dividend Tax',
    color: '#8473bc',
    value: (r: TaxCalculationResult) => r.dividendTax.total,
  },
  {
    name: 'Your National Insurance',
    color: '#cc664b',
    value: (r: TaxCalculationResult) => r.employeeNI.total,
  },
  {
    name: 'Employer National Insurance',
    color: '#9b704c',
    value: (r: TaxCalculationResult) => r.employerNI.total,
  },
  {
    name: 'Student loan repayments',
    color: '#ab841c',
    value: (r: TaxCalculationResult) => r.studentLoanRepayments.total,
  },
  { name: 'Child Benefit charge', color: '#c45776', value: (r: TaxCalculationResult) => r.hicbc },
  {
    name: 'Your pension contributions',
    color: '#608a44',
    value: (r: TaxCalculationResult) => r.employeePensionContributions,
  },
];

export default function Explorer({ inputs, theme }: { inputs: TaxInputs; theme: string }) {
  const [max, setMax] = useState(
    Math.max(inputs.annualGrossIncomeRange, inputs.annualGrossSalary * 1.5),
  );
  const [mode, setMode] = useState<'income' | 'pension'>('income');
  const [breakdown, setBreakdown] = useState(false);
  const [percentage, setPercentage] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const currentX =
    mode === 'income' ? inputs.annualGrossSalary : inputs.pensionContributions.personal;
  const data = useMemo(() => {
    const limit =
      mode === 'income'
        ? max
        : Math.max(1000, inputs.annualGrossSalary * 0.5, inputs.pensionContributions.personal);
    const xs = new Set(Array.from({ length: 201 }, (_, i) => Math.round((i * limit) / 200)));
    if (currentX <= limit) xs.add(currentX);
    return [...xs]
      .sort((a, b) => a - b)
      .map((x) => ({
        x,
        r: calculateTaxes(
          mode === 'income'
            ? { ...inputs, annualGrossSalary: x }
            : {
                ...inputs,
                pensionEnabled: true,
                pensionContributions: { ...inputs.pensionContributions, personal: x },
              },
        ),
      }));
  }, [inputs, max, mode, currentX]);
  const visibleMeasures = breakdown ? measures : measures.slice(0, 4);
  const plottedData = percentage
    ? data.filter((d) => d.r.annualGrossIncome.total + inputs.annualGrossDividends > 0)
    : data;
  const series = visibleMeasures.map((m) => ({
    name: m.name,
    data: plottedData.map((d) => ({
      x: d.x,
      y: percentage
        ? (100 * m.value(d.r)) / (d.r.annualGrossIncome.total + inputs.annualGrossDividends)
        : m.value(d.r),
    })),
  }));
  const options: ApexOptions = {
    ...getApexChartOptions(theme, {
      isPercentage: percentage,
      xAxisTitle: mode === 'income' ? 'Annual salary / profit' : 'Annual personal pension payment',
      yAxisTitle: percentage ? '% of gross income' : 'Annual amount',
    }),
    colors: visibleMeasures.map((m) => m.color),
    stroke: {
      curve: 'straight',
      width: visibleMeasures.map((_, i) => (i === 0 ? 3 : 2)),
      dashArray: visibleMeasures.map((_, i) => (i === 1 ? 5 : i === 2 ? 3 : i === 3 ? 8 : 0)),
    },
    fill: { type: 'solid', opacity: 1 },
    annotations: {
      xaxis:
        currentX <= data[data.length - 1].x
          ? [
              {
                x: currentX,
                borderColor: '#218466',
                label: {
                  text: mode === 'income' ? 'Your salary' : 'Your payment',
                  style: { background: '#218466', color: '#fff' },
                },
              },
            ]
          : [],
    },
    tooltip: {
      theme,
      shared: true,
      intersect: false,
      x: {
        formatter: (v: number) =>
          `${mode === 'income' ? 'Salary / profit' : 'Personal payment'}: ${money(v)}`,
      },
      y: { formatter: percentage ? formatPercent : money },
    },
  };
  return (
    <section className="view-enter">
      <div className="view-heading">
        <div>
          <span className="eyebrow">SEE THE BIGGER PICTURE</span>
          <h2>Follow your money as life changes.</h2>
          <p>Explore how income and pension contributions affect what you keep.</p>
        </div>
      </div>
      <div className="surface">
        <div className="section-heading">
          <div className="period-switch">
            <button
              className={mode === 'income' ? 'active' : ''}
              aria-pressed={mode === 'income'}
              onClick={() => setMode('income')}
            >
              Explore salary
            </button>
            <button
              className={mode === 'pension' ? 'active' : ''}
              aria-pressed={mode === 'pension'}
              onClick={() => setMode('pension')}
            >
              Explore pension
            </button>
          </div>
        </div>
        {mode === 'income' && (
          <div className="explorer-limit">
            <NumberField
              label="Maximum annual salary / profit"
              value={max}
              min={1000}
              max={1000000}
              onChange={setMax}
            />
          </div>
        )}
        <p>
          {mode === 'income'
            ? 'Bonus, dividends and pension settings stay as entered. The marker shows your current salary.'
            : 'This varies your personal pension payment while keeping your other inputs fixed. Contributions above the earnings limit get no additional tax relief.'}
        </p>
        <div className="explorer-display-controls">
          <div className="period-switch" aria-label="Chart units">
            <button
              className={!percentage ? 'active' : ''}
              aria-pressed={!percentage}
              onClick={() => setPercentage(false)}
            >
              Annual amounts
            </button>
            <button
              className={percentage ? 'active' : ''}
              aria-pressed={percentage}
              onClick={() => setPercentage(true)}
            >
              % of gross income
            </button>
          </div>
          <label className="explorer-breakdown-toggle">
            <input
              type="checkbox"
              checked={breakdown}
              onChange={(e) => setBreakdown(e.target.checked)}
            />{' '}
            Show tax & pension breakdown
          </label>
        </div>
        <p className="chart-footnote">
          Hover or tap for values. Select a legend item to hide or show a line. Total kept includes
          cash, pension and Child Benefit received. Employer NI is paid by your employer.
        </p>
        <div
          role="img"
          aria-label="Income and pension line chart. Use the sample data table below for annual amounts."
        >
          <Chart options={options} type="line" height={breakdown ? 470 : 390} series={series} />
        </div>
        <details className="nested-details">
          <summary>View sample data as a table</summary>
          <div className="table-scroll">
            <table className="breakdown-table">
              <caption>
                Annual amounts in pounds, including your current{' '}
                {mode === 'income' ? 'salary' : 'pension payment'}.
              </caption>
              <thead>
                <tr>
                  <th scope="col">
                    {mode === 'income' ? 'Salary / profit' : 'Personal pension payment'}
                  </th>
                  {visibleMeasures.map((m) => (
                    <th scope="col" key={m.name}>
                      {m.name === 'Take-home pay' ? 'Take-home' : m.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data
                  .filter((d, i) => i % 20 === 0 || i === data.length - 1 || d.x === currentX)
                  .map((d) => (
                    <tr key={d.x}>
                      <th scope="row">{money(d.x)}</th>
                      {visibleMeasures.map((m) => (
                        <td key={m.name}>{money(m.value(d.r))}</td>
                      ))}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </details>
        <p className="chart-footnote">
          Annual estimates, sampled across the range. Lines connect samples; small threshold steps
          may fall between them. Pension annual allowance charges are not included.
        </p>
      </div>
      {mode === 'pension' && (
        <div className="surface pension-insights">
          <PensionAnalysis inputs={inputs} theme={theme} />
        </div>
      )}
      <details
        className="surface advanced-explorer"
        onToggle={(e) => setAdvanced(e.currentTarget.open)}
      >
        <summary>
          Build your own charts{' '}
          <span>All measures · allowances, taxable income, marginal rates and pension axes</span>
        </summary>
        {advanced && (
          <Suspense fallback={<p>Loading chart builder…</p>}>
            <AdvancedExplorer inputs={inputs} theme={theme} />
          </Suspense>
        )}
      </details>
    </section>
  );
}
