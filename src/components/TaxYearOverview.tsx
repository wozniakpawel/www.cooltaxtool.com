import { useState, useMemo, useEffect } from "react";
import Chart from "react-apexcharts";
import { Container, Form, Row, Col, InputGroup, Card, Button } from "react-bootstrap";
import { calculateTaxes } from "../utils/TaxCalc";
import {
  formatCurrency,
  formatPercent,
  getApexChartOptions,
} from "../utils/chartUtils";
import InfoPopover from "./InfoPopover";
import explanations from "../utils/explanations";
import type { TaxInputs } from "../types/tax";
import type { ApexOptions } from "apexcharts";

interface PlotSetting {
  key: string;
  color: string;
  label: string;
  amountOnly?: boolean;
  percentOnly?: boolean;
  dashed?: boolean;
}

type ChartDataPoint = Record<string, number>;

const plotSettings: PlotSetting[] = [
  { key: "adjustedNetIncome", color: "#3498db", label: "Adjusted Net Income" },
  { key: "taxAllowance", color: "#1abc9c", label: "Tax Allowance", amountOnly: true },
  { key: "taxableIncome", color: "#2980b9", label: "Taxable Income" },
  { key: "incomeTax", color: "#8e44ad", label: "Income Tax" },
  { key: "dividendTax", color: "#a29bfe", label: "Dividend Tax" },
  { key: "employeeNI", color: "#e74c3c", label: "Employee NI Contributions" },
  { key: "employerNI", color: "#d35400", label: "Employer NI Contributions" },
  { key: "studentLoanRepayments", color: "#f39c12", label: "Student Loan Repayments" },
  { key: "combinedTaxes", color: "#c0392b", label: "Combined taxes (IT, EE NI, SL, HICBC)" },
  { key: "hicbc", color: "#d63031", label: "HICBC", dashed: true },
  { key: "childBenefits", color: "#35cc71", label: "Child Benefits", dashed: true },
  { key: "takeHomePay", color: "#2ecc71", label: "Take Home Pay" },
  { key: "pensionPot", color: "#27ae60", label: "Pension Pot" },
  { key: "totalYouKeep", color: "#16a085", label: "Total you keep (Pension Pot + Take Home)" },
  { key: "marginalCombinedTaxRate", color: "#f1c40f", label: "Marginal Combined Tax Rate", dashed: true, percentOnly: true },
];

type XAxisMode = "grossIncome" | "autoEnrolment" | "personalPension";

const xAxisModes: { value: XAxisMode; label: string; formatX: (v: number) => string; tooltipPrefix: string }[] = [
  { value: "grossIncome", label: "Gross income", formatX: formatCurrency, tooltipPrefix: "Gross" },
  { value: "autoEnrolment", label: "Auto enrolment %", formatX: formatPercent, tooltipPrefix: "Auto Enrolment" },
  { value: "personalPension", label: "Personal pension contribution", formatX: formatCurrency, tooltipPrefix: "Personal Contribution" },
];

const defaultSelectedKeys = ["takeHomePay", "combinedTaxes", "totalYouKeep", "pensionPot"];

const STORAGE_KEY = "cooltaxtool-plot-builder";

const validKeys = new Set(plotSettings.map((s) => s.key));

const loadStoredState = (): { xAxis: XAxisMode; selected: string[] } => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const xAxis = xAxisModes.some((m) => m.value === parsed.xAxis) ? parsed.xAxis : "grossIncome";
      const selected = Array.isArray(parsed.selected)
        ? parsed.selected.filter((k: unknown) => typeof k === "string" && validKeys.has(k))
        : defaultSelectedKeys;
      return { xAxis, selected };
    }
  } catch {
    // fall through to defaults
  }
  return { xAxis: "grossIncome", selected: defaultSelectedKeys };
};

interface TaxYearOverviewProps {
  inputs: TaxInputs;
  theme: string;
}

