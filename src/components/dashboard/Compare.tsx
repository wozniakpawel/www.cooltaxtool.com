import { useMemo, useState } from 'react';
import type { TaxInputs } from '../../types/tax';
import { calculateTaxes } from '../../utils/TaxCalc';
import { formatCurrency as money, formatCurrencyPrecise as precise } from '../../utils/chartUtils';
import { NumberField } from '../UserMenu';
import { scenarioInputs, salaryForTarget } from '../../utils/scenarios';

export default function Compare({ inputs }: { inputs: TaxInputs }) {
  const [baseline, setBaseline] = useState<TaxInputs>(() => structuredClone(inputs));
  const [salary, setSalary] = useState(inputs.annualGrossSalary + 5000);
  const [extraPension, setExtraPension] = useState(0);
  const base = useMemo(() => calculateTaxes(baseline), [baseline]);
  const alternative = useMemo(
    () => calculateTaxes(scenarioInputs(baseline, salary, extraPension)),
    [baseline, salary, extraPension],
  );
  const [target, setTarget] = useState(3500);
  const [targetMessage, setTargetMessage] = useState('');
  const delta = alternative.takeHomePay - base.takeHomePay;
  const rows = [
    [
      'Gross income',
      base.annualGrossIncome.total + baseline.annualGrossDividends,
      alternative.annualGrossIncome.total + baseline.annualGrossDividends,
    ],
    ['Tax, NI, loans & benefit charge', base.combinedTaxes, alternative.combinedTaxes],
    [
      'Your pension cost',
      base.employeePensionContributions,
      alternative.employeePensionContributions,
    ],
    ['Total deductions', base.combinedDeductions, alternative.combinedDeductions],
    ['Take-home pay', base.takeHomePay, alternative.takeHomePay],
    ['Into pension, including employer', base.pensionPot.total, alternative.pensionPot.total],
    ['Child Benefit received', base.childBenefits.total, alternative.childBenefits.total],
  ] as const;
  const max = Math.max(base.takeHomePay, alternative.takeHomePay, 1);
  return (
    <section className="view-enter">
      <div className="view-heading">
        <div>
          <span className="eyebrow">MAKE YOUR NEXT MOVE</span>
          <h2>Compare the possibilities.</h2>
          <p>A new job, a pay rise, or more into your pension.</p>
        </div>
      </div>
      <div className="notice">
        <strong>
          Your starting point is fixed at {money(baseline.annualGrossSalary)} annual{' '}
          {baseline.selfEmployed ? 'profit' : 'salary'} · {baseline.taxYear}.
        </strong>
        <p>
          Other settings come from that starting point. Editing the main calculator won’t change
          this comparison until you update it.
        </p>
        <button
          className="text-button"
          onClick={() => {
            setBaseline(structuredClone(inputs));
            setSalary(inputs.annualGrossSalary + 5000);
            setExtraPension(0);
            setTargetMessage('');
          }}
        >
          Use current calculator settings as starting point ↻
        </button>
      </div>
      <div className="surface compare-inputs">
        <NumberField
          label={`Alternative annual ${baseline.selfEmployed ? 'profit' : 'salary'}`}
          value={salary}
          onChange={(n) => {
            setSalary(n);
            setTargetMessage('');
          }}
          hint="Actual annual pay for your working pattern, not full-time equivalent."
        />
        <NumberField
          label={
            baseline.selfEmployed
              ? 'Extra annual personal pension payment'
              : 'Extra annual salary sacrifice'
          }
          value={extraPension}
          max={baseline.selfEmployed ? 10000000 : salary + baseline.annualGrossBonus}
          onChange={(n) => {
            setExtraPension(n);
            setTargetMessage('');
          }}
          hint="Added to any pension contributions in your starting point."
        />
      </div>
      <details className="surface reverse-calculator">
        <summary>Working backwards? Find a salary for your target take-home.</summary>
        <div className="reverse-controls">
          <NumberField
            label="Target monthly take-home"
            value={target}
            onChange={(n) => {
              setTarget(n);
              setTargetMessage('');
            }}
            max={100000}
          />
          <button
            className="action-button"
            onClick={() => {
              const found = salaryForTarget(baseline, target * 12, extraPension);
              if (found === null)
                setTargetMessage(
                  'This target cannot be reached within £1 million of annual salary at these settings. Review your target or pension contributions.',
                );
              else {
                setSalary(found);
                setTargetMessage(
                  `Alternative updated to approximately ${precise(found)} annual ${baseline.selfEmployed ? 'profit' : 'salary'}.`,
                );
              }
            }}
          >
            Find annual {baseline.selfEmployed ? 'profit' : 'salary'} →
          </button>
        </div>
        <p className="input-note">
          Uses this comparison’s fixed starting settings and extra pension payment. Excludes Child
          Benefit received. This is actual annual pay for your working pattern.
        </p>
        {targetMessage && (
          <p className="notice" role="status">
            {targetMessage}
          </p>
        )}
      </details>
      <div className="compare-outcome">
        <span>Your alternative gives you</span>
        <strong>
          {precise(Math.abs(delta) / 12)} <span>{delta >= 0 ? 'more' : 'less'} / month</span>
        </strong>
        <p>
          in take-home pay, and{' '}
          {money(Math.abs(alternative.pensionPot.total - base.pensionPot.total))}{' '}
          {alternative.pensionPot.total >= base.pensionPot.total ? 'more' : 'less'} into your
          pension per year.
        </p>
      </div>
      <div className="surface">
        <div className="section-heading">
          <div>
            <h3>Side by side</h3>
            <p>All figures below are annual.</p>
          </div>
          <span className="small-tag">{baseline.taxYear}</span>
        </div>
        <div className="comparison-bars">
          {[
            { label: 'Starting point', value: base.takeHomePay },
            { label: 'Alternative', value: alternative.takeHomePay },
          ].map((s, i) => (
            <div key={s.label}>
              <div>
                <span>{s.label}</span>
                <strong>{money(s.value)} take-home</strong>
              </div>
              <div className="comparison-track">
                <span
                  style={{
                    width: `${(Math.max(0, s.value) / max) * 100}%`,
                    background: i ? 'var(--accent)' : 'var(--chart-muted)',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
        <div
          className="table-scroll"
          role="region"
          aria-label="Scenario comparison table"
          tabIndex={0}
        >
          <table className="breakdown-table">
            <thead>
              <tr>
                <th scope="col">Annual amount</th>
                <th scope="col">Starting point</th>
                <th scope="col">Alternative</th>
                <th scope="col">Change</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([label, a, b]) => (
                <tr key={label} className={label === 'Take-home pay' ? 'net-row' : ''}>
                  <th scope="row">{label}</th>
                  <td>{precise(a)}</td>
                  <td>{precise(b)}</td>
                  <td>
                    {b - a > 0 ? '+' : ''}
                    {precise(b - a)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="chart-footnote">
          Monthly change is the annual difference divided by 12. Pension savings are future funds.
          Salary sacrifice is capped at gross pay and must also comply with minimum wage rules.
        </p>
      </div>
      {(alternative.takeHomePay < 0 ||
        alternative.pensionAnnualAllowance.exceeded ||
        alternative.unrelievedPensionContributions > 0) && (
        <p className="notice warning">
          This alternative exceeds available cash or a pension relief / annual allowance limit. Any
          annual allowance charge is not included. Review the contributions before using this
          scenario.
        </p>
      )}
    </section>
  );
}
