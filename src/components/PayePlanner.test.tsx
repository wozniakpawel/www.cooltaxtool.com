import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import PayePlanner from "./PayePlanner";
import type { TaxInputs } from "../types/tax";

const testInputs: TaxInputs = {
  taxYear: '2024/25',
  studentLoan: [],
  annualGrossSalary: 36000,
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
  pensionEnabled: false,
  studentLoanEnabled: false,
};

describe("PayePlanner", () => {
  it("renders 12 month rows with the annual salary split evenly", () => {
    render(<PayePlanner inputs={testInputs} theme="light" />);
    const salaryInputs = screen.getAllByLabelText(/gross salary$/i);
    expect(salaryInputs).toHaveLength(12);
    salaryInputs.forEach(input => {
      expect((input as HTMLInputElement).value).toBe("3000");
    });
  });

  it("applies a pay rise from the selected month", () => {
    render(<PayePlanner inputs={testInputs} theme="light" />);
    fireEvent.change(screen.getByLabelText("Pay rise month"), { target: { value: "6" } });
    fireEvent.change(screen.getByLabelText("Pay rise new annual salary"), { target: { value: "60000" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply pay rise" }));

    const salaryInputs = screen.getAllByLabelText(/gross salary$/i) as HTMLInputElement[];
    // months 0-5 keep 3,000; months 6-11 get 60,000/12 = 5,000
    expect(salaryInputs.slice(0, 6).every(i => i.value === "3000")).toBe(true);
    expect(salaryInputs.slice(6).every(i => i.value === "5000")).toBe(true);
  });

  it("shows a totals row", () => {
    render(<PayePlanner inputs={testInputs} theme="light" />);
    expect(screen.getByText("Total")).toBeDefined();
  });

  it("switches to weekly pay periods with 52 rows", () => {
    render(<PayePlanner inputs={testInputs} theme="light" />);
    fireEvent.click(screen.getByRole("button", { name: "Weekly" }));
    const salaryInputs = screen.getAllByLabelText(/gross salary$/i) as HTMLInputElement[];
    expect(salaryInputs).toHaveLength(52);
    // 36,000 / 52 = 692.3076... rounded to 2dp in the input
    expect(salaryInputs[0].value).toBe("692.31");
  });

  it("switches to fortnightly pay periods with 26 rows", () => {
    render(<PayePlanner inputs={testInputs} theme="light" />);
    fireEvent.click(screen.getByRole("button", { name: "Fortnightly" }));
    expect(screen.getAllByLabelText(/gross salary$/i)).toHaveLength(26);
  });

  it("shows an info message instead of the table for the self-employed", () => {
    render(<PayePlanner inputs={{ ...testInputs, selfEmployed: true }} theme="light" />);
    expect(screen.getByText(/employment income only/i)).toBeDefined();
    expect(screen.queryByText("Total")).toBeNull();
  });
});
