import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import TaxBreakdown from "./TaxBreakdown";
import type { TaxInputs } from "../../types/tax";

const testInputs: TaxInputs = {
  taxYear: '2024/25',
  studentLoan: [],
  annualGrossSalary: 52000,
  annualGrossBonus: 0,
  annualGrossDividends: 0,
  annualGrossIncomeRange: 150000,
  workingDaysPerWeek: 5,
  selfEmployed: false,
  residentInScotland: false,
  noNI: false,
  blind: false,
  childBenefits: { mode: 'off', numberOfChildren: 1 },
  pensionContributions: { autoEnrolment: 0, autoEnrolmentEmployer: 0, salarySacrifice: 0, personal: 0 },
  salarySacrificeIsPercentage: false,
  autoEnrolmentAsSalarySacrifice: true,
  autoEnrolmentOnQualifyingEarnings: false,
  employerNISavingsToPension: false,
  taxReliefAtSource: true,
  incomeAnalysis: false,
  pensionEnabled: false,
  studentLoanEnabled: false,
};

describe("TaxBreakdown", () => {
  it("renders period toggle with 4 buttons", () => {
    render(<TaxBreakdown inputs={testInputs} />);
    expect(screen.getByRole("button", { name: "Annual" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Monthly" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Weekly" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Daily" })).toBeDefined();
  });

  it("defaults to annual view", () => {
    render(<TaxBreakdown inputs={testInputs} />);
    // £52,000 annual gross income should appear (may appear in multiple cells)
    expect(screen.getAllByText("£52,000.00").length).toBeGreaterThan(0);
  });

  it("switches to monthly view when Monthly is clicked", () => {
    render(<TaxBreakdown inputs={testInputs} />);
    fireEvent.click(screen.getByRole("button", { name: "Monthly" }));
    // £52,000 / 12 = £4,333.33
    expect(screen.getAllByText("£4,333.33").length).toBeGreaterThan(0);
  });

  it("switches back to annual view", () => {
    render(<TaxBreakdown inputs={testInputs} />);
    fireEvent.click(screen.getByRole("button", { name: "Monthly" }));
    fireEvent.click(screen.getByRole("button", { name: "Annual" }));
    expect(screen.getAllByText("£52,000.00").length).toBeGreaterThan(0);
  });

  it("shows the pension savings summary when contributions are made", () => {
    const { container } = render(
      <TaxBreakdown
        inputs={{
          ...testInputs,
          annualGrossSalary: 50000,
          pensionEnabled: true,
          pensionContributions: { ...testInputs.pensionContributions, salarySacrifice: 5000 },
        }}
      />
    );
    const alert = container.querySelector('.alert-info');
    expect(alert).not.toBeNull();
    const text = alert!.textContent!;
    expect(text).toContain('Pension savings summary');
    expect(text).toContain('gain £5,000.00 in your pension pot');
    // £5,000 sacrificed at basic rate saves 20% tax + 8% NI = £1,400
    expect(text).toContain('£1,400.00 more than it cost you');
    expect(text).toContain('£1,400.00 saved in tax, NI and student loan');
    // no employer money in this scenario
    expect(text).not.toContain('employer contributions');
  });

  it("does not show the pension savings summary when pension is disabled", () => {
    const { container } = render(<TaxBreakdown inputs={testInputs} />);
    expect(container.querySelector('.alert-info')).toBeNull();
  });
});
