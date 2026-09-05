import { useMemo, useState } from 'react';
import { Table, Card, Button, Alert, Form, Row, Col, InputGroup } from 'react-bootstrap';
import { calculatePayroll } from '../utils/Payroll';
import { formatCurrencyPrecise } from '../utils/chartUtils';
import type { TaxInputs } from '../types/tax';

interface PayePlannerProps {
  inputs: TaxInputs;
  theme: string;
}

interface PeriodRow {
  salary: number;
  bonus: number;
}

type PayPeriod = 'monthly' | 'fortnightly' | 'weekly';

const PERIODS: Record<PayPeriod, { periodsPerYear: number; label: string }> = {
  monthly: { periodsPerYear: 12, label: 'Monthly' },
  fortnightly: { periodsPerYear: 26, label: 'Fortnightly' },
  weekly: { periodsPerYear: 52, label: 'Weekly' },
};

// UK tax year runs April to March
const MONTH_LABELS = [
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
  'January',
  'February',
  'March',
];

const periodLabels = (period: PayPeriod): string[] => {
  if (period === 'monthly') return MONTH_LABELS;
  const { periodsPerYear } = PERIODS[period];
  const noun = period === 'weekly' ? 'Week' : 'Fortnight';
  return Array.from({ length: periodsPerYear }, (_, i) => `${noun} ${i + 1}`);
};

const buildDefaultRows = (annualSalary: number, period: PayPeriod, annualBonus = 0): PeriodRow[] =>
  Array.from({ length: PERIODS[period].periodsPerYear }, (_, i) => ({
    salary: annualSalary / PERIODS[period].periodsPerYear,
    bonus: i === 0 ? annualBonus : 0,
  }));

