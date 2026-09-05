import { useMemo, useState } from 'react';
import type { TaxInputs } from '../../types/tax';
import { calculateTaxes } from '../../utils/TaxCalc';
import { formatCurrency as money, formatCurrencyPrecise as precise } from '../../utils/chartUtils';
import {
  colors,
  deductionRows,
  periods,
  periodDivisor,
  type Period,
  downloadResults,
} from '../../utils/results';
import { taxYears } from '../../utils/TaxYears';

export default function Overview({
  inputs,
  onCompare,
}: {
  inputs: TaxInputs;
  onCompare: () => void;
}) {
  const [period, setPeriod] = useState<Period>('monthly');
  const [tablePeriod, setTablePeriod] = useState(false);
  const r = useMemo(() => calculateTaxes(inputs), [inputs]);
  const next = useMemo(
    () => calculateTaxes({ ...inputs, annualGrossSalary: inputs.annualGrossSalary + 100 }),
    [inputs],
  );
  const withoutPension = useMemo(
    () => calculateTaxes({ ...inputs, pensionEnabled: false }),
    [inputs],
  );
  const divisor = periodDivisor(period, inputs);
  const gross = r.annualGrossIncome.total + inputs.annualGrossDividends;
  const keepPercent = gross > 0 ? (r.takeHomePay / gross) * 100 : 0;
  const deductions = deductionRows(r, inputs);
  const segments = (
    r.takeHomePay < 0
      ? []
      : [
          { label: 'Take-home pay', amount: Math.max(0, r.takeHomePay), color: colors.takeHome },
          ...deductions,
        ]
  ).filter((s) => s.amount > 0);
  const chartTotal = segments.reduce((n, s) => n + s.amount, 0);
  let offset = 0;
  const constants = taxYears[inputs.taxYear];
  const pensionCost = withoutPension.takeHomePay - r.takeHomePay;
  return (
    <div className="overview view-enter">
      <div className="view-heading">
        <div>
          <span className="eyebrow">YOUR MONEY, MADE CLEAR</span>
          <h2>Your take-home, at a glance.</h2>
        </div>
        <div className="period-switch" aria-label="Result period">
          {(Object.keys(periods) as Period[]).map((p) => (
            <button
              key={p}
              aria-pressed={period === p}
              className={p === period ? 'active' : ''}
              onClick={() => setPeriod(p)}
            >
              {periods[p].label}
            </button>
          ))}
        </div>
      </div>
      <section className="takehome-card" aria-label="Take-home summary">
        <div className="takehome-main">
          <div className="result-label">
            <span className="status-dot" /> Estimated take-home pay
          </div>
          <div className="hero-amount" aria-live="polite" aria-atomic="true">
            {precise(r.takeHomePay / divisor)}
            <span>/ {periods[period].noun}</span>
          </div>
          <p>
            After tax, National Insurance{inputs.studentLoanEnabled ? ', student loans' : ''}
            {inputs.pensionEnabled ? ' and your pension' : ''}.
          </p>
          <div className="hero-rule" />
          <div className="hero-bottom">
            <span>
              You keep <strong>{keepPercent.toFixed(1)}%</strong> of your gross income
            </span>
            <span>
              {money(r.takeHomePay)} per year <span aria-hidden="true">↗</span>
            </span>
          </div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="orbit orbit-three" />
          <span>£</span>
          <div className="visual-caption">
            A little clarity.
            <br />A lot more confidence.
          </div>
        </div>
      </section>
      <div className="metric-grid">
        <div className="metric">
          <span>
            Gross income <small>/ {periods[period].noun}</small>
          </span>
          <strong>{precise(gross / divisor)}</strong>
          <small>Salary, bonus & dividends</small>
        </div>
        <div className="metric">
          <span>
            Total deductions <small>/ {periods[period].noun}</small>
          </span>
          <strong>{precise(r.combinedDeductions / divisor)}</strong>
          <small>
            Includes {precise(r.employeePensionContributions / divisor)} of your pension
          </small>
        </div>
        <div className="metric">
          <span>
            Into your pension <small>/ {periods[period].noun}</small>
          </span>
          <strong>{precise(r.pensionPot.total / divisor)}</strong>
          <small>Including employer & provider tax relief</small>
        </div>
      </div>
      {(r.takeHomePay < 0 ||
        r.unrelievedPensionContributions > 0 ||
        r.pensionAnnualAllowance.exceeded) && (
        <div className="notice warning" role="status">
          {r.takeHomePay < 0 && (
            <p>
              <strong>Your contributions exceed your available cash.</strong> This leaves a{' '}
              {money(-r.takeHomePay)} annual shortfall. Reduce contributions or account for funding
              from savings.
            </p>
          )}
          {r.unrelievedPensionContributions > 0 && (
            <p>
              <strong>Pension earnings limit reached.</strong>{' '}
              {money(r.unrelievedPensionContributions)} of your personal payment receives no relief
              in this estimate.
            </p>
          )}
          {r.pensionAnnualAllowance.exceeded && (
            <p>
              <strong>Pension annual allowance exceeded.</strong> Estimated input of{' '}
              {money(r.pensionAnnualAllowance.used)} exceeds your{' '}
              {money(r.pensionAnnualAllowance.allowance)} allowance. Any annual allowance charge,
              carry-forward and Money Purchase Annual Allowance are not included.
            </p>
          )}
        </div>
      )}
      <div className="overview-grid">
        <section className="surface allocation-card">
          <div className="section-heading">
            <div>
              <h3>Where your money goes</h3>
              <p>Every pound, accounted for.</p>
            </div>
            <span className="small-tag">{periods[period].label}</span>
          </div>
          <div className="allocation-content">
            <div className="donut-wrap">
              <svg
                viewBox="0 0 200 200"
                role="img"
                aria-label="Income allocation. Amounts are listed alongside the chart."
              >
                <circle
                  cx="100"
                  cy="100"
                  r="78"
                  fill="none"
                  stroke="var(--line)"
                  strokeWidth="22"
                />
                {segments.map((s) => {
                  const length = chartTotal ? (s.amount / chartTotal) * 100 : 0;
                  const start = offset;
                  offset += length;
                  return (
                    <circle
                      key={s.label}
                      cx="100"
                      cy="100"
                      r="78"
                      fill="none"
                      stroke={s.color}
                      strokeWidth="22"
                      pathLength="100"
                      strokeDasharray={`${Math.max(0, length - 0.8)} ${100 - Math.max(0, length - 0.8)}`}
                      strokeDashoffset={-start}
                      transform="rotate(-90 100 100)"
                    >
                      <title>
                        {s.label}: {precise(s.amount / divisor)}
                      </title>
                    </circle>
                  );
                })}
              </svg>
              <div className="donut-label">
                <strong>
                  {r.takeHomePay < 0 ? '—' : gross ? Math.max(0, keepPercent).toFixed(1) : '0'}
                  {r.takeHomePay >= 0 && <span>%</span>}
                </strong>
                <small>{r.takeHomePay < 0 ? 'cash shortfall' : 'take-home'}</small>
              </div>
            </div>
            <ul className="chart-legend">
              {[
                { label: 'Take-home pay', amount: r.takeHomePay, color: colors.takeHome },
                ...deductions.filter((d) => d.amount > 0),
              ].map((s) => (
                <li key={s.label}>
                  <span>
                    <i style={{ background: s.color }} />
                    {s.label}
                  </span>
                  <strong>{precise(s.amount / divisor)}</strong>
                </li>
              ))}
            </ul>
          </div>
          <p className="chart-footnote">
            Pension here is your own contribution. Employer contributions and Child Benefit are
            additional.
          </p>
        </section>
        <section className="surface insight-card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">THE NEXT £100</span>
              <h3>What would a pay rise feel like?</h3>
            </div>
            <span className="insight-arrow" aria-hidden="true">
              ↗
            </span>
          </div>
          <div className="insight-number">{precise(next.takeHomePay - r.takeHomePay)}</div>
          <p>
            More annual take-home from an extra £100 of annual{' '}
            {inputs.selfEmployed ? 'profit' : 'salary'}, with your current settings.
          </p>
          <div className="mini-track" aria-hidden="true">
            <span
              style={{ width: `${Math.max(0, Math.min(100, next.takeHomePay - r.takeHomePay))}%` }}
            />
          </div>
          <p className="input-note">
            This includes changes to pension deductions, loans and any Child Benefit charge.
            Thresholds can make the next £100 different.
          </p>
          <button className="text-button arrow-link" onClick={onCompare}>
            Compare a different salary <span aria-hidden="true">→</span>
          </button>
        </section>
      </div>
      {inputs.pensionEnabled && r.pensionPot.total > 0 && (
        <section className="pension-story">
          <div className="story-icon" aria-hidden="true">
            ↗
          </div>
          <div>
            <h3>Your future self gets {money(r.pensionPot.total)} this year.</h3>
            <p>
              It costs you {money(pensionCost)} in take-home pay compared with no pension. The
              difference includes tax relief, any NI or loan savings, and employer contributions.
              Pension funds are not spendable cash today.
            </p>
          </div>
        </section>
      )}
      {r.childBenefits.total > 0 && (
        <div className="notice">
          <strong>
            With Child Benefit: {precise((r.takeHomePay + r.childBenefits.total) / divisor)} /{' '}
            {periods[period].noun} in spendable cash.
          </strong>
          <p>
            Includes {precise(r.childBenefits.total / divisor)} of benefit you receive. Any
            high-income charge is already included in deductions.
          </p>
        </div>
      )}
      <section className="surface breakdown-card">
        <div className="section-heading">
          <div>
            <h3>The full breakdown</h3>
            <p>Your annual estimate, in the periods that matter.</p>
          </div>
          <button className="text-button" onClick={() => downloadResults(r, inputs)}>
            <span aria-hidden="true">↓ </span>Download CSV
          </button>
        </div>
        <div
          className="table-scroll"
          tabIndex={0}
          role="region"
          aria-label="Income breakdown table"
        >
          <table className="breakdown-table">
            <caption className="visually-hidden">
              Salary and deductions for {inputs.taxYear}. Monthly and weekly values are annual
              averages.
            </caption>
            <thead>
              <tr>
                <th scope="col">Income & deductions</th>
                <th scope="col">Annual</th>
                <th scope="col">Monthly</th>
                <th scope="col">Weekly</th>
              </tr>
            </thead>
            <tbody>
              <tr className="gross-row">
                <th scope="row">Gross income</th>
                {[1, 12, 52].map((d) => (
                  <td key={d}>{precise(gross / d)}</td>
                ))}
              </tr>
              {deductions
                .filter(
                  (d) =>
                    d.amount > 0 || d.label === 'Income Tax' || d.label === 'National Insurance',
                )
                .map((row) => (
                  <tr key={row.label}>
                    <th scope="row">
                      <i className="legend-dot" style={{ background: row.color }} />
                      {row.label}
                    </th>
                    {[1, 12, 52].map((d) => (
                      <td key={d}>{precise(row.amount / d)}</td>
                    ))}
                  </tr>
                ))}
              <tr className="deductions-row">
                <th scope="row">Total deductions</th>
                {[1, 12, 52].map((d) => (
                  <td key={d}>{precise(r.combinedDeductions / d)}</td>
                ))}
              </tr>
              <tr className="net-row">
                <th scope="row">Take-home pay</th>
                {[1, 12, 52].map((d) => (
                  <td key={d}>{precise(r.takeHomePay / d)}</td>
                ))}
              </tr>
              {r.childBenefits.total > 0 && (
                <tr>
                  <th scope="row">Child Benefit received · additional</th>
                  {[1, 12, 52].map((d) => (
                    <td key={d}>{precise(r.childBenefits.total / d)}</td>
                  ))}
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <button
          className="text-button more-breakdown"
          aria-expanded={tablePeriod}
          onClick={() => setTablePeriod(!tablePeriod)}
        >
          {tablePeriod ? '− Hide' : '+ Show'} employer costs, pension & allowances
        </button>
        {tablePeriod && (
          <dl className="detail-list">
            <div>
              <dt>Employer NI · not taken from your pay</dt>
              <dd>{money(r.employerNI.total)} / year</dd>
            </div>
            <div>
              <dt>All money added to your pension</dt>
              <dd>{money(r.pensionPot.total)} / year</dd>
            </div>
            <div>
              <dt>Personal + Blind Person’s Allowance</dt>
              <dd>{money(r.taxAllowance.total)}</dd>
            </div>
            <div>
              <dt>Adjusted net income · used for allowance & benefit tests</dt>
              <dd>{money(r.adjustedNetIncome)}</dd>
            </div>
            {r.dbPension.accrued > 0 && (
              <div>
                <dt>DB pension accrued · future annual income, not a pot</dt>
                <dd>{precise(r.dbPension.accrued)} / year</dd>
              </div>
            )}
          </dl>
        )}
        <p className="chart-footnote">
          Annual calculations divided by 12 or 52. Daily figures use {inputs.workingDaysPerWeek}{' '}
          working days × 52 weeks, including paid leave. Payslips can differ because of payroll
          rounding, tax codes and pay timing.
        </p>
      </section>
      <section className="surface bands-card">
        <div className="section-heading">
          <div>
            <h3>You don’t pay one rate on everything.</h3>
            <p>Only the slice of taxable earnings in each band pays that rate.</p>
          </div>
          <span className="small-tag">{inputs.residentInScotland ? 'Scotland' : 'Rest of UK'}</span>
        </div>
        {r.incomeTax.breakdown.length ? (
          <div className="band-lanes">
            {r.incomeTax.breakdown.map((band, i) => (
              <div className="band-lane" key={i}>
                <span className="band-rate">{(Number(band.rate) * 100).toFixed(0)}%</span>
                <div>
                  <div className="band-caption">
                    <span>{money(band.amount / Number(band.rate))} taxed at this rate</span>
                    <strong>{precise(band.amount)} tax</strong>
                  </div>
                  <div className="band-track">
                    <span
                      style={{
                        width: `${r.taxableIncome ? (band.amount / Number(band.rate) / r.taxableIncome) * 100 : 0}%`,
                        opacity: 0.5 + i * 0.09,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="notice">No Income Tax on your earnings at these settings.</p>
        )}
        <p className="chart-footnote">
          Your allowance is {money(r.taxAllowance.total)}. The Personal Allowance reduces by £1 for
          every £2 of adjusted net income above {money(constants.taxAllowance.taperThreshold)}.
          Dividends have separate rates.
        </p>
      </section>
      <p className="estimate-note">
        Estimate for {inputs.taxYear}. Assumes standard allowances and that eligible additional
        pension relief is claimed from HMRC.{' '}
        <a href="#guides">See sources and calculation assumptions →</a>
      </p>
    </div>
  );
}
