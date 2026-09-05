# Low Income Tax Relief Design

**Issue:** #55 — Corner case: tax relief for low incomes

**Goal:** When a non-taxpayer contributes to a personal pension with relief at source, cap the relief at £2,880 net contribution (£3,600 gross), per HMRC rules.

## HMRC Rule

> If you do not pay Income Tax, you still automatically get tax relief at 20% on the first £2,880 you pay into a pension each tax year if both:
> - you do not pay Income Tax, for example because you're on a low income
> - your pension provider claims tax relief for you at a rate of 20% (relief at source)

## Architecture

Modify `grossManualPensionContributions()` in `src/utils/TaxCalc.ts` to accept two additional parameters: `annualGrossIncome` and `basicAllowance`.

Logic:
1. If `taxReliefAtSource` is off — return contribution as-is (unchanged)
2. If `annualGrossIncome > basicAllowance` (taxpayer) — gross up full contribution (unchanged)
3. If `annualGrossIncome <= basicAllowance` (non-taxpayer) — gross up only first £2,880:

```
grossed = min(contribution, 2880) * 1.25 + max(0, contribution - 2880)
```

Non-taxpayer status determined by gross income before pension deductions (approach a — avoids circularity).

## Call Site

In `calculateTaxes()`, pass `annualGrossIncome.total` and `constants.taxAllowance.basicAllowance` to the function.

## Testing

- Existing tests pass unchanged (taxpayer scenarios)
- Non-taxpayer with contribution <= £2,880 gets full relief
- Non-taxpayer with contribution > £2,880 gets capped relief
- Taxpayer just above allowance gets full relief (boundary)

## What Doesn't Change

- UI — no new inputs
- Types — no type changes
- Downstream calculations — use grossed value as before
