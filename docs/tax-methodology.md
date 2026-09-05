# Calculation methodology

Rate review: 5 September 2026. Current default: **2026/27** (6 April 2026–5 April 2027).

The calculator estimates annual liabilities and cash flow. It is not a payroll processor, a Self Assessment return, or a complete model of household benefits. The same pure calculation engine drives the overview, comparisons, salary target solver and charts.

## Sources

- [HMRC: rates and thresholds for employers, 2026/27](https://www.gov.uk/guidance/rates-and-thresholds-for-employers-2026-to-2027): UK and Scottish Income Tax bands, Class 1 NI and student loan thresholds.
- [Income Tax rates and allowances](https://www.gov.uk/income-tax-rates): Personal Allowance and its taper.
- [Dividend taxation](https://www.gov.uk/tax-on-dividends): dividend allowance and rates.
- [Self-employed NI](https://www.gov.uk/self-employed-national-insurance-rates): Class 2 treatment and Class 4 rates.
- [Blind Person’s Allowance](https://www.gov.uk/blind-persons-allowance/what-youll-get).
- [Child Benefit amounts](https://www.gov.uk/child-benefit/what-youll-get) and [high-income charge](https://www.gov.uk/child-benefit-tax-charge).
- [Pension contribution relief](https://www.gov.uk/tax-on-your-private-pension/pension-tax-relief), [HMRC relief-at-source manual](https://www.gov.uk/hmrc-internal-manuals/pensions-tax-manual/ptm044220), and [annual allowance](https://www.gov.uk/tax-on-your-private-pension/annual-allowance).
- [Student loan repayment rules](https://www.gov.uk/repaying-your-student-loan/what-you-pay) and [2026/27 terms, including Plan 5 start date](https://www.gov.uk/government/publications/student-loans-a-guide-to-terms-and-conditions/student-loans-a-guide-to-terms-and-conditions-2026-to-2027).
- [HMRC 2025/26 payroll rates](https://www.gov.uk/guidance/rates-and-thresholds-for-employers-2025-to-2026): corrected Plan 4 threshold of £32,745.
- [Automatic enrolment qualifying earnings](https://www.thepensionsregulator.gov.uk/en/business-advisers/automatic-enrolment-guide-for-business-advisers/automatic-enrolment-earnings-threshold): annual and payroll thresholds, including the £50,000 upper bound for 2020/21.

## 2026/27 reference values

| Measure                                             | Value                                                       |
| --------------------------------------------------- | ----------------------------------------------------------- |
| Standard Personal Allowance                         | £12,570                                                     |
| Allowance taper                                     | £1 per £2 above £100,000 adjusted net income                |
| UK taxable-income band upper limits                 | £37,700 / £125,140 / unlimited                              |
| UK Income Tax rates                                 | 20% / 40% / 45%                                             |
| Scottish taxable-income band upper limits           | £3,967 / £16,956 / £31,092 / £62,430 / £125,140 / unlimited |
| Scottish rates                                      | 19% / 20% / 21% / 42% / 45% / 48%                           |
| Employee NI                                         | 8% from £12,570 to £50,270; 2% above                        |
| Employer NI                                         | 15% above £5,000                                            |
| Class 4 NI                                          | 6% from £12,570 to £50,270; 2% above                        |
| Blind Person’s Allowance                            | £3,250                                                      |
| Dividend allowance                                  | £500                                                        |
| Dividend rates                                      | 10.75% / 35.75% / 39.35%                                    |
| Loan thresholds, Plans 1 / 2 / 4 / 5 / postgraduate | £26,900 / £29,385 / £33,795 / £25,000 / £21,000             |
| Loan repayment rates                                | 9% undergraduate, plus 6% postgraduate                      |
| Child Benefit per week, first / subsequent child    | £27.05 / £17.90                                             |
| Child Benefit charge                                | 1% per complete £200 above £60,000 ANI, capped at 100%      |
| Pension annual allowance                            | £60,000 before any high-income taper                        |

Band limits are cumulative **taxable-income** limits, not widths. The annual engine deducts available personal allowances before applying them. It extends relevant bands for eligible relief-at-source contributions. Scottish starter-band width is unchanged by that extension. Dividends use UK-wide dividend rates and bands even for Scottish taxpayers.

## Cash-flow definitions

- **Gross income** in the overview: salary or trading profit + bonus or additional trading profit + dividends.
- **Employee pension contributions**: salary foregone + employee workplace deductions + personal payments + defined benefit member contributions. Excludes employer money and provider tax relief.
- **Combined taxes** (retained for compatibility): Income Tax + dividend tax + employee / self-employed NI + student loans + Child Benefit charge. It contains loan repayments, so is not labelled simply “tax” in the main overview.
- **Total deductions**: combined taxes + employee pension contributions. This implements [GitHub issue #42](https://github.com/wozniakpawel/www.cooltaxtool.com/issues/42).
- **Take-home pay**: gross income − total deductions. Negative results are preserved as cash shortfalls rather than silently replaced with zero.
- **Spendable cash**: take-home + Child Benefit received by the user. A partner’s benefit is not added to the user’s cash.
- **Into pension**: employee funding + employer contributions + relief at source + any modelled employer NI saving. This is new funding during the year, not an existing pension balance.
- **DB accrual**: future annual income, shown separately from pension funding and current cash.

Monthly and weekly results divide annual values by 12 and 52. Daily averages use working days per week × 52, including paid leave. With a part-time pattern the input salary is a full-time equivalent; the form scales it once before calling the engine. Comparisons and explorer axes use actual annual pay. Bonus and dividends are not scaled.

## Pension treatment

1. Salary sacrifice reduces income subject to Income Tax, NI and payroll student loan repayments. It is capped at available gross pay. Minimum wage eligibility must be checked separately.
2. Workplace net-pay and DB member contributions reduce taxable income but do not reduce NI or payroll loan earnings.
3. Relief-at-source payments receive provider relief within the relevant earnings limit. £800 eligible cash produces £1,000 in the pension. The £1,000 reduces adjusted net income and extends the relevant income tax bands. It is **not** also deducted from taxable earnings; that would duplicate basic-rate relief.
4. Relief is limited by the higher of £3,600 gross and remaining relevant earnings for eligible RAS members. Low earners are not automatically restricted to £3,600 merely because they pay no Income Tax. Dividends are not relevant earnings. Excess personal contributions receive no additional relief in the model.
5. A gross personal payment without provider relief is treated as a contribution for which relief is claimed from HMRC, limited by remaining relevant earnings.
6. Self-employed users get personal pension relief, but not salary sacrifice, employment contributions or Class 4 NI relief from pension payments.
7. The high-income annual allowance taper is estimated. DB input is approximated as 16 × annual accrual. Carry-forward, the Money Purchase Annual Allowance, existing DB benefit revaluation, lump sums and any annual allowance tax charge are excluded. Assumes eligibility for pension relief, including age under 75.

Take-home includes the effect of eligible additional relief claimed from HMRC. This can be received separately from payroll, so annual cash and payslip cash may differ in timing.

## Payroll planner

Rows start with evenly distributed salary and the entire entered bonus in the first period. The user can move or edit the bonus. Rows persist during input changes until explicitly reset; other calculator settings apply immediately. Changing pay frequency rebuilds the rows.

NI uses published whole-pound monthly / weekly thresholds; fortnightly thresholds are twice weekly thresholds. Student loan deductions are floored per pay period. The planner accounts for additional salary sacrifice, qualifying-earnings or full-pay workplace contributions, personal payments and DB contributions. Actual period pension costs are reconciled back into the annual liability calculation so that uneven qualifying earnings are not counted differently at year-end.

The row’s final cash column is explicitly **before Income Tax**. The year-end result replaces annual NI / loan approximations with period deductions and includes annual tax, dividends, HICBC and any additional estimated Self Assessment loan liability. It does not simulate cumulative PAYE withholding, custom tax codes, refund eligibility, or historic within-year NI changes. “Tax already paid” is compared with the full-year estimated liability; it is not a claim of a current HMRC debt.

## Student loans and Child Benefit

Multiple undergraduate plans share one 9% deduction above the lowest applicable threshold. Postgraduate repayments add 6%. Plan 5 repayments start in April 2026. Assume repayment eligibility has begun and there is an outstanding balance. Dividends over £2,000 enter the annual Self Assessment loan income base. Other unearned income and student loan refund eligibility are not modelled.

Child Benefit assumes eligibility for 52 weeks and that the user has the higher adjusted net income in their household. The charge appears among deductions in either recipient mode. Partner income, partial years, shared custody, benefit interactions and childcare eligibility are outside the model.

## Historical approximations

2022/23 NI retains effective annual thresholds/rates because both changed within the year. 2023/24 employee NI uses an 11.5% average main rate (nine months at 12%, three at 10%) for even monthly pay. These are disclosed approximations, particularly for irregular earnings. The 2025/26 Plan 4 threshold, pre-2026 Plan 5 repayment dates and 2020/21 qualifying-earnings ceiling were corrected during this review.

## Validation and maintenance

`src/utils/TaxRegression.test.ts` covers published reference amounts, relief-at-source regressions, high-income allowance effects, Scottish relief, NI exemptions, pension earnings caps, payroll reconciliation, target salary solving and the cash identity across thresholds. `src/utils/TaxCalc.test.ts` retains the original engine coverage with corrected expectations where the previous tests encoded incorrect rules.

React integration tests cover input validation, period changes and pension deductions. `tests/e2e/calculator.spec.ts` exercises the production build at desktop and phone sizes, including light/dark automated WCAG checks. Automated accessibility checks complement visual inspection; they do not establish complete accessibility conformance.

When adding a year, add current official sources here, place the new constants first, add reference and boundary tests, update review dates and metadata, and run unit, browser and accessibility checks. Avoid changing historical constants by blanket search-and-replace.
