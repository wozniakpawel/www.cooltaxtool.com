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
  // Baseline without any pension, to show what the contributions actually cost vs gain
  const noPensionBaseline = useMemo(
    () => calculateTaxes({ ...props.inputs, pensionEnabled: false }),
    [props.inputs]
  );
  const [period, setPeriod] = useState<'annual' | 'monthly' | 'weekly' | 'daily'>('annual');
  const divisors = { annual: 1, monthly: 12, weekly: 52, daily: 365 };
  const divisor = divisors[period];

  const takeHomeGivenUp = noPensionBaseline.takeHomePay - results.takeHomePay;
  const pensionGained = results.pensionPot.total;
  const taxSaved = noPensionBaseline.combinedTaxes - results.combinedTaxes;
  const effectiveBoost = pensionGained - takeHomeGivenUp;
  const employerMoney = effectiveBoost - taxSaved;

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
            {props.inputs.annualGrossDividends > 0 && renderSingleValue(<>Dividends <InfoPopover {...explanations.annualGrossDividends} /></>, props.inputs.annualGrossDividends)}
            {renderSingleValue(<>Adjusted Net Income <InfoPopover {...explanations.result_adjustedNetIncome} /></>, results.adjustedNetIncome)}
            {renderBreakDown(<>Tax Allowance <InfoPopover {...explanations.result_taxAllowance} /></>, results.taxAllowance)}
            {!props.inputs.selfEmployed && renderBreakDown(<>Employer NI <InfoPopover {...explanations.result_employerNI} /></>, results.employerNI)}
          </tbody>
        </Table>

        <div className="ledger-panel ledger-pay">
          <Table size="sm">
            <thead>
              <tr>
                <th>Total you pay <InfoPopover {...explanations.result_combinedTaxes} /></th>
                <td className="text-end">
                  {formatCurrencyPrecise(results.combinedTaxes / divisor)}
                </td>
              </tr>
            </thead>
            <tbody>
              {renderBreakDown(<>Income Tax <InfoPopover {...explanations.result_incomeTax} /></>, results.incomeTax)}
              {results.dividendTax.total > 0 && renderBreakDown("Dividend Tax", results.dividendTax)}
              {renderBreakDown(<>{props.inputs.selfEmployed ? 'NI (Class 2 & 4)' : 'Employee NI'} <InfoPopover {...explanations.result_employeeNI} /></>, results.employeeNI)}
              {renderBreakDown(<>Student Loan <InfoPopover {...explanations.result_studentLoan} /></>, results.studentLoanRepayments)}
              {results.hicbc > 0 && renderSingleValue("HICBC", results.hicbc)}
            </tbody>
          </Table>
        </div>

        <div className="ledger-panel ledger-keep">
          <Table size="sm">
            <thead>
              <tr>
                <th>Total you keep <InfoPopover {...explanations.result_totalYouKeep} /></th>
                <td className="text-end">
                  {formatCurrencyPrecise(results.totalYouKeep / divisor)}
                </td>
              </tr>
            </thead>
            <tbody>
              {renderSingleValue(<>Take Home Pay <InfoPopover {...explanations.result_takeHomePay} /></>, results.takeHomePay)}
              {results.dbPension.accrued > 0 && (
                <>
                  {results.dbPension.memberContribution > 0 &&
                    renderSingleValue(<>DB Member Contribution <InfoPopover {...explanations.dbMemberContribution} /></>, results.dbPension.memberContribution)}
                  {renderSingleValue(<>DB Pension Accrued /yr <InfoPopover {...explanations.dbAccrualDenominator} /></>, results.dbPension.accrued)}
                </>
              )}
              {renderBreakDown(<>Pension Pot <InfoPopover {...explanations.result_pensionPot} /></>, results.pensionPot)}
              {results.childBenefits.total > 0 && renderBreakDown(<>Child Benefits <InfoPopover {...explanations.result_childBenefits} /></>, results.childBenefits)}
            </tbody>
          </Table>
        </div>

        {props.inputs.pensionEnabled && pensionGained > 0 && (
          <Alert variant="info" className="small">
            <strong>Pension savings summary.</strong>{' '}
            You give up {formatCurrencyPrecise(takeHomeGivenUp / divisor)} of take-home pay and
            gain {formatCurrencyPrecise(pensionGained / divisor)} in your pension pot
            {effectiveBoost > 0.005 ? (
              <>
                {' '}— {formatCurrencyPrecise(effectiveBoost / divisor)} more than it cost you,
                thanks to {formatCurrencyPrecise(taxSaved / divisor)} saved in tax, NI and student loan
                {employerMoney > 0.005 ? ' plus employer contributions and pension tax relief' : ''}.
              </>
            ) : '.'}
          </Alert>
        )}

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
