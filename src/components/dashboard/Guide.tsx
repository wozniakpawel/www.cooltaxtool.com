import { taxYears } from '../../utils/TaxYears';
import { formatCurrency as money } from '../../utils/chartUtils';
import type { TaxInputs } from '../../types/tax';

export default function Guide({ inputs }: { inputs: TaxInputs }) {
  const c = taxYears[inputs.taxYear];
  return (
    <section id="guides" className="surface guide-section">
      <div className="section-heading">
        <div>
          <span className="eyebrow">A LITTLE LESS TAX JARGON</span>
          <h2>Understand the numbers.</h2>
          <p>The rules, the assumptions, and where to read more.</p>
        </div>
        <span className="small-tag">{inputs.taxYear}</span>
      </div>
      <div className="guide-grid">
        <article>
          <span className="guide-number">01</span>
          <h3>Your tax-free starting point</h3>
          <p>
            The standard Personal Allowance is {money(c.taxAllowance.basicAllowance)}. Above
            £100,000 of adjusted net income, you lose £1 of allowance for each extra £2. This can
            make the effective tax on a pay rise higher than your headline band.
          </p>
          <a href="https://www.gov.uk/income-tax-rates">Income Tax & allowances ↗</a>
        </article>
        <article>
          <span className="guide-number">02</span>
          <h3>Three ways to pay into a pension</h3>
          <p>
            <strong>Salary sacrifice</strong> reduces contractual pay, saving income tax and usually
            NI. <strong>Net pay</strong> reduces taxable pay but not NI.{' '}
            <strong>Relief at source</strong> adds £20 to an eligible £80 payment; any extra relief
            is claimed from HMRC.
          </p>
          <a href="https://www.gov.uk/tax-on-your-private-pension/pension-tax-relief">
            How pension relief works ↗
          </a>
        </article>
        <article>
          <span className="guide-number">03</span>
          <h3>Your payslip has its own timing</h3>
          <p>
            Our main results estimate a full year. Monthly and weekly results are averages. Payroll
            calculates NI and student loans each pay period, so a bonus or changing salary can
            produce different totals. Use the PAYE planner to explore this.
          </p>
          <a href="https://www.gov.uk/guidance/rates-and-thresholds-for-employers-2026-to-2027">
            HMRC payroll rates for 2026/27 ↗
          </a>
        </article>
        <article>
          <span className="guide-number">04</span>
          <h3>Child Benefit and income</h3>
          <p>
            For this tax year, the high-income charge starts above {money(c.hicbc.threshold)} of
            adjusted net income. It repays 1% of benefit for each complete{' '}
            {money(c.hicbc.taperDivisor)} over the threshold. We assume you are the higher-income
            partner.
          </p>
          <a href="https://www.gov.uk/child-benefit-tax-charge">Child Benefit tax charge ↗</a>
        </article>
      </div>
      <details className="methodology">
        <summary>What this calculator includes, and its limits</summary>
        <p>
          Includes employment income or sole-trader profits, bonuses, dividends, Scottish
          non-savings income tax, employee or self-employed NI, student loan plans, pensions and
          Child Benefit. It assumes UK residence for the full year, standard allowances, and one
          employment or trade. Profits should already have allowable business expenses deducted.
        </p>
        <p>
          Take-home is an annual estimate after all modelled deductions, including the benefit of
          eligible additional pension relief claimed from HMRC. A refund may arrive separately from
          your payslip. Pension contributions include the cash you pay and salary foregone; employer
          contributions and provider tax relief are additional pension value.
        </p>
        <p>
          Self-employed pensions do not reduce Class 4 NI. For student loans, dividends are included
          in the annual Self Assessment base when they exceed £2,000. The calculator assumes
          repayments have started and that an outstanding balance remains. Voluntary loan payments,
          write-off dates and interest are not modelled.
        </p>
        <p>
          Not included: savings interest, rental income, capital gains, corporation tax, benefits in
          kind, custom or emergency tax codes, Marriage Allowance, Gift Aid, mixed employment and
          self-employment, Universal Credit, childcare eligibility, student loan refunds, or pension
          annual allowance charges. This is an estimate for planning, not payroll software or a tax
          return.
        </p>
        <p>
          Pension relief assumes eligibility, including being under age 75. The earnings limit and
          tapered annual allowance are modelled; carry-forward and the Money Purchase Annual
          Allowance are not. Defined benefit accrual is simplified: salary divided by the scheme
          denominator, with annual allowance input approximated as 16 times the accrual. Existing
          benefits, revaluation and lump sums can change the actual input.
        </p>
        <p>
          Historic 2022/23 NI uses effective annual rates and thresholds. 2023/24 employee NI
          assumes even monthly earnings, with nine months at 12% and three at 10%. The PAYE planner
          does not reproduce these mid-year rule changes.
        </p>
        <p>
          Child Benefit uses 52 weeks. Actual entitlement depends on eligibility dates. Salary
          sacrifice is limited to gross pay here, but an employer must also check National Minimum
          Wage rules.
        </p>
      </details>
      <details className="methodology">
        <summary>Official sources & rate review</summary>
        <p>
          Current-year rates reviewed on 5 September 2026. Historical values are retained for
          comparison; see the historical NI approximations above.
        </p>
        <ul className="source-list">
          <li>
            <a href="https://www.gov.uk/guidance/rates-and-thresholds-for-employers-2026-to-2027">
              HMRC: 2026/27 Income Tax, Scottish bands, NI and student loans
            </a>
          </li>
          <li>
            <a href="https://www.gov.uk/tax-on-dividends">HMRC: dividend allowance and rates</a>
          </li>
          <li>
            <a href="https://www.gov.uk/self-employed-national-insurance-rates">
              HMRC: self-employed NI
            </a>
          </li>
          <li>
            <a href="https://www.gov.uk/child-benefit/what-youll-get">Child Benefit rates</a>
          </li>
          <li>
            <a href="https://www.gov.uk/blind-persons-allowance/what-youll-get">
              Blind Person’s Allowance
            </a>
          </li>
          <li>
            <a href="https://www.gov.uk/hmrc-internal-manuals/pensions-tax-manual/ptm044220">
              HMRC pension manual: relief at source
            </a>
          </li>
          <li>
            <a href="https://www.gov.uk/tax-on-your-private-pension/annual-allowance">
              Pension annual allowance
            </a>
          </li>
          <li>
            <a href="https://www.gov.uk/repaying-your-student-loan/what-you-pay">
              Student loan repayment rules
            </a>
          </li>
        </ul>
      </details>
    </section>
  );
}
