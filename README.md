# CoolTaxTool

A free, open-source UK income calculator that explains what you earn, what you keep and how changes affect your finances.

Live site: [cooltaxtool.com](https://cooltaxtool.com). The `master` branch deploys through Netlify; merging into it changes production.

## Calculator features

- UK and Scottish Income Tax, NI, dividends and historical tax years through 2026/27.
- Employment or sole-trader profits, bonuses and part-time salary scaling.
- Salary sacrifice, net-pay and personal pensions, employer contributions, qualifying earnings, and simplified DB accrual.
- Student loan plans, Child Benefit and the high-income charge.
- Take-home summary, allocation chart, tax-band explanation, period breakdown and CSV export.
- Salary/pension scenario comparison, target take-home salary solver, guided income/pension charts and an advanced plot builder.
- PAYE planning for monthly, fortnightly or weekly pay, with editable bonuses and pay rises.
- Responsive light/dark UI. Calculation inputs stay in memory; only theme and optional chart-display preferences use local storage. No analytics scripts.

Read [calculation methodology and official sources](docs/tax-methodology.md) before interpreting results. The tool is an annual planning estimate, not payroll software or a complete tax return. The [overhaul plan](docs/plans/2026-09-05-calculator-overhaul.md) records issue #42 and future expansion priorities.

## Development

Use a modern Node.js release supported by Vite (Node 22.12+ or 24 LTS) and npm.

```sh
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000). The site updates when source files change.

```sh
npm test                 # calculation and React integration tests
npm run build            # TypeScript check and production build into build/
npm run preview          # serve the production build
npx playwright install chromium
npm run test:e2e          # production browser and accessibility checks
npm audit                # dependency advisories
```

Browser tests run their own production preview on port 4173. They test desktop and mobile layouts and save screenshots/traces for failures to `test-results/`. These files are ignored by Git. The overview accessibility test also saves light/dark screenshots there.

## Structure

- `src/utils/TaxYears.ts`: per-year constants.
- `src/utils/TaxCalc.ts`: annual tax and pension calculation engine.
- `src/utils/Payroll.ts`: per-period deductions and annual reconciliation.
- `src/utils/scenarios.ts`: comparisons and target salary solver.
- `src/utils/results.ts`: shared result definitions, periods and CSV export.
- `src/components/UserMenu.tsx`: validated inputs and progressive sections.
- `src/components/dashboard/`: overview, guided explorer, comparison and source/assumption guide.
- `tests/e2e/`: Playwright interaction and axe accessibility tests.

## Contributing

[Report an issue](https://github.com/wozniakpawel/www.cooltaxtool.com/issues) or open a pull request. Calculation changes should include a primary source and independently worked expected amounts. Run the test suite and production build before submitting. For UI changes, run browser tests and inspect both desktop and phone layouts.

## Support

[Buy Pawel a coffee](https://www.buymeacoffee.com/wozniakpawel) or [sponsor the project](https://github.com/sponsors/wozniakpawel).
