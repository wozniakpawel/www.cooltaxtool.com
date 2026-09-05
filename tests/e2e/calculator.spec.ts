import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('salary, Scotland, pension and periods reconcile in the visible UI', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.locator('.hero-amount')).toContainText('£2,993.30');
  await page.getByLabel('Where do you pay tax?').selectOption('scotland');
  await expect(page.locator('.hero-amount')).toContainText('£2,960.30');
  await page.getByLabel('Where do you pay tax?').selectOption('rest');
  await page.getByText('Pension contributions', { exact: true }).click();
  await page.getByRole('switch', { name: 'Include pension', exact: true }).check();
  await page.getByLabel('Annual personal pension payment', { exact: true }).fill('800');
  await expect(page.locator('.hero-amount')).toContainText('£2,926.63');
  await page.getByRole('button', { name: 'Annual', exact: true }).click();
  await expect(page.locator('.hero-amount')).toContainText('£35,119.60');
  await expect(page.getByRole('row', { name: /Your pension contributions/ })).toContainText(
    '£800.00',
  );
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download CSV' }).click();
  expect((await downloadPromise).suggestedFilename()).toBe('cooltaxtool-2026-27.csv');
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('comparison holds its baseline and shows salary changes', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Compare scenarios', exact: true }).click();
  await expect(page.getByText('Your starting point is fixed', { exact: false })).toContainText(
    '£45,000',
  );
  await page.getByLabel('Alternative annual salary', { exact: true }).fill('60000');
  await expect(page.locator('.compare-outcome')).toContainText('£786.48');
  await page.getByLabel('Annual salary before tax', { exact: true }).fill('30000');
  await expect(page.getByText('Your starting point is fixed', { exact: false })).toContainText(
    '£45,000',
  );
  await page.getByRole('button', { name: /Use current calculator settings/ }).click();
  await expect(page.getByText('Your starting point is fixed', { exact: false })).toContainText(
    '£30,000',
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('guided and advanced charts render, with accessible sample data', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'Income explorer', exact: true }).click();
  await expect(page.locator('.apexcharts-canvas')).toBeVisible();
  await page.getByText('View sample data as a table', { exact: true }).click();
  await expect(page.getByRole('columnheader', { name: 'Take-home', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Explore pension', exact: true }).click();
  await expect(
    page.getByRole('columnheader', { name: 'Personal pension payment', exact: true }),
  ).toBeVisible();
  await page.getByText('Build your own charts', { exact: false }).click();
  await expect(page.getByText('Plot builder', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Clear', exact: true }).click();
  await page.getByRole('button', { name: 'Select all', exact: true }).click();
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('PAYE accounts for bonuses and sacrifice and labels pre-tax pay', async ({ page }) => {
  await page.goto('/');
  await page.getByText('Bonus, dividends & working days', { exact: true }).click();
  await page.getByLabel('Annual bonus', { exact: true }).fill('1200');
  await page.getByRole('button', { name: 'PAYE planner', exact: true }).click();
  await expect(page.getByLabel('April bonus', { exact: true })).toHaveValue('1200');
  await expect(
    page.getByRole('columnheader', { name: 'Before Income Tax', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Weekly', exact: true }).click();
  await expect(page.getByLabel(/gross salary$/)).toHaveCount(52);
  await page.getByLabel('Income type', { exact: true }).selectOption('self');
  await expect(page.getByText(/employment income only/)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('light and dark overview meet automated WCAG AA checks', async ({ page }) => {
  await page.goto('/');
  for (const theme of ['light', 'dark']) {
    if (theme === 'dark')
      await page.getByRole('button', { name: 'Dark mode', exact: true }).click();
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(
      results.violations.map((v) => ({
        id: v.id,
        description: v.description,
        nodes: v.nodes.map((n) => n.target),
      })),
    ).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: test.info().outputPath(`${theme}.png`), fullPage: true });
  }
});

test('expanded optional inputs remain accessible', async ({ page }) => {
  await page.goto('/');
  await page.getByText('Pension contributions', { exact: true }).click();
  await page.getByRole('switch', { name: 'Include pension', exact: true }).check();
  await page.getByText('Defined benefit / career average pension', { exact: true }).click();
  await page.getByRole('switch', { name: 'Include defined benefit scheme', exact: true }).check();
  await page.getByText('Student loans', { exact: true }).click();
  await page.getByRole('switch', { name: 'Include student loan repayments', exact: true }).check();
  await page.getByText('Child Benefit & allowances', { exact: true }).click();
  await page.getByLabel('Who receives Child Benefit?').selectOption('self');
  for (const theme of ['light', 'dark']) {
    if (theme === 'dark')
      await page.getByRole('button', { name: 'Dark mode', exact: true }).click();
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(
      result.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
    ).toEqual([]);
  }
});

test('reverse calculator finds a salary for a monthly cash target', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Compare scenarios', exact: true }).click();
  await page.getByText('Working backwards?', { exact: false }).click();
  await page.getByLabel('Target monthly take-home', { exact: true }).fill('3500');
  await page.getByRole('button', { name: 'Find annual salary', exact: false }).click();
  await expect(page.getByLabel('Alternative annual salary', { exact: true })).toHaveValue(
    '54211.38',
  );
  await expect(page.getByRole('status')).toContainText('£54,211.38');
});

test('salary and pension charts paint lines, expose the breakdown and preserve pension comparisons', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'Income explorer', exact: true }).click();
  const mainChart = page.locator('.apexcharts-canvas').first();
  for (const mode of ['Explore salary', 'Explore pension']) {
    await page.getByRole('button', { name: mode, exact: true }).click();
    await expect(mainChart.locator('.apexcharts-line')).toHaveCount(4);
    await expect(mainChart.locator('.apexcharts-datalabel')).toHaveCount(0);
    await expect(mainChart.locator('.apexcharts-legend')).toContainText('Total kept');
    // Checking path existence alone misses invisible SVG clipping regressions.
    // The rendered pixels must change when just the lines are hidden.
    await mainChart.scrollIntoViewIfNeeded();
    await page.mouse.move(0, 0);
    const visible = await mainChart.screenshot();
    await mainChart
      .locator('.apexcharts-line')
      .evaluateAll((es) => es.forEach((e) => e.setAttribute('opacity', '0')));
    const hidden = await mainChart.screenshot();
    expect(visible.equals(hidden)).toBe(false);
    await mainChart
      .locator('.apexcharts-line')
      .evaluateAll((es) => es.forEach((e) => e.removeAttribute('opacity')));
    await page.getByLabel('Show tax & pension breakdown', { exact: true }).check();
    await expect(mainChart.locator('.apexcharts-line')).toHaveCount(11);
    await expect(mainChart.locator('.apexcharts-legend')).toContainText('Your National Insurance');
    await page.getByRole('button', { name: '% of gross income', exact: true }).click();
    await expect(mainChart.locator('.apexcharts-yaxis')).toContainText('%');
    await page.getByRole('button', { name: 'Annual amounts', exact: true }).click();
    await page.getByLabel('Show tax & pension breakdown', { exact: true }).uncheck();
  }
  await expect(page.locator('.apexcharts-canvas')).toHaveCount(3);
  await expect(
    page.getByRole('heading', { name: 'Tax relief and effective tax rate' }),
  ).toBeVisible();
  await page.getByText('View pension relief data', { exact: true }).click();
  await expect(
    page.getByRole('columnheader', { name: 'Tax savings & top-up', exact: true }),
  ).toBeVisible();
  await page.getByText('View workplace pension data', { exact: true }).click();
  await expect(
    page.getByRole('columnheader', { name: 'Workplace contribution', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Dark mode', exact: true }).click();
  await expect(mainChart.locator('.apexcharts-datalabel')).toHaveCount(0);
  await page
    .locator('.view-enter')
    .screenshot({ path: test.info().outputPath('pension-charts-dark.png') });
  await page.getByLabel('Income type', { exact: true }).selectOption('self');
  await expect(
    page.getByRole('heading', { name: 'Workplace pension: cash now and money for later' }),
  ).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});
