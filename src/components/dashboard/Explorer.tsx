import { lazy, Suspense, useMemo, useState } from 'react';
import Chart from 'react-apexcharts';
import type { TaxInputs } from '../../types/tax';
import { calculateTaxes } from '../../utils/TaxCalc';
import { formatCurrency as money, getApexChartOptions } from '../../utils/chartUtils';
import { NumberField } from '../UserMenu';
const AdvancedExplorer = lazy(() => import('../TaxYearOverview'));

export default function Explorer({ inputs, theme }: { inputs: TaxInputs; theme: string }) {
  const [max, setMax] = useState(Math.max(100000, inputs.annualGrossSalary * 1.5));
  const [mode, setMode] = useState<'income' | 'pension'>('income');
  const [advanced, setAdvanced] = useState(false);
  const data = useMemo(() => {
    const limit = mode === 'income' ? max : Math.max(1000, inputs.annualGrossSalary * 0.5);
    const xs = new Set(Array.from({ length: 101 }, (_, i) => Math.round((i * limit) / 100)));
    if (mode === 'income' && inputs.annualGrossSalary <= limit) xs.add(inputs.annualGrossSalary);
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
  }, [inputs, max, mode]);
  const options = useMemo(
    () => ({
      ...getApexChartOptions(theme, {
        xAxisTitle:
          mode === 'income'
            ? 'Annual salary / profit (bonus & dividends held constant)'
            : 'Annual personal pension payment',
        yAxisTitle: 'Annual amount',
      }),
      colors: ['#218466', '#6675da', '#d29940'],
      stroke: { curve: 'straight' as const, width: [3, 2, 2], dashArray: [0, 5, 3] },
      fill: { type: 'gradient', gradient: { opacityFrom: 0.2, opacityTo: 0.01 } },
      annotations: {
        xaxis:
          mode === 'income' && inputs.annualGrossSalary <= max
            ? [
                {
                  x: inputs.annualGrossSalary,
                  borderColor: '#218466',
                  label: { text: 'Your salary', style: { background: '#218466', color: '#fff' } },
                },
              ]
            : [],
      },
      tooltip: {
        theme,
        shared: true,
        x: {
          formatter: (v: number) =>
            `${mode === 'income' ? 'Salary / profit' : 'Personal payment'}: ${money(v)}`,
        },
        y: { formatter: money },
      },
    }),
    [theme, inputs.annualGrossSalary, max, mode],
  );
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
        <div
          role="img"
          aria-label="Take-home pay, total deductions and pension across the selected range. Use the sample data table below for amounts."
        >
          <Chart
            options={options}
            type="area"
            height={370}
            series={[
              { name: 'Take-home pay', data: data.map((d) => ({ x: d.x, y: d.r.takeHomePay })) },
              {
                name: 'Total deductions · includes your pension',
                data: data.map((d) => ({ x: d.x, y: d.r.combinedDeductions })),
              },
              {
                name: 'Into pension · includes employer',
                data: data.map((d) => ({ x: d.x, y: d.r.pensionPot.total })),
              },
            ]}
          />
        </div>
        <details className="nested-details">
          <summary>View sample data as a table</summary>
          <div className="table-scroll">
            <table className="breakdown-table">
              <thead>
                <tr>
                  <th scope="col">
                    {mode === 'income' ? 'Salary / profit' : 'Personal pension payment'}
                  </th>
                  <th scope="col">Take-home</th>
                  <th scope="col">Deductions</th>
                  <th scope="col">Into pension</th>
                </tr>
              </thead>
              <tbody>
                {data
                  .filter((_, i) => i % 10 === 0 || i === data.length - 1)
                  .map((d) => (
                    <tr key={d.x}>
                      <th scope="row">{money(d.x)}</th>
                      <td>{money(d.r.takeHomePay)}</td>
                      <td>{money(d.r.combinedDeductions)}</td>
                      <td>{money(d.r.pensionPot.total)}</td>
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
      <details
        className="surface advanced-explorer"
        onToggle={(e) => setAdvanced(e.currentTarget.open)}
      >
        <summary>
          Build your own charts <span>Advanced · choose measures, rates and axes</span>
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