const PayePlanner = ({ inputs }: PayePlannerProps) => {
  const [period, setPeriod] = useState<PayPeriod>('monthly');
  const [rows, setRows] = useState<PeriodRow[]>(() =>
    buildDefaultRows(inputs.annualGrossSalary, 'monthly', inputs.annualGrossBonus),
  );
  const [payRiseMonth, setPayRiseMonth] = useState(6);
  const [payRiseSalary, setPayRiseSalary] = useState(0);
  const [taxPaidSoFar, setTaxPaidSoFar] = useState(0);

  const periodsPerYear = PERIODS[period].periodsPerYear;
  const labels = periodLabels(period);
  const { perPeriod, totals, annualBasis, takeHomePay, extraAnnualLoan } = useMemo(
    () => calculatePayroll(rows, inputs, periodsPerYear),
    [rows, inputs, periodsPerYear],
  );

  if (inputs.selfEmployed) {
    return (
      <Alert variant="info">
        The PAYE Planner applies to employment income only — the self-employed pay NI through
        self-assessment on annual profits, not per pay period.
      </Alert>
    );
  }

  const niDifference = annualBasis.employeeNI.total - totals.ni;
  const slDifference = annualBasis.studentLoanRepayments.total - totals.sl;
  const taxDue = annualBasis.incomeTax.total + annualBasis.dividendTax.total;
  const hmrcBalance = taxPaidSoFar - taxDue;

  const switchPeriod = (next: PayPeriod) => {
    setPeriod(next);
    setRows(buildDefaultRows(inputs.annualGrossSalary, next, inputs.annualGrossBonus));
    setPayRiseMonth(0);
  };

  const setRow = (index: number, field: keyof PeriodRow, value: number) => {
    setRows(
      rows.map((row, i) =>
        i === index ? { ...row, [field]: Math.max(0, Number.isFinite(value) ? value : 0) } : row,
      ),
    );
  };

  return (
    <>
      <Card className="mb-3">
        <Card.Body>
          <Card.Title>PAYE Planner</Card.Title>
          <p className="small text-muted mb-2">
            NI and student loan are charged per pay period, not annually — so a bonus month or a
            mid-year pay rise changes what you actually pay. Edit the amounts below to match your
            payslips. Your annual bonus starts in the first period; move it to the period it is
            paid. Salary rows stay as entered until you reset them. Other calculator settings apply
            immediately.
          </p>

          <div className="mb-2">
            {(Object.keys(PERIODS) as PayPeriod[]).map((p) => (
              <Button
                key={p}
                size="sm"
                className="me-1"
                variant={period === p ? 'primary' : 'outline-primary'}
                onClick={() => switchPeriod(p)}
              >
                {PERIODS[p].label}
              </Button>
            ))}
          </div>

          <Row className="g-2 align-items-end mb-3">
            <Col xs="auto">
              <Button
                size="sm"
                variant="outline-secondary"
                onClick={() =>
                  setRows(
                    buildDefaultRows(inputs.annualGrossSalary, period, inputs.annualGrossBonus),
                  )
                }
              >
                Reset from annual inputs
              </Button>
            </Col>
            <Col xs="auto">
              <Form.Label className="small mb-0">Pay rise from</Form.Label>
              <Form.Select
                size="sm"
                value={payRiseMonth}
                aria-label="Pay rise month"
                onChange={(e) => setPayRiseMonth(Number(e.target.value))}
              >
                {labels.map((label, i) => (
                  <option key={label} value={i}>
                    {label}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col xs="auto">
              <Form.Label className="small mb-0">New annual salary</Form.Label>
              <InputGroup size="sm">
                <InputGroup.Text>£</InputGroup.Text>
                <Form.Control
                  type="number"
                  min={0}
                  step={1000}
                  value={payRiseSalary}
                  aria-label="Pay rise new annual salary"
                  onChange={(e) => setPayRiseSalary(Math.max(0, Number(e.target.value)))}
                />
              </InputGroup>
            </Col>
            <Col xs="auto">
              <Button
                size="sm"
                variant="outline-primary"
                onClick={() =>
                  setRows(
                    rows.map((row, i) =>
                      i >= payRiseMonth ? { ...row, salary: payRiseSalary / periodsPerYear } : row,
                    ),
                  )
                }
              >
                Apply pay rise
              </Button>
            </Col>
          </Row>

          <Alert variant="info" className="small">
            The final column is <strong>before Income Tax</strong>, so it is not take-home pay.
            Personal pension payments are spread evenly for cash planning, even if paid outside
            payroll. Tax codes, cumulative PAYE withholding and historical mid-year NI changes are
            not modelled.
          </Alert>
          <div
            style={{ overflowX: 'auto' }}
            role="region"
            aria-label="Editable payroll table"
            tabIndex={0}
          >
            <Table size="sm" className="align-middle">
              <thead>
                <tr>
                  <th>{period === 'monthly' ? 'Month' : 'Period'}</th>
                  <th>Gross Salary</th>
                  <th>Bonus</th>
                  <th className="text-end">Employee NI</th>
                  <th className="text-end">Student Loan</th>
                  <th className="text-end">Pension</th>
                  <th className="text-end">Before Income Tax</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={labels[i]}>
                    <td>{labels[i]}</td>
                    <td>
                      <Form.Control
                        size="sm"
                        type="number"
                        min={0}
                        step={100}
                        aria-label={`${labels[i]} gross salary`}
                        value={Math.round(row.salary * 100) / 100}
                        onChange={(e) => setRow(i, 'salary', Number(e.target.value))}
                      />
                    </td>
                    <td>
                      <Form.Control
                        size="sm"
                        type="number"
                        min={0}
                        step={100}
                        aria-label={`${labels[i]} bonus`}
                        value={row.bonus}
                        onChange={(e) => setRow(i, 'bonus', Number(e.target.value))}
                      />
                    </td>
                    <td className="text-end">{formatCurrencyPrecise(perPeriod[i].ni)}</td>
                    <td className="text-end">{formatCurrencyPrecise(perPeriod[i].sl)}</td>
                    <td className="text-end">{formatCurrencyPrecise(perPeriod[i].pension)}</td>
                    <td className="text-end">{formatCurrencyPrecise(perPeriod[i].netIsh)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="fw-bold">
                  <td>Total</td>
                  <td className="text-end">
                    {formatCurrencyPrecise(rows.reduce((s, r) => s + r.salary, 0))}
                  </td>
                  <td className="text-end">
                    {formatCurrencyPrecise(rows.reduce((s, r) => s + r.bonus, 0))}
                  </td>
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
          <p>
            <strong>Estimated annual take-home: {formatCurrencyPrecise(takeHomePay)}</strong>
          </p>
          <p className="text-muted small">
            Uses per-period NI and loan deductions, actual pension deductions above, annual Income
            Tax and any dividend tax or Child Benefit charge. Child Benefit received is additional.
          </p>
          {extraAnnualLoan > 0 && (
            <p className="text-muted small">
              Includes {formatCurrencyPrecise(extraAnnualLoan)} estimated extra student loan
              liability through Self Assessment because of dividends.
            </p>
          )}
          <Table size="sm">
            <tbody>
              <tr>
                <td>Employee NI — paid per pay period</td>
                <td className="text-end">{formatCurrencyPrecise(totals.ni)}</td>
              </tr>
              <tr>
                <td className="small text-muted" style={{ paddingLeft: '2em' }}>
                  vs annual-basis estimate {formatCurrencyPrecise(annualBasis.employeeNI.total)}
                  {' — '}
                  {niDifference >= 0 ? 'you pay less' : 'you pay more'} across the year by
                </td>
                <td className="text-end small text-muted">
                  {formatCurrencyPrecise(Math.abs(niDifference))}
                </td>
              </tr>
              <tr>
                <td>Student loan — paid per pay period</td>
                <td className="text-end">{formatCurrencyPrecise(totals.sl)}</td>
              </tr>
              <tr>
                <td className="small text-muted" style={{ paddingLeft: '2em' }}>
                  vs annual-basis estimate{' '}
                  {formatCurrencyPrecise(annualBasis.studentLoanRepayments.total)}
                </td>
                <td className="text-end small text-muted">
                  {formatCurrencyPrecise(Math.abs(slDifference))}
                </td>
              </tr>
              <tr>
                <td>Income & dividend tax liability for the full year</td>
                <td className="text-end">{formatCurrencyPrecise(taxDue)}</td>
              </tr>
            </tbody>
          </Table>

          <Row className="g-2 align-items-center">
            <Col xs="auto">
              <Form.Label className="small mb-0">
                Income Tax already paid toward this year
              </Form.Label>
              <InputGroup size="sm">
                <InputGroup.Text>£</InputGroup.Text>
                <Form.Control
                  type="number"
                  min={0}
                  step={100}
                  value={taxPaidSoFar}
                  aria-label="Tax paid so far"
                  onChange={(e) => setTaxPaidSoFar(Math.max(0, Number(e.target.value)))}
                />
              </InputGroup>
            </Col>
            {taxPaidSoFar > 0 && (
              <Col xs="auto">
                <Alert
                  variant={hmrcBalance >= 0 ? 'success' : 'warning'}
                  className="small mb-0 py-1"
                >
                  Against estimated full-year Income Tax:{' '}
                  {hmrcBalance >= 0 ? 'potential excess' : 'still to cover'}{' '}
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
