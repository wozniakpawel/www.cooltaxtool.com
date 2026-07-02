import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import TaxYearOverview from "./TaxYearOverview";
import type { TaxInputs } from "../types/tax";

// Override the global stub with one that captures the series passed to the chart
vi.mock('react-apexcharts', () => ({
  default: function MockChart(props: { series: { name: string }[] }) {
    return (
      <div
        data-testid="mock-chart"
        data-series={JSON.stringify(props.series.map((s) => s.name))}
      />
    );
  },
}));

const testInputs: TaxInputs = {
  taxYear: '2024/25',
  studentLoan: [],
  annualGrossSalary: 50000,
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
  dbPensionEnabled: false,
  dbMemberContribution: 0,
  dbAccrualDenominator: 57,
  taxReliefAtSource: true,
  pensionEnabled: false,
  studentLoanEnabled: false,
};

const amountChartSeries = (): string[] => {
  const charts = screen.getAllByTestId("mock-chart");
  // second chart is "Annual total amounts"
  return JSON.parse(charts[1].getAttribute("data-series") ?? "[]");
};

describe("TaxYearOverview plot builder", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders the plot builder panel with the income range input by default", () => {
    render(<TaxYearOverview inputs={testInputs} theme="light" />);
    expect(screen.getByText("Plot builder")).toBeInTheDocument();
    expect(screen.getByText(/Income range/)).toBeInTheDocument();
  });

  it("checks the default starter series and leaves the rest unchecked", () => {
    render(<TaxYearOverview inputs={testInputs} theme="light" />);
    expect(screen.getByLabelText("Take Home Pay")).toBeChecked();
    expect(screen.getByLabelText("Combined taxes (IT, EE NI, SL, HICBC)")).toBeChecked();
    expect(screen.getByLabelText("Total you keep (Pension Pot + Take Home)")).toBeChecked();
    expect(screen.getByLabelText("Income Tax")).not.toBeChecked();
    expect(screen.getByLabelText("Employee NI Contributions")).not.toBeChecked();
  });

  it("removes a series from the chart when its checkbox is unticked", () => {
    render(<TaxYearOverview inputs={testInputs} theme="light" />);
    expect(amountChartSeries()).toContain("Take Home Pay");
    fireEvent.click(screen.getByLabelText("Take Home Pay"));
    expect(amountChartSeries()).not.toContain("Take Home Pay");
  });

  it("select all and clear drive the plotted series", () => {
    render(<TaxYearOverview inputs={testInputs} theme="light" />);
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(amountChartSeries()).toHaveLength(0);
    fireEvent.click(screen.getByRole("button", { name: "Select all" }));
    expect(amountChartSeries().length).toBeGreaterThan(5);
  });

  it("hides the income range input for the auto enrolment sweep", () => {
    render(<TaxYearOverview inputs={testInputs} theme="light" />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "autoEnrolment" } });
    expect(screen.queryByText(/Income range/)).not.toBeInTheDocument();
    // switching back restores it
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "grossIncome" } });
    expect(screen.getByText(/Income range/)).toBeInTheDocument();
  });

  it("persists the selection in localStorage", () => {
    render(<TaxYearOverview inputs={testInputs} theme="light" />);
    fireEvent.click(screen.getByLabelText("Income Tax"));
    const stored = JSON.parse(localStorage.getItem("cooltaxtool-plot-builder") ?? "{}");
    expect(stored.selected).toContain("incomeTax");
  });
});
