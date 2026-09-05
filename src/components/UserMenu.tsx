import { useState, useEffect, useId, type ReactNode } from 'react';
import { taxYears } from '../utils/TaxYears';
import { studentLoanOptions } from '../utils/studentLoanOptions';
import { defaultInputs } from '../utils/defaultInputs';
import type { TaxInputs } from '../types/tax';
export { defaultInputs } from '../utils/defaultInputs';

export function NumberField({
  label,
  value,
  onChange,
  unit = '£',
  max = 10000000,
  min = 0,
  step = 'any',
  hint,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  unit?: string;
  max?: number;
  min?: number;
  step?: string;
  hint?: string;
}) {
  const id = useId();
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  const isValidValue = (text: string) => {
    const n = Number(text);
    const stepPosition = (n - min) / Number(step);
    return (
      text !== '' &&
      Number.isFinite(n) &&
      n >= min &&
      n <= max &&
      (step === 'any' || Math.abs(stepPosition - Math.round(stepPosition)) < 1e-8)
    );
  };
  const valid = isValidValue(draft);
  return (
    <div className="number-field">
      <label htmlFor={id}>{label}</label>
      <div className={`money-input ${valid ? '' : 'invalid'}`}>
        <span aria-hidden="true">{unit}</span>
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          value={draft}
          aria-invalid={!valid}
          aria-describedby={`${id}-unit${hint || !valid ? ` ${id}-hint` : ''}`}
          onChange={(e) => {
            const text = e.target.value;
            setDraft(text);
            const n = Number(text);
            if (isValidValue(text)) onChange(n);
          }}
        />
      </div>
      <span id={`${id}-unit`} className="visually-hidden">
        {unit === '£'
          ? 'Amount in British pounds.'
          : unit === '%'
            ? 'Percentage.'
            : `Unit: ${unit}.`}
      </span>
      {(!valid || hint) && (
        <small id={`${id}-hint`} className={!valid ? 'field-error' : ''}>
          {!valid
            ? `Enter a number from ${min} to ${max.toLocaleString('en-GB')}${step === 'any' ? '' : ` in steps of ${step}`}. Results use your last valid value.`
            : hint}
        </small>
      )}
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
}) {
  const id = useId();
  return (
    <div className="toggle-field">
      <label htmlFor={id}>
        <span>{label}</span>
        <input
          id={id}
          type="checkbox"
          role="switch"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
      </label>
      {hint && <small>{hint}</small>}
    </div>
  );
}

function InputSection({
  title,
  count,
  children,
}: {
  title: string;
  count?: string;
  children: ReactNode;
}) {
  return (
    <details className="input-section">
      <summary>
        <span>{title}</span>
        <span className="section-status">
          {count}
          <span className="chevron">⌄</span>
        </span>
      </summary>
      <div className="section-content">{children}</div>
    </details>
  );
}