const TaxYearOverview = (props: TaxYearOverviewProps) => {
  const [incomeRange, setIncomeRange] = useState(props.inputs.annualGrossIncomeRange);
  const [{ xAxis, selected }, setBuilder] = useState(loadStoredState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ xAxis, selected }));
    } catch {
      // storage unavailable — selection just won't persist
    }
  }, [xAxis, selected]);

  const setXAxis = (value: XAxisMode) => setBuilder((s) => ({ ...s, xAxis: value }));
  const toggleSeries = (key: string) =>
    setBuilder((s) => ({
      ...s,
      selected: s.selected.includes(key) ? s.selected.filter((k) => k !== key) : [...s.selected, key],
    }));
  const selectAll = () => setBuilder((s) => ({ ...s, selected: plotSettings.map((p) => p.key) }));
  const clearAll = () => setBuilder((s) => ({ ...s, selected: [] }));

  const xMode = xAxisModes.find((m) => m.value === xAxis) ?? xAxisModes[0];

  const chartData = useMemo(() => {
    let xValues: number[];
    let buildInputs: (x: number) => TaxInputs;
    // the swept variable expressed in £, for the marginal-rate delta
    let xPounds: (x: number, grossIncome: number) => number;

    switch (xAxis) {
      case "autoEnrolment":
        xValues = Array.from({ length: 61 }, (_, i) => i * 0.5);
        buildInputs = (x) => ({
          ...props.inputs,
          pensionEnabled: true,
          pensionContributions: { ...props.inputs.pensionContributions, autoEnrolment: x },
        });
        xPounds = (x, grossIncome) => (x / 100) * grossIncome;
        break;
      case "personalPension": {
        const totalIncome = Math.max(props.inputs.annualGrossSalary + props.inputs.annualGrossBonus, 1000);
        xValues = Array.from({ length: 200 }, (_, i) => (i * totalIncome) / 200);
        buildInputs = (x) => ({
          ...props.inputs,
          pensionEnabled: true,
          pensionContributions: { ...props.inputs.pensionContributions, personal: x },
        });
        xPounds = (x) => x;
        break;
      }
      case "grossIncome":
      default:
        xValues = Array.from({ length: 200 }, (_, i) => (i * Math.max(incomeRange, 1000)) / 200);
        buildInputs = (x) => ({ ...props.inputs, annualGrossBonus: 0, annualGrossSalary: x });
        xPounds = (_x, grossIncome) => grossIncome;
        break;
    }

    const data: ChartDataPoint[] = xValues.map((x) => {
      const { annualGrossIncome, taxAllowance, incomeTax, dividendTax, employeeNI, employerNI, pensionPot, studentLoanRepayments, childBenefits, pensionAnnualAllowance: _pensionAnnualAllowance, dbPension: _dbPension, ...rest } =
        calculateTaxes(buildInputs(x));
      return {
        xValue: x,
        annualGrossIncome: annualGrossIncome.total,
        taxAllowance: taxAllowance.total,
        incomeTax: incomeTax.total,
        dividendTax: dividendTax.total,
        employeeNI: employeeNI.total,
        employerNI: employerNI.total,
        pensionPot: pensionPot.total,
        studentLoanRepayments: studentLoanRepayments.total,
        childBenefits: childBenefits.total,
        ...rest,
      };
    });

    // Marginal tax rate: change in combined taxes per £1 of the swept variable
    for (let i = 1; i < data.length; i++) {
      const deltaTaxes = data[i].combinedTaxes - data[i - 1].combinedTaxes;
      const deltaPounds = xPounds(xValues[i], data[i].annualGrossIncome) - xPounds(xValues[i - 1], data[i - 1].annualGrossIncome);
      data[i].marginalCombinedTaxRate = deltaPounds > 0 ? Math.ceil((deltaTaxes / deltaPounds) * 100) : 0;
    }
    data[0].marginalCombinedTaxRate = 0;

    return data;
  }, [props.inputs, incomeRange, xAxis]);

  const percentageData = useMemo(() => {
    return chartData.map((d) => {
      const gross = d.annualGrossIncome || 1;
      const result: ChartDataPoint = { xValue: d.xValue };
      plotSettings.forEach((s) => {
        if (!s.amountOnly) {
          result[s.key] = s.key === "marginalCombinedTaxRate"
            ? d[s.key]
            : Math.max(0, Math.min(100, (d[s.key] / gross) * 100));
        }
      });
      return result;
    });
  }, [chartData]);

  const contextVisible = (setting: PlotSetting): boolean => {
    if ((setting.key === "employeeNI" || setting.key === "employerNI") && props.inputs.noNI) return false;
    if (setting.key === "studentLoanRepayments" && (!props.inputs.studentLoanEnabled || props.inputs.studentLoan.length === 0)) return false;
    if (setting.key === "pensionPot" && !props.inputs.pensionEnabled && xAxis === "grossIncome") return false;
    if (setting.key === "childBenefits" && props.inputs.childBenefits.mode !== 'self') return false;
    if (setting.key === "hicbc" && props.inputs.childBenefits.mode !== 'partner') return false;
    return true;
  };

  const visibleSettingsAmount = useMemo(() => {
    return plotSettings.filter((s) => !s.percentOnly && selected.includes(s.key) && contextVisible(s));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, xAxis, props.inputs.noNI, props.inputs.studentLoanEnabled, props.inputs.studentLoan.length, props.inputs.pensionEnabled, props.inputs.childBenefits.mode]);

  const visibleSettingsPercent = useMemo(() => {
    return plotSettings.filter((s) => !s.amountOnly && selected.includes(s.key) && contextVisible(s));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, xAxis, props.inputs.noNI, props.inputs.studentLoanEnabled, props.inputs.studentLoan.length, props.inputs.pensionEnabled, props.inputs.childBenefits.mode]);

  const buildSeries = (data: ChartDataPoint[], visibleSettings: PlotSetting[]) => {
    return visibleSettings.map((setting) => ({
      name: setting.label,
      data: data.map((d) => ({ x: d.xValue, y: d[setting.key] })),
    }));
  };

  const buildOptions = (isPercentage: boolean, visibleSettings: PlotSetting[]): ApexOptions => {
    const baseOptions = getApexChartOptions(props.theme, { isPercentage });

    return {
      ...baseOptions,
      colors: visibleSettings.map((s) => s.color),
      stroke: {
        ...baseOptions.stroke,
        dashArray: visibleSettings.map((s) => (s.dashed ? 5 : 0)),
      },
      xaxis: {
        ...baseOptions.xaxis,
        labels: {
          ...baseOptions.xaxis?.labels,
          formatter: (value: string) => xMode.formatX(Number(value)),
        },
      },
      tooltip: {
        ...baseOptions.tooltip,
        x: {
          formatter: (value: number) => `${xMode.tooltipPrefix}: ${xMode.formatX(value)}`,
        },
        y: {
          formatter: (value: number) => (isPercentage ? formatPercent(value) : formatCurrency(value)),
        },
      },
    };
  };

  const percentOptions = buildOptions(true, visibleSettingsPercent);
  const amountOptions = buildOptions(false, visibleSettingsAmount);

  const percentSeries = buildSeries(percentageData, visibleSettingsPercent);
  const amountSeries = buildSeries(chartData, visibleSettingsAmount);

  return (
    <Container>
      <Card className="mb-3">
        <Card.Body>
          <Card.Title>Plot builder</Card.Title>
          <Form.Group as={Row} controlId="plotBuilderXAxis" className="mb-2">
            <Form.Label column sm={4}>X axis</Form.Label>
            <Col>
              <Form.Select value={xAxis} onChange={(e) => setXAxis(e.target.value as XAxisMode)}>
                {xAxisModes.map((mode) => (
                  <option key={mode.value} value={mode.value}>{mode.label}</option>
                ))}
              </Form.Select>
            </Col>
          </Form.Group>

          {xAxis === "grossIncome" && (
            <Form.Group as={Row} controlId="incomeRange" className="mb-2">
              <Form.Label column sm={4}>Income range <InfoPopover {...explanations.annualGrossIncomeRange} /></Form.Label>
              <Col>
                <InputGroup>
                  <InputGroup.Text>£</InputGroup.Text>
                  <Form.Control
                    type="number"
                    inputMode="decimal"
                    value={incomeRange || ''}
                    onChange={(e) => setIncomeRange(Number(e.target.value))}
                    min={10000}
                    step={10000}
                  />
                </InputGroup>
              </Col>
            </Form.Group>
          )}

          <div className="d-flex align-items-center justify-content-between mb-1">
            <Form.Label className="mb-0">Series</Form.Label>
            <div>
              <Button variant="outline-secondary" size="sm" className="me-2" onClick={selectAll}>Select all</Button>
              <Button variant="outline-secondary" size="sm" onClick={clearAll}>Clear</Button>
            </div>
          </div>
          <Row>
            {plotSettings.map((setting) => (
              <Col xs={12} sm={6} lg={4} key={setting.key}>
                <Form.Check
                  type="checkbox"
                  id={`plot-series-${setting.key}`}
                  label={setting.label}
                  checked={selected.includes(setting.key)}
                  onChange={() => toggleSeries(setting.key)}
                />
              </Col>
            ))}
          </Row>
        </Card.Body>
      </Card>

      <h5 className="text-center mt-3">Percentages of gross income</h5>
      <Chart
        options={percentOptions}
        series={percentSeries}
        type="line"
        height={350}
      />
      <h5 className="text-center mt-3">Annual total amounts</h5>
      <Chart
        options={amountOptions}
        series={amountSeries}
        type="line"
        height={350}
      />
    </Container>
  );
};

export default TaxYearOverview;
