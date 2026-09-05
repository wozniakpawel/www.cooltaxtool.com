# Calculator overhaul and GitHub issue plan

## Repository review

Reviewed the site, tax engine, existing tests and open issues on 5 September 2026. GitHub returned one open issue: [#42 — Calculate combined expenses instead of combined taxes](https://github.com/wozniakpawel/www.cooltaxtool.com/issues/42), asking that pension contributions be included.

## Delivery sequence

1. **Correct the calculation foundation.** Add 2026/27 rates; correct RAS double relief and low-earner limits; prevent self-employed salary sacrifice; retain employer NI for employee-exempt users; correct Plan 5 start dates and older Plan 4 / qualifying earnings values. Document and test the rules.
2. **Implement #42.** Add explicit employee pension cash cost and total deductions. Reconcile gross income with deductions and take-home. Exclude employer funding and provider relief from employee costs. Use those definitions in the overview, tables, CSV and explorer.
3. **Rebuild the everyday experience.** Replace the dense first screen with progressive inputs, a take-home summary, allocation chart, pay-rise insight, period table, tax-band slices and contextual explanations. Add responsive layouts, light/dark themes, accessible labels and local-only calculations.
4. **Improve planning tools.** Add a fixed-baseline salary/pension comparison and reverse salary target solver. Offer a guided explorer while retaining the advanced chart builder. Repair PAYE pension handling, payroll thresholds, bonus initialisation and misleading pre-tax / HMRC-balance labels.
5. **Verify and make maintenance repeatable.** Add browser and accessibility checks; audit dependencies; document local development, model limitations and source review. Add CI for tests, builds and browser checks.

The implementation has since been committed and pushed to `master`. GitHub issue #42 is still open as of the 5 September 2026 repository-sync check; closing the issue is a separate follow-up. The original implementation review below records local verification, not a current deployment-status check.

## Acceptance for #42

- Total deductions include Income Tax, dividend tax, employee / self-employed NI, loan repayments, HICBC and employee pension costs.
- Salary sacrifice is counted once as foregone salary; employer contributions and provider tax relief are excluded from the employee deduction total.
- The cash identity `gross income = total deductions + take-home` holds even for unaffordable pension inputs (negative take-home is explicit).
- Overview, export, breakdown and chart options share these definitions.
- Automated regressions span £0, allowances, main-rate thresholds and high-income cases.

## Future expansion priorities

These are separate models, not features silently approximated by the current calculator:

1. Savings interest and rental income, with savings allowances and loss rules.
2. Custom tax codes, cumulative PAYE and year-to-date employment changes.
3. Household comparisons, partner income, childcare eligibility and benefit interactions.
4. Mixed employment/self-employment, pension carry-forward and actual DB pension input.
5. Dedicated capital gains, property transaction and company/director calculators.

Each needs its own official-source audit, input model, worked examples and regression suite before inclusion. The live assumptions panel names unsupported cases so users can judge whether their situation fits.

## Local verification completed

- 144 calculation and React integration tests passed.
- 14 production browser tests passed across desktop and phone layouts.
- Automated WCAG 2 A/AA and WCAG 2.1 AA checks passed for light/dark overview and expanded optional inputs.
- TypeScript and Vite production build passed (also run by the browser test server).
- Dependency audit reported zero known vulnerabilities after compatible updates and removal of unused form dependencies.
- Visually inspected desktop, phone and dark-mode screenshots. No page-wide horizontal overflow in the tested views; wide data tables scroll within their own containers.

The chart library is loaded on demand; Vite still reports a size advisory for its approximately 160 kB gzipped explorer chunk. It is not part of the initial overview payload. The CI configuration has since been pushed to GitHub; consult the workflow runs for its current status.