export function UserMenu({
  onUserInputsChange,
}: {
  onUserInputsChange: (inputs: TaxInputs) => void;
}) {
  const [v, setV] = useState<TaxInputs>(defaultInputs);
  useEffect(() => {
    onUserInputsChange({
      ...v,
      annualGrossSalary: (v.annualGrossSalary * v.workingDaysPerWeek) / 5,
    });
  }, [v, onUserInputsChange]);
  const set = <K extends keyof TaxInputs>(key: K, value: TaxInputs[K]) =>
    setV((old) => ({ ...old, [key]: value }));
  const pension = (key: keyof TaxInputs['pensionContributions'], value: number) =>
    setV((old) => ({
      ...old,
      pensionContributions: { ...old.pensionContributions, [key]: value },
    }));
  const gross = (v.annualGrossSalary * v.workingDaysPerWeek) / 5 + v.annualGrossBonus;
  return (
    <aside className="input-panel" aria-label="Your calculator inputs">
      <div className="input-heading">
        <div>
          <span className="eyebrow">LET’S START WITH YOU</span>
          <h2>Your details</h2>
        </div>
        <button
          className="text-button"
          onClick={() => setV({ ...defaultInputs, annualGrossSalary: 0 })}
        >
          Reset
        </button>
      </div>
      <form onSubmit={(e) => e.preventDefault()}>
        <div className="primary-inputs">
          <label htmlFor="taxYear">Tax Year</label>
          <select id="taxYear" value={v.taxYear} onChange={(e) => set('taxYear', e.target.value)}>
            {Object.keys(taxYears).map((year) => (
              <option key={year}>{year}</option>
            ))}
          </select>
          <label htmlFor="region">Where do you pay tax?</label>
          <select
            id="region"
            value={v.residentInScotland ? 'scotland' : 'rest'}
            onChange={(e) => set('residentInScotland', e.target.value === 'scotland')}
          >
            <option value="rest">England, Wales & Northern Ireland</option>
            <option value="scotland">Scotland</option>
          </select>
          <label htmlFor="employment">Income type</label>
          <select
            id="employment"
            value={v.selfEmployed ? 'self' : 'employed'}
            onChange={(e) => set('selfEmployed', e.target.value === 'self')}
          >
            <option value="employed">Employed · salary</option>
            <option value="self">Self-employed · trading profit</option>
          </select>
          <NumberField
            label={
              v.selfEmployed
                ? 'Annual profit after business expenses'
                : v.workingDaysPerWeek === 5
                  ? 'Annual salary before tax'
                  : 'Full-time equivalent annual salary'
            }
            value={v.annualGrossSalary}
            onChange={(n) => set('annualGrossSalary', n)}
          />
          <div className="salary-presets" aria-label="Example annual salaries">
            {[30000, 45000, 60000, 100000].map((n) => (
              <button
                type="button"
                key={n}
                className={v.annualGrossSalary === n ? 'selected' : ''}
                onClick={() => set('annualGrossSalary', n)}
              >
                £{n / 1000}k
              </button>
            ))}
          </div>
          <p className="input-note">
            Start with an example, then make it yours. Results update as you type.
          </p>
        </div>
        <InputSection
          title="Bonus, dividends & working days"
          count={v.annualGrossBonus || v.annualGrossDividends ? 'Added' : 'Optional'}
        >
          <NumberField
            label={v.selfEmployed ? 'Other trading profit' : 'Annual bonus'}
            value={v.annualGrossBonus}
            onChange={(n) => set('annualGrossBonus', n)}
          />
          <NumberField
            label="Annual dividends"
            value={v.annualGrossDividends}
            onChange={(n) => set('annualGrossDividends', n)}
            hint="Dividends outside an ISA. Enter the amount before tax."
          />
          <NumberField
            label="Working days per week"
            unit="days"
            value={v.workingDaysPerWeek}
            min={1}
            max={5}
            step="0.5"
            onChange={(n) => set('workingDaysPerWeek', n)}
            hint="Fewer than 5 days scales the full-time salary or profit above. Bonus and dividends stay as entered."
          />
        </InputSection>
        <InputSection title="Pension contributions" count={v.pensionEnabled ? 'On' : 'Optional'}>
          <Toggle
            label="Include pension"
            checked={v.pensionEnabled}
            onChange={(b) => set('pensionEnabled', b)}
          />
          {v.pensionEnabled && (
            <>
              {!v.selfEmployed && (
                <>
                  <div className="field-grid">
                    <NumberField
                      label="Workplace · you"
                      unit="%"
                      max={30}
                      value={v.pensionContributions.autoEnrolment}
                      onChange={(n) => pension('autoEnrolment', n)}
                    />
                    <NumberField
                      label="Workplace · employer"
                      unit="%"
                      max={100}
                      value={v.pensionContributions.autoEnrolmentEmployer}
                      onChange={(n) => pension('autoEnrolmentEmployer', n)}
                    />
                  </div>
                  <Toggle
                    label="Workplace pension is salary sacrifice"
                    checked={v.autoEnrolmentAsSalarySacrifice}
                    onChange={(b) => set('autoEnrolmentAsSalarySacrifice', b)}
                    hint="Off means a net-pay scheme: income tax relief, but no NI saving. For relief at source, use the personal payment field below."
                  />
                  <Toggle
                    label="Use qualifying earnings"
                    checked={v.autoEnrolmentOnQualifyingEarnings}
                    onChange={(b) => set('autoEnrolmentOnQualifyingEarnings', b)}
                    hint="Off uses full pay after additional sacrifice. Check which basis your employer uses."
                  />
                  <Toggle
                    label="Enter additional sacrifice as a %"
                    checked={v.salarySacrificeIsPercentage}
                    onChange={(b) => {
                      setV((old) => ({
                        ...old,
                        salarySacrificeIsPercentage: b,
                        pensionContributions: { ...old.pensionContributions, salarySacrifice: 0 },
                      }));
                    }}
                  />
                  <NumberField
                    label="Additional salary sacrifice"
                    unit={v.salarySacrificeIsPercentage ? '%' : '£'}
                    max={v.salarySacrificeIsPercentage ? 100 : gross}
                    value={v.pensionContributions.salarySacrifice}
                    onChange={(n) => pension('salarySacrifice', n)}
                  />
                  <Toggle
                    label="Employer adds its NI saving"
                    checked={v.employerNISavingsToPension}
                    onChange={(b) => set('employerNISavingsToPension', b)}
                  />
                </>
              )}
              {v.selfEmployed && (
                <p className="input-note">
                  Personal pensions reduce income tax, but not Class 4 NI. Workplace contributions
                  and salary sacrifice do not apply here.
                </p>
              )}
              <NumberField
                label="Annual personal pension payment"
                value={v.pensionContributions.personal}
                onChange={(n) => pension('personal', n)}
                hint="The amount you pay into a SIPP or relief-at-source workplace pension, before the provider adds relief."
              />
              <Toggle
                label="Provider adds 20% tax relief"
                checked={v.taxReliefAtSource}
                onChange={(b) => set('taxReliefAtSource', b)}
                hint="Off models a gross personal payment with relief claimed from HMRC."
              />
              {!v.selfEmployed && (
                <details className="nested-details">
                  <summary>Defined benefit / career average pension</summary>
                  <Toggle
                    label="Include defined benefit scheme"
                    checked={v.dbPensionEnabled}
                    onChange={(b) => set('dbPensionEnabled', b)}
                  />
                  {v.dbPensionEnabled && (
                    <>
                      <NumberField
                        label="DB member contribution"
                        unit="%"
                        max={30}
                        value={v.dbMemberContribution}
                        onChange={(n) => set('dbMemberContribution', n)}
                      />
                      <NumberField
                        label="Accrual denominator (1 / …)"
                        unit="1 /"
                        min={1}
                        max={200}
                        value={v.dbAccrualDenominator}
                        onChange={(n) => set('dbAccrualDenominator', n)}
                        hint="Simplified annual accrual on salary. Existing benefits and inflation adjustments are not modelled."
                      />
                    </>
                  )}
                </details>
              )}
            </>
          )}
        </InputSection>
        <InputSection
          title="Student loans"
          count={v.studentLoanEnabled ? `${v.studentLoan.length} selected` : 'Optional'}
        >
          <Toggle
            label="Include student loan repayments"
            checked={v.studentLoanEnabled}
            onChange={(b) => set('studentLoanEnabled', b)}
          />
          {v.studentLoanEnabled && (
            <div className="loan-options">
              {studentLoanOptions.map((option) => (
                <label key={option.plan}>
                  <input
                    type="checkbox"
                    checked={v.studentLoan.includes(option.plan)}
                    disabled={
                      !Number.isFinite(taxYears[v.taxYear].studentLoan.thresholds[option.plan])
                    }
                    onChange={(e) =>
                      set(
                        'studentLoan',
                        e.target.checked
                          ? [...v.studentLoan, option.plan]
                          : v.studentLoan.filter((p) => p !== option.plan),
                      )
                    }
                  />
                  <span>
                    {option.label}
                    <small>
                      {Number.isFinite(taxYears[v.taxYear].studentLoan.thresholds[option.plan])
                        ? `Above £${taxYears[v.taxYear].studentLoan.thresholds[option.plan].toLocaleString('en-GB')} / year`
                        : 'Not in repayment this tax year'}
                    </small>
                  </span>
                </label>
              ))}
              <p className="input-note">
                Multiple undergraduate loans share one 9% deduction. Postgraduate repayments add 6%.
                Assumes your repayments have started and a balance remains.
              </p>
            </div>
          )}
        </InputSection>
        <InputSection
          title="Child Benefit & allowances"
          count={v.childBenefits.mode !== 'off' || v.blind || v.noNI ? 'Added' : 'Optional'}
        >
          <label htmlFor="child-benefit">Who receives Child Benefit?</label>
          <select
            id="child-benefit"
            value={v.childBenefits.mode}
            onChange={(e) =>
              set('childBenefits', {
                ...v.childBenefits,
                mode: e.target.value as TaxInputs['childBenefits']['mode'],
              })
            }
          >
            <option value="off">Not included</option>
            <option value="self">I do</option>
            <option value="partner">My partner does</option>
          </select>
          {v.childBenefits.mode !== 'off' && (
            <>
              <NumberField
                label="Eligible children"
                unit="#"
                value={v.childBenefits.numberOfChildren}
                min={1}
                max={20}
                step="1"
                onChange={(n) =>
                  set('childBenefits', { ...v.childBenefits, numberOfChildren: Math.floor(n) })
                }
              />
              <p className="input-note">
                The charge assumes you have the higher adjusted net income in your household. Only
                benefit you receive is added to your cash total.
              </p>
            </>
          )}
          <Toggle
            label="Exempt from employee / self-employed NI"
            checked={v.noNI}
            onChange={(b) => set('noNI', b)}
            hint="For example, when the relevant State Pension age exemption applies. Employer NI is still shown."
          />
          <Toggle
            label="Eligible for Blind Person’s Allowance"
            checked={v.blind}
            onChange={(b) => set('blind', b)}
          />
        </InputSection>
      </form>
      <div className="privacy-note">
        <span aria-hidden="true">◇</span> Your numbers stay in this browser.
        <br />
        No account. No tracking. No saving your income.
      </div>
    </aside>
  );
}
