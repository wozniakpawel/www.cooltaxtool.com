import { useMemo } from "react";
import Chart from "react-apexcharts";
import { calculateAnnualGrossIncome, calculateTaxes } from "../../utils/TaxCalc";
import {
  formatCurrency,
  formatPercent,
  getApexChartOptions,
} from "../../utils/chartUtils";
import type { TaxInputs } from "../../types/tax";

interface PensionAnalysisProps {
  inputs: TaxInputs;
  theme: string;
}

const TaxSavingsVsPensionContributions = (props: PensionAnalysisProps) => {
  const chartData = useMemo(() => {
    const annualGrossIncome = calculateAnnualGrossIncome(
      props.inputs.annualGrossSalary,
      props.inputs.annualGrossBonus
    ).total;

    // Calculate baseline taxes once (without voluntary pension)
    const taxesWithoutVoluntaryPension = calculateTaxes({
      ...props.inputs,
      pensionContributions: {
        ...props.inputs.pensionContributions,
        personal: 0,
      },
    });

    const pensionContributions = Array.from(
      { length: 200 },
      (_, i) => (i * annualGrossIncome) / 200
    );

    return pensionContributions.map((pensionContribution) => {
      const taxesWithVoluntaryPension = calculateTaxes({
        ...props.inputs,
        pensionContributions: {
          ...props.inputs.pensionContributions,
          personal: pensionContribution,
        },
      });

      const taxSavings =
        taxesWithoutVoluntaryPension.combinedTaxes -
        taxesWithVoluntaryPension.combinedTaxes;
      const taxSavingsPercentage = pensionContribution > 0
        ? Math.max(0, Math.min(100, (taxSavings / pensionContribution) * 100))
        : 0;
      const effectiveTaxRate = annualGrossIncome > 0
        ? Math.max(0, Math.min(100, (taxesWithVoluntaryPension.combinedTaxes / annualGrossIncome) * 100))
        : 0;

      return {
        pensionContribution,
        taxSavingsPercentage,
        effectiveTaxRate,
      };
    });
  }, [props.inputs]);

  const options = useMemo(() => {
    const baseOptions = getApexChartOptions(props.theme, { isPercentage: true });

    return {
      ...baseOptions,
      colors: ["#2ecc71", "#3498db"],
      tooltip: {
        ...baseOptions.tooltip,
        x: {
          formatter: (value: number) => `Pension Contribution: ${formatCurrency(value)}`,
        },
        y: {
          formatter: (value: number) => formatPercent(value),
        },
      },
    };
  }, [props.theme]);

  const series = [
    {
      name: "Tax Savings as % of contributions",
      data: chartData.map((d) => ({ x: d.pensionContribution, y: d.taxSavingsPercentage })),
    },
    {
      name: "Effective Tax Rate",
      data: chartData.map((d) => ({ x: d.pensionContribution, y: d.effectiveTaxRate })),
    },
  ];

  return (
    <>
      <h5 className="text-center mt-3">Tax Savings and Effective Tax Rate vs Pension Contributions</h5>
      <Chart
        options={options}
        series={series}
        type="line"
        height={350}
      />
      <AutoEnrolmentSweep {...props} />
    </>
  );
};

// How take-home pay and the pension pot change as the auto enrolment
// employee percentage varies across its allowed range
const AutoEnrolmentSweep = (props: PensionAnalysisProps) => {
  const chartData = useMemo(() => {
    const percentages = Array.from({ length: 61 }, (_, i) => i * 0.5); // 0% to 30%

    return percentages.map((autoEnrolment) => {
      const taxes = calculateTaxes({
        ...props.inputs,
        pensionContributions: {
          ...props.inputs.pensionContributions,
          autoEnrolment,
        },
      });

      return {
        autoEnrolment,
        takeHomePay: taxes.takeHomePay,
        pensionPot: taxes.pensionPot.total,
        totalYouKeep: taxes.totalYouKeep,
      };
    });
  }, [props.inputs]);

  const options = useMemo(() => {
    const baseOptions = getApexChartOptions(props.theme);

    return {
      ...baseOptions,
      colors: ["#e67e22", "#9b59b6", "#2ecc71"],
      xaxis: {
        ...baseOptions.xaxis,
        labels: {
          ...baseOptions.xaxis?.labels,
          formatter: (val: string) => formatPercent(Number(val)),
        },
      },
      tooltip: {
        ...baseOptions.tooltip,
        x: {
          formatter: (value: number) => `Auto Enrolment: ${formatPercent(value)}`,
        },
        y: {
          formatter: (value: number) => formatCurrency(value),
        },
      },
    };
  }, [props.theme]);

  const series = [
    {
      name: "Take Home Pay",
      data: chartData.map((d) => ({ x: d.autoEnrolment, y: d.takeHomePay })),
    },
    {
      name: "Pension Pot",
      data: chartData.map((d) => ({ x: d.autoEnrolment, y: d.pensionPot })),
    },
    {
      name: "Total you keep",
      data: chartData.map((d) => ({ x: d.autoEnrolment, y: d.totalYouKeep })),
    },
  ];

  return (
    <>
      <h5 className="text-center mt-3">Take Home Pay and Pension Pot vs Auto Enrolment %</h5>
      <Chart
        options={options}
        series={series}
        type="line"
        height={350}
      />
    </>
  );
};

export default TaxSavingsVsPensionContributions;
