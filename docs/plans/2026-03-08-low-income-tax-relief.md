# Low Income Pension Tax Relief Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Cap pension relief at source to £2,880 for non-taxpayers, per HMRC rules.

**Architecture:** Modify `grossManualPensionContributions()` to accept gross income and basic allowance. When gross income <= basic allowance (non-taxpayer), only the first £2,880 of personal contributions gets the 20% relief top-up. Pass the two new parameters from `calculateTaxes()`.

**Tech Stack:** TypeScript, Vitest

---

### Task 1: Add failing tests for low-income tax relief cap

**Files:**
- Modify: `src/utils/TaxCalc.test.ts:269-280`

**Step 1: Write the failing tests**

Add these tests inside the existing `describe('grossManualPensionContributions')` block (after line 279):

```typescript
  it('should cap relief at £2,880 for non-taxpayers', () => {
    // Non-taxpayer (income £10,000, allowance £12,570) contributing £5,000
    // Only first £2,880 gets grossed up: £2,880 * 1.25 + £2,120 = £5,720
    const result = grossManualPensionContributions(5000, true, 10000, 12570);
    expect(result).toBe(5720);
  });

  it('should give full relief to non-taxpayers contributing under £2,880', () => {
    // Non-taxpayer contributing £2,000 — all gets relief
    const result = grossManualPensionContributions(2000, true, 10000, 12570);
    expect(result).toBe(2500);
  });

  it('should give full relief to taxpayers regardless of amount', () => {
    // Taxpayer (income £50,000) contributing £5,000 — full relief
    const result = grossManualPensionContributions(5000, true, 50000, 12570);
    expect(result).toBe(6250);
  });

  it('should not gross up non-taxpayer contributions without relief at source', () => {
    const result = grossManualPensionContributions(5000, false, 10000, 12570);
    expect(result).toBe(5000);
  });
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/utils/TaxCalc.test.ts`
Expected: FAIL — `grossManualPensionContributions` only accepts 2 arguments

**Step 3: Commit**

```bash
git add src/utils/TaxCalc.test.ts
git commit -m "test: add failing tests for low-income pension relief cap (#55)"
```

---

### Task 2: Update existing tests to pass new parameters

**Files:**
- Modify: `src/utils/TaxCalc.test.ts:269-280`

The two existing `grossManualPensionContributions` tests need updating to pass the new parameters. Use a taxpayer income (e.g., 50000) so their expected values don't change.

**Step 1: Update existing tests**

Change lines 270-279 from:

```typescript
  it('should gross up contributions with tax relief at source', () => {
    // £800 contribution becomes £1,000 with 25% tax relief
    const result = grossManualPensionContributions(800, true);
    expect(result).toBe(1000);
  });

  it('should not gross up contributions without tax relief at source', () => {
    const result = grossManualPensionContributions(800, false);
    expect(result).toBe(800);
  });
```

To:

```typescript
  it('should gross up contributions with tax relief at source', () => {
    // £800 contribution becomes £1,000 with 25% tax relief (taxpayer)
    const result = grossManualPensionContributions(800, true, 50000, 12570);
    expect(result).toBe(1000);
  });

  it('should not gross up contributions without tax relief at source', () => {
    const result = grossManualPensionContributions(800, false, 50000, 12570);
    expect(result).toBe(800);
  });
```

**Step 2: Run tests to verify they still fail**

Run: `npx vitest run src/utils/TaxCalc.test.ts`
Expected: Still FAIL — function signature hasn't changed yet

**Step 3: Commit**

```bash
git add src/utils/TaxCalc.test.ts
git commit -m "test: update existing pension relief tests with new parameters (#55)"
```

---

### Task 3: Implement the low-income relief cap

**Files:**
- Modify: `src/utils/TaxCalc.ts:253-259` (function signature and logic)
- Modify: `src/utils/TaxCalc.ts:294` (call site)

**Step 1: Update `grossManualPensionContributions` function**

Replace lines 253-259:

```typescript
// Calculate personal pension contribution value, depending if the tax is relieved at source
export function grossManualPensionContributions(
    personalContribution: number,
    taxReliefAtSource: boolean
): number {
    return taxReliefAtSource ? personalContribution * 1.25 : personalContribution;
}
```

With:

```typescript
// Calculate personal pension contribution value, depending if the tax is relieved at source.
// Non-taxpayers (income <= basicAllowance) only get relief on the first £2,880 per HMRC rules.
const LOW_INCOME_RELIEF_CAP = 2880;

export function grossManualPensionContributions(
    personalContribution: number,
    taxReliefAtSource: boolean,
    annualGrossIncome: number,
    basicAllowance: number
): number {
    if (!taxReliefAtSource) return personalContribution;

    if (annualGrossIncome > basicAllowance) {
        return personalContribution * 1.25;
    }

    const relieved = Math.min(personalContribution, LOW_INCOME_RELIEF_CAP);
    const unrelieved = Math.max(0, personalContribution - LOW_INCOME_RELIEF_CAP);
    return relieved * 1.25 + unrelieved;
}
```

**Step 2: Update the call site in `calculateTaxes`**

Replace line 294:

```typescript
    const grossedPersonalContribution = grossManualPensionContributions(pensionContributions.personal, taxReliefAtSource);
```

With:

```typescript
    const grossedPersonalContribution = grossManualPensionContributions(
        pensionContributions.personal,
        taxReliefAtSource,
        annualGrossIncome.total,
        constants.taxAllowance.basicAllowance
    );
```

**Step 3: Run tests to verify they all pass**

Run: `npx vitest run src/utils/TaxCalc.test.ts`
Expected: ALL PASS (existing + new tests)

**Step 4: Commit**

```bash
git add src/utils/TaxCalc.ts
git commit -m "feat: cap pension relief at source to £2,880 for non-taxpayers (#55)"
```

---

### Task 4: Update the explanation text

**Files:**
- Modify: `src/utils/explanations.ts`

**Step 1: Find and update the `taxReliefAtSource` explanation**

The existing explanation for `taxReliefAtSource` should mention the £2,880 cap for non-taxpayers. Update the `content` field to append:

```
Note: if you do not pay Income Tax (e.g. because your income is below the Personal Allowance), relief at source only applies to the first £2,880 of contributions per tax year (grossed up to £3,600).
```

**Step 2: Run the full test suite**

Run: `npx vitest run`
Expected: ALL PASS

**Step 3: Commit**

```bash
git add src/utils/explanations.ts
git commit -m "docs: update relief at source explanation with low-income cap (#55)"
```
