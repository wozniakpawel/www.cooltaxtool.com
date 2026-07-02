import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { calculateTaxes } from "../../utils/TaxCalc";
import { Table, Card, ButtonGroup, Button, Alert } from "react-bootstrap";
import { formatCurrencyPrecise } from "../../utils/chartUtils";
import type { TaxInputs, CalculationResult } from "../../types/tax";
import InfoPopover from '../InfoPopover';
import explanations from '../../utils/explanations';

interface TaxBreakdownProps {
  inputs: TaxInputs;
}

const TaxBreakdown = (props: TaxBreakdownProps) => {
  const results = useMemo(() => calculateTaxes(props.inputs), [props.inputs]);
  const [period, setPeriod] = useState<'annual' | 'monthly' | 'weekly' | 'daily'>('annual');
  const divisors = { annual: 1, monthly: 12, weekly: 52, daily: 365 };
  const divisor = divisors[period];

  function renderSingleValue(name: ReactNode, value: number) {
    return (
      <tr>
        <td>{name}</td>
        <td className="text-end">
          {formatCurrencyPrecise(value / divisor)}
        </td>
      </tr>
    )
  }

  function renderBreakDown(name: ReactNode, value: CalculationResult) {
    return (
      <>
        {renderSingleValue(name, value.total)}
        {value.breakdown.map((tax, i) => (
          <tr key={`it-${i}`}>
            <td className="small" style={{ paddingLeft: "2em" }}>{`${typeof tax.rate === 'string' ? tax.rate : (tax.rate * 100).toFixed(2) + "%"
              }`}</td>
            <td className="text-end small" style={{ paddingRight: "2em" }}>{formatCurrencyPrecise(tax.amount / divisor)}</td>
          </tr>
        ))}
      </>
    );
  }

  return (
    <Card>
      <Card.Body>
        <Card.Title className="d-flex justify-content-between align-items-center">
          Tax breakdown
          <ButtonGroup size="sm">
            {(['annual', 'monthly', 'weekly', 'daily'] as const).map((p) => (
              <Button
                key={p}
                variant={period === p ? 'primary' : 'outline-primary'}
                onClick={() => setPeriod(p)}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Button>
            ))}
          </ButtonGroup>
        </Card.Title>

        <Table size="sm">
          <tbody>
            {renderBreakDown(<>Annual Gross Income <InfoPopover {...explanations.result_annualGrossIncome} /></>, results.annualGrossIncome)}
            {renderSingleValue(<>Adjusted Net Income <InfoPopover {...explanations.result_adjustedNetIncome} /></>, results.adjustedNetIncome)}
            {renderBreakDown(<>Tax Allowance <InfoPopover {...explanations.result_taxAllowance} /></>, results.taxAllowance)}
            {renderBreakDown(<>Employer NI <InfoPopover {...explanations.result_employerNI} /></>, results.employerNI)}
          </tbody>
        </Table>

        <Table size="sm" variant="danger" style={{ color: "#000" }}>
          <thead>
            <tr>
              <th>Total you pay <InfoPopover {...explanations.result_combinedTaxes} /></th>
              <td style={{ fontWeight: "bold" }} className="text-end">
                {formatCurrencyPrecise(results.combinedTaxes / divisor)}
              </td>
            </tr>
          </thead>
          <tbody>
            {renderBreakDown(<>Income Tax <InfoPopover {...explanations.result_incomeTax} /></>, results.incomeTax)}
            {renderBreakDown(<>Employee NI <InfoPopover {...explanations.result_employeeNI} /></>, results.employeeNI)}
            {renderBreakDown(<>Student Loan <InfoPopover {...explanations.result_studentLoan} /></>, results.studentLoanRepayments)}
            {results.hicbc > 0 && renderSingleValue("HICBC", results.hicbc)}
          </tbody>
        </Table>

        <Table size="sm" variant="success" style={{ color: "#000" }}>
          <thead>
            <tr>
              <th>Total you keep <InfoPopover {...explanations.result_yourMoney} /></th>
              <td style={{ fontWeight: "bold" }} className="text-end">
                {formatCurrencyPrecise(results.yourMoney / divisor)}
              </td>
            </tr>
          </thead>
          <tbody>
            {renderSingleValue(<>Take Home Pay <InfoPopover {...explanations.result_takeHomePay} /></>, results.takeHomePay)}
            {renderBreakDown(<>Pension Pot <InfoPopover {...explanations.result_pensionPot} /></>, results.pensionPot)}
            {results.childBenefits.total > 0 && renderBreakDown(<>Child Benefits <InfoPopover {...explanations.result_childBenefits} /></>, results.childBenefits)}
          </tbody>
        </Table>

        {results.pensionAnnualAllowance.exceeded && (
          <Alert variant="warning" className="small">
            <strong>Pension annual allowance exceeded.</strong>{' '}
            Your total pension contributions ({formatCurrencyPrecise(results.pensionAnnualAllowance.used)}) are over
            your {results.pensionAnnualAllowance.tapered ? 'tapered ' : ''}annual allowance
            of {formatCurrencyPrecise(results.pensionAnnualAllowance.allowance)}. The excess is normally subject to the
            annual allowance charge at your marginal rate (unused allowance carried forward from the previous three
            years may cover it — not modelled here).
          </Alert>
        )}

        {period !== 'annual' && (
          <p className="text-muted small mb-0">
            Figures are annual calculations divided by period. Actual payslip amounts may differ slightly due to per-period NI and Student Loan thresholds.
          </p>
        )}
      </Card.Body>
    </Card>
  );
};

export default TaxBreakdown;
