import { useMemo, useState } from "react";
import {
  Table, Card, Button, Alert, Form, Row, Col, InputGroup,
} from "react-bootstrap";
import {
  calculateMonthlyNI,
  calculateMonthlySL,
  calculateTaxes,
} from "../utils/TaxCalc";
import { taxYears } from "../utils/TaxYears";
import { formatCurrencyPrecise } from "../utils/chartUtils";
import type { TaxInputs } from "../types/tax";

interface PayePlannerProps {
  inputs: TaxInputs;
  theme: string;
}

interface MonthRow {
  salary: number;
  bonus: number;
}

// UK tax year runs April to March
const MONTH_LABELS = [
  "April", "May", "June", "July", "August", "September",
  "October", "November", "December", "January", "February", "March",
];

const buildDefaultRows = (annualSalary: number): MonthRow[] =>
  MONTH_LABELS.map(() => ({ salary: annualSalary / 12, bonus: 0 }));

const PayePlanner = ({ inputs }: PayePlannerProps) => {
  const [rows, setRows] = useState<MonthRow[]>(() => buildDefaultRows(inputs.annualGrossSalary));
  const [payRiseMonth, setPayRiseMonth] = useState(6);
  const [payRiseSalary, setPayRiseSalary] = useState(0);
  const [taxPaidSoFar, setTaxPaidSoFar] = useState(0);

  const constants = taxYears[inputs.taxYear];
  const studentLoanPlans = inputs.studentLoanEnabled ? inputs.studentLoan : [];
  const aePercent = inputs.pensionEnabled ? inputs.pensionContributions.autoEnrolment : 0;
  const aeSacrificed = inputs.pensionEnabled ? inputs.autoEnrolmentAsSalarySacrifice : true;

  const monthly = useMemo(() => rows.map(({ salary, bonus }) => {
    const grossPay = salary + bonus;
    const pension = grossPay * (aePercent / 100);
    const niablePay = aeSacrificed ? grossPay - pension : grossPay;
    const ni = calculateMonthlyNI(niablePay, constants, false, inputs.noNI);
    const sl = calculateMonthlySL(niablePay, studentLoanPlans, constants);
    const netIsh = grossPay - pension - ni.total - sl.total;
    return { grossPay, pension, ni: ni.total, sl: sl.total, netIsh };
  }), [rows, aePercent, aeSacrificed, constants, inputs.noNI, studentLoanPlans]);

  const totals = useMemo(() => monthly.reduce(
    (acc, m) => ({
      grossPay: acc.grossPay + m.grossPay,
      pension: acc.pension + m.pension,
      ni: acc.ni + m.ni,
      sl: acc.sl + m.sl,
      netIsh: acc.netIsh + m.netIsh,
    }),
    { grossPay: 0, pension: 0, ni: 0, sl: 0, netIsh: 0 }
  ), [monthly]);

  // Annual-basis comparison on the same yearly totals
  const annualBasis = useMemo(() => calculateTaxes({
    ...inputs,
    annualGrossSalary: rows.reduce((s, r) => s + r.salary, 0),
    annualGrossBonus: rows.reduce((s, r) => s + r.bonus, 0),
  }), [inputs, rows]);

  if (inputs.selfEmployed) {
    return (
      <Alert variant="info">
        The PAYE Planner applies to employment income only — the self-employed
        pay NI through self-assessment on annual profits, not per pay period.
      </Alert>
    );
  }

  const niDifference = annualBasis.employeeNI.total - totals.ni;
  const slDifference = annualBasis.studentLoanRepayments.total - totals.sl;
  const taxDue = annualBasis.incomeTax.total + annualBasis.dividendTax.total;
  const hmrcBalance = taxPaidSoFar - taxDue;

  const setRow = (index: number, field: keyof MonthRow, value: number) => {
    setRows(rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };

  return (
    <>
      <Card className="mb-3">
        <Card.Body>
          <Card.Title>PAYE Planner</Card.Title>
          <p className="small text-muted mb-2">
            NI and student loan are charged per pay period, not annually — so a
            bonus month or a mid-year pay rise changes what you actually pay.
            Edit the monthly amounts below to match your payslips.
          </p>

          <Row className="g-2 align-items-end mb-3">
            <Col xs="auto">
              <Button size="sm" variant="outline-secondary"
                onClick={() => setRows(buildDefaultRows(inputs.annualGrossSalary))}>
                Reset from annual inputs
              </Button>
            </Col>
            <Col xs="auto">
              <Form.Label className="small mb-0">Pay rise from</Form.Label>
              <Form.Select size="sm" value={payRiseMonth} aria-label="Pay rise month"
                onChange={e => setPayRiseMonth(Number(e.target.value))}>
                {MONTH_LABELS.map((label, i) => (
                  <option key={label} value={i}>{label}</option>
                ))}
              </Form.Select>
            </Col>
            <Col xs="auto">
              <Form.Label className="small mb-0">New annual salary</Form.Label>
              <InputGroup size="sm">
                <InputGroup.Text>£</InputGroup.Text>
                <Form.Control type="number" min={0} step={1000} value={payRiseSalary}
                  aria-label="Pay rise new annual salary"
                  onChange={e => setPayRiseSalary(Number(e.target.value))} />
              </InputGroup>
            </Col>
            <Col xs="auto">
              <Button size="sm" variant="outline-primary"
                onClick={() => setRows(rows.map((row, i) =>
                  i >= payRiseMonth ? { ...row, salary: payRiseSalary / 12 } : row
                ))}>
                Apply pay rise
              </Button>
            </Col>
          </Row>

          <div style={{ overflowX: "auto" }}>
            <Table size="sm" className="align-middle">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Gross Salary</th>
                  <th>Bonus</th>
                  <th className="text-end">Employee NI</th>
                  <th className="text-end">Student Loan</th>
                  <th className="text-end">Pension</th>
                  <th className="text-end">Pay after NI/SL/pension</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={MONTH_LABELS[i]}>
                    <td>{MONTH_LABELS[i]}</td>
                    <td>
                      <Form.Control size="sm" type="number" min={0} step={100}
                        aria-label={`${MONTH_LABELS[i]} gross salary`}
                        value={Math.round(row.salary * 100) / 100}
                        onChange={e => setRow(i, "salary", Number(e.target.value))} />
                    </td>
                    <td>
                      <Form.Control size="sm" type="number" min={0} step={100}
                        aria-label={`${MONTH_LABELS[i]} bonus`}
                        value={row.bonus}
                        onChange={e => setRow(i, "bonus", Number(e.target.value))} />
                    </td>
                    <td className="text-end">{formatCurrencyPrecise(monthly[i].ni)}</td>
                    <td className="text-end">{formatCurrencyPrecise(monthly[i].sl)}</td>
                    <td className="text-end">{formatCurrencyPrecise(monthly[i].pension)}</td>
                    <td className="text-end">{formatCurrencyPrecise(monthly[i].netIsh)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="fw-bold">
                  <td>Total</td>
                  <td className="text-end">{formatCurrencyPrecise(rows.reduce((s, r) => s + r.salary, 0))}</td>
                  <td className="text-end">{formatCurrencyPrecise(rows.reduce((s, r) => s + r.bonus, 0))}</td>
                  <td className="text-end">{formatCurrencyPrecise(totals.ni)}</td>
                  <td className="text-end">{formatCurrencyPrecise(totals.sl)}</td>
                  <td className="text-end">{formatCurrencyPrecise(totals.pension)}</td>
                  <td className="text-end">{formatCurrencyPrecise(totals.netIsh)}</td>
                </tr>
              </tfoot>
            </Table>
          </div>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          <Card.Title>Year-end summary</Card.Title>
          <Table size="sm">
            <tbody>
              <tr>
                <td>Employee NI — paid per pay period</td>
                <td className="text-end">{formatCurrencyPrecise(totals.ni)}</td>
              </tr>
              <tr>
                <td className="small text-muted" style={{ paddingLeft: "2em" }}>
                  vs annual-basis estimate {formatCurrencyPrecise(annualBasis.employeeNI.total)}
                  {" — "}{niDifference >= 0 ? "you pay less" : "you pay more"} monthly by
                </td>
                <td className="text-end small text-muted">{formatCurrencyPrecise(Math.abs(niDifference))}</td>
              </tr>
              <tr>
                <td>Student loan — paid per pay period</td>
                <td className="text-end">{formatCurrencyPrecise(totals.sl)}</td>
              </tr>
              <tr>
                <td className="small text-muted" style={{ paddingLeft: "2em" }}>
                  vs annual-basis estimate {formatCurrencyPrecise(annualBasis.studentLoanRepayments.total)}
                </td>
                <td className="text-end small text-muted">{formatCurrencyPrecise(Math.abs(slDifference))}</td>
              </tr>
              <tr>
                <td>Income tax due for the year (cumulative, pattern-independent)</td>
                <td className="text-end">{formatCurrencyPrecise(taxDue)}</td>
              </tr>
            </tbody>
          </Table>

          <Row className="g-2 align-items-center">
            <Col xs="auto">
              <Form.Label className="small mb-0">Tax paid so far this year</Form.Label>
              <InputGroup size="sm">
                <InputGroup.Text>£</InputGroup.Text>
                <Form.Control type="number" min={0} step={100} value={taxPaidSoFar}
                  aria-label="Tax paid so far"
                  onChange={e => setTaxPaidSoFar(Number(e.target.value))} />
              </InputGroup>
            </Col>
            {taxPaidSoFar > 0 && (
              <Col xs="auto">
                <Alert variant={hmrcBalance >= 0 ? "success" : "warning"} className="small mb-0 py-1">
                  HMRC balance: {hmrcBalance >= 0 ? "overpaid" : "underpaid"}{" "}
                  {formatCurrencyPrecise(Math.abs(hmrcBalance))}
                </Alert>
              </Col>
            )}
          </Row>
        </Card.Body>
      </Card>
    </>
  );
};

export default PayePlanner;
