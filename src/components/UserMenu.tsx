import { useEffect, ChangeEvent } from 'react';
import { Formik, useFormikContext } from 'formik';
import NumberOfChildrenSelector from './NumberOfChildrenSelector';
import InfoPopover from './InfoPopover';
import explanations from '../utils/explanations';
import * as yup from 'yup';
import { taxYears } from '../utils/TaxYears';
import { studentLoanOptions } from '../utils/studentLoanOptions';
import {
    Container, Card, Row, Col, Form, Alert,
    InputGroup, Collapse, Button,
} from 'react-bootstrap';
import type { TaxInputs, StudentLoanPlan } from '../types/tax';

const taxYearOptions = Object.keys(taxYears);

const requiredPositiveNumber = yup.number()
    .typeError("Must be a number.")
    .min(0, "Must be a positive number.")
    .required("Field required.");

const schema = yup.object().shape({
    annualGrossSalary: requiredPositiveNumber,
    annualGrossBonus: requiredPositiveNumber,
    annualGrossDividends: requiredPositiveNumber,
    pensionContributions: yup.object().shape({
        autoEnrolment: requiredPositiveNumber
            .max(30, "Must be less than or equal to 30."),
        autoEnrolmentEmployer: requiredPositiveNumber
            .max(100, "Must be less than or equal to 100."),
        salarySacrifice: requiredPositiveNumber,
        personal: requiredPositiveNumber,
    }),
});

export const defaultInputs: TaxInputs = {
    taxYear: taxYearOptions[0],
    studentLoan: [] as StudentLoanPlan[],
    annualGrossSalary: 0,
    annualGrossBonus: 0,
    annualGrossDividends: 0,
    annualGrossIncomeRange: 150000,
    workingDaysPerWeek: 5,
    selfEmployed: false,
    residentInScotland: false,
    noNI: false,
    blind: false,
    childBenefits: {
        mode: 'off',
        numberOfChildren: 1,
    },
    pensionContributions: {
        autoEnrolment: 0,
        autoEnrolmentEmployer: 0,
        salarySacrifice: 0,
        personal: 0,
    },
    salarySacrificeIsPercentage: false,
    autoEnrolmentAsSalarySacrifice: true,
    autoEnrolmentOnQualifyingEarnings: false,
    employerNISavingsToPension: false,
    taxReliefAtSource: true,
    incomeAnalysis: true,
    pensionEnabled: false,
    studentLoanEnabled: false,
};

const hasEmptyString = (obj: Record<string, unknown>): boolean => {
    return Object.values(obj).some(value => {
        if (typeof value === 'string') {
            return value === '';
        } else if (typeof value === 'object' && value !== null) {
            return hasEmptyString(value as Record<string, unknown>);
        }
        return false;
    });
};

interface UseEffectWrapperProps {
    onUserInputsChange: (inputs: TaxInputs) => void;
}

const UseEffectWrapper = ({ onUserInputsChange }: UseEffectWrapperProps) => {
    const { values, errors } = useFormikContext<TaxInputs>();

    const parseValuesToFloats = (values: TaxInputs): TaxInputs => {
        const parsedValues = { ...values };
        parsedValues.workingDaysPerWeek = Number(parsedValues.workingDaysPerWeek);
        // Scale the full-time salary down (or up) for part-time working patterns
        parsedValues.annualGrossSalary = Number(parsedValues.annualGrossSalary) * (parsedValues.workingDaysPerWeek / 5);
        parsedValues.annualGrossBonus = Number(parsedValues.annualGrossBonus);
        parsedValues.annualGrossDividends = Number(parsedValues.annualGrossDividends);
        parsedValues.annualGrossIncomeRange = Number(parsedValues.annualGrossIncomeRange);
        parsedValues.pensionContributions = {
            ...parsedValues.pensionContributions,
            autoEnrolment: Number(parsedValues.pensionContributions.autoEnrolment),
            autoEnrolmentEmployer: Number(parsedValues.pensionContributions.autoEnrolmentEmployer),
            salarySacrifice: Number(parsedValues.pensionContributions.salarySacrifice),
            personal: Number(parsedValues.pensionContributions.personal),
        };
        return parsedValues;
    };

    useEffect(() => {
        if (Object.keys(errors).length === 0 && !hasEmptyString(values as unknown as Record<string, unknown>)) {
            onUserInputsChange(parseValuesToFloats(values));
        }
    }, [values, errors, onUserInputsChange]);

    return null;
};

interface UserMenuProps {
    onUserInputsChange: (inputs: TaxInputs) => void;
}

export function UserMenu({ onUserInputsChange }: UserMenuProps) {
    return (
        <>
            <Container>
                <Formik
                    validationSchema={schema}
                    initialValues={defaultInputs}
                    onSubmit={() => { }}
                >

                    {({ setFieldValue, values, errors }) => {
                        const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement> | { target: { name: string; value?: string; type: string; checked?: boolean } }) => {
                            const { name, value, type, checked } = event.target as HTMLInputElement;
                            if (name === "studentLoan") {
                                const newStudentLoan = checked
                                    ? [...values.studentLoan, value]
                                    : values.studentLoan.filter(plan => plan !== value);
                                setFieldValue(name, newStudentLoan, true);
                            } else {
                                const newValue = type === "checkbox" ? checked : value;
                                setFieldValue(name, newValue, true);
                            }
                        };

                        return (
                            <>
                                <Form noValidate>

                                    <Form.Group as={Row} controlId="taxYear" className="mt-2">
                                        <Form.Label column>Tax Year <InfoPopover {...explanations.taxYear} /></Form.Label>
                                        <Col>
                                            <Form.Control as="select" name="taxYear" value={values.taxYear} onChange={handleInputChange}>
                                                {taxYearOptions.map(year => (
                                                    <option key={year} value={year}>{year}</option>
                                                ))}
                                            </Form.Control>
                                        </Col>
                                        {
                                            (values.taxYear === '2022/23') &&
                                            <Alert key="warning" variant="warning">
                                                Warning: NI calculations for the 2022/23 tax year might not be accurate due to the varying rates and thresholds. Effective rates and thresholds are being used to estimate the Employer and Employee NI contributions.
                                            </Alert>
                                        }
                                    </Form.Group>

                                    <Form.Group>
                                        <Form.Check
                                            type="switch"
                                            id="selfEmployed"
                                            label={<>Self-employed <InfoPopover {...explanations.selfEmployed} /></>}
                                            name="selfEmployed"
                                            checked={values.selfEmployed}
                                            onChange={handleInputChange}
                                        />
                                        <Form.Check
                                            type="switch"
                                            id="residentInScotland"
                                            label={<>Resident in Scotland <InfoPopover {...explanations.residentInScotland} /></>}
                                            name="residentInScotland"
                                            checked={values.residentInScotland}
                                            onChange={handleInputChange}
                                        />
                                        <Form.Check
                                            type="switch"
                                            id="noNI"
                                            label={<>Exclude NI <InfoPopover {...explanations.noNI} /></>}
                                            name="noNI"
                                            checked={values.noNI}
                                            onChange={handleInputChange}
                                        />
                                        <Form.Check
                                            type="switch"
                                            id="blind"
                                            label={<>Blind <InfoPopover {...explanations.blind} /></>}
                                            name="blind"
                                            checked={values.blind}
                                            onChange={handleInputChange}
                                        />
                                        <Form.Group as={Row} controlId="childBenefits.mode" className="mt-1 mb-1">
                                            <Form.Label column>Child Benefits <InfoPopover {...explanations.childBenefits} /></Form.Label>
                                            <Col>
                                                <Form.Select
                                                    name="childBenefits.mode"
                                                    value={values.childBenefits.mode}
                                                    onChange={handleInputChange}
                                                >
                                                    <option value="off">Off</option>
                                                    <option value="self">I receive Child Benefits</option>
                                                    <option value="partner">My partner receives Child Benefits</option>
                                                </Form.Select>
                                            </Col>
                                        </Form.Group>
                                        {values.childBenefits.mode !== 'off' &&
                                            <>
                                                <NumberOfChildrenSelector
                                                    setFieldValue={setFieldValue}
                                                    values={values}
                                                />
                                                <InfoPopover {...explanations.numberOfChildren} />
                                            </>
                                        }
                                    </Form.Group>

                                    <Card className="mt-2">
                                        <Card.Body>
                                            <Card.Title>
                                                <Form.Check
                                                    type="switch"
                                                    id="studentLoanEnabled"
                                                    label={<>Student Loans <InfoPopover {...explanations.studentLoan} /></>}
                                                    name="studentLoanEnabled"
                                                    checked={values.studentLoanEnabled}
                                                    onChange={handleInputChange}
                                                    className="d-inline-flex align-items-center"
                                                />
                                            </Card.Title>
                                            <Collapse in={values.studentLoanEnabled}>
                                                <div>
                                                    <Form.Group as={Row} controlId="studentLoan">
                                                        {/* <Form.Label column>Student Loans</Form.Label> */}
                                                        <Col>
                                                            {studentLoanOptions.map(option => (
                                                                <Form.Check
                                                                    key={option.plan}
                                                                    type="checkbox"
                                                                    label={option.label}
                                                                    name="studentLoan"
                                                                    value={option.plan}
                                                                    checked={values.studentLoan.includes(option.plan)}
                                                                    onChange={handleInputChange}
                                                                />
                                                            ))}
                                                        </Col>
                                                    </Form.Group>
                                                </div>
                                            </Collapse>
                                        </Card.Body>
                                    </Card>

                                    <Card className="mt-2">
                                        <Card.Body>
                                            <Card.Title>
                                                <Form.Check
                                                    type="switch"
                                                    id="pensionEnabled"
                                                    label={<>Pension</>}
                                                    name="pensionEnabled"
                                                    checked={values.pensionEnabled}
                                                    onChange={handleInputChange}
                                                    className="d-inline-flex align-items-center"
                                                />
                                            </Card.Title>
                                            <Collapse in={values.pensionEnabled}>
                                                <div>
                                                    <Form.Group as={Row} controlId="pensionContributions.autoEnrolment">
                                                        <Form.Label column>Auto Enrolment (you) <InfoPopover {...explanations.autoEnrolment} /></Form.Label>
                                                        <Col>
                                                            <InputGroup hasValidation>
                                                                <InputGroup.Text>%</InputGroup.Text>
                                                                <Form.Control
                                                                    type="number"
                                                                    inputMode="decimal"
                                                                    name="pensionContributions.autoEnrolment"
                                                                    value={values.pensionContributions.autoEnrolment}
                                                                    onChange={handleInputChange}
                                                                    isValid={!errors.pensionContributions?.autoEnrolment}
                                                                    isInvalid={!!errors.pensionContributions?.autoEnrolment}
                                                                    min={0}
                                                                    max={30}
                                                                    step={0.1}
                                                                />
                                                                <Form.Control.Feedback type="invalid">
                                                                    {errors.pensionContributions?.autoEnrolment}
                                                                </Form.Control.Feedback>
                                                            </InputGroup>
                                                        </Col>
                                                    </Form.Group>
                                                    <Form.Group as={Row} controlId="pensionContributions.autoEnrolmentEmployer">
                                                        <Form.Label column>Auto Enrolment (employer) <InfoPopover {...explanations.autoEnrolmentEmployer} /></Form.Label>
                                                        <Col>
                                                            <InputGroup hasValidation>
                                                                <InputGroup.Text>%</InputGroup.Text>
                                                                <Form.Control
                                                                    type="number"
                                                                    inputMode="decimal"
                                                                    name="pensionContributions.autoEnrolmentEmployer"
                                                                    value={values.pensionContributions.autoEnrolmentEmployer}
                                                                    onChange={handleInputChange}
                                                                    isValid={!errors.pensionContributions?.autoEnrolmentEmployer}
                                                                    isInvalid={!!errors.pensionContributions?.autoEnrolmentEmployer}
                                                                    min={0}
                                                                    max={100}
                                                                    step={0.1}
                                                                />
                                                                <Form.Control.Feedback type="invalid">
                                                                    {errors.pensionContributions?.autoEnrolmentEmployer}
                                                                </Form.Control.Feedback>
                                                            </InputGroup>
                                                        </Col>
                                                    </Form.Group>
                                                    <Form.Check
                                                        type="switch"
                                                        id="autoEnrolmentAsSalarySacrifice"
                                                        label={<>As salary sacrifice <InfoPopover {...explanations.autoEnrolmentAsSalarySacrifice} /></>}
                                                        name="autoEnrolmentAsSalarySacrifice"
                                                        checked={values.autoEnrolmentAsSalarySacrifice}
                                                        onChange={handleInputChange}
                                                    />
                                                    <Form.Check
                                                        type="switch"
                                                        id="autoEnrolmentOnQualifyingEarnings"
                                                        label={<>On qualifying earnings <InfoPopover {...explanations.autoEnrolmentOnQualifyingEarnings} /></>}
                                                        name="autoEnrolmentOnQualifyingEarnings"
                                                        checked={values.autoEnrolmentOnQualifyingEarnings}
                                                        onChange={handleInputChange}
                                                    />

                                                    <hr />

                                                    <Form.Group as={Row} controlId="pensionContributions.salarySacrifice">
                                                        <Form.Label column>Salary/Bonus Sacrifice <InfoPopover {...explanations.salarySacrifice} /></Form.Label>
                                                        <Col>
                                                            <InputGroup hasValidation>
                                                                <Button
                                                                    variant="outline-secondary"
                                                                    aria-label="Switch between pounds and percentage"
                                                                    title="Switch between £ and %"
                                                                    onClick={() => setFieldValue('salarySacrificeIsPercentage', !values.salarySacrificeIsPercentage, true)}
                                                                >
                                                                    {values.salarySacrificeIsPercentage ? '%' : '£'}
                                                                </Button>
                                                                <Form.Control
                                                                    type="number"
                                                                    inputMode="decimal"
                                                                    name="pensionContributions.salarySacrifice"
                                                                    value={values.pensionContributions.salarySacrifice}
                                                                    onChange={handleInputChange}
                                                                    isValid={!errors.pensionContributions?.salarySacrifice}
                                                                    isInvalid={!!errors.pensionContributions?.salarySacrifice}
                                                                    min={0}
                                                                    max={values.salarySacrificeIsPercentage ? 100 : undefined}
                                                                    step={values.salarySacrificeIsPercentage ? 1 : 100}
                                                                />
                                                                <Form.Control.Feedback type="invalid">
                                                                    {errors.pensionContributions?.salarySacrifice}
                                                                </Form.Control.Feedback>
                                                            </InputGroup>
                                                        </Col>
                                                    </Form.Group>
                                                    <Form.Check
                                                        type="switch"
                                                        id="employerNISavingsToPension"
                                                        label={<>Employer NI savings to pension <InfoPopover {...explanations.employerNISavingsToPension} /></>}
                                                        name="employerNISavingsToPension"
                                                        checked={values.employerNISavingsToPension}
                                                        onChange={handleInputChange}
                                                    />

                                                    <hr />

                                                    <Form.Group as={Row} controlId="pensionContributions.personal">
                                                        <Form.Label column>Personal Contributions <InfoPopover {...explanations.personalContributions} /></Form.Label>
                                                        <Col>
                                                            <InputGroup hasValidation>
                                                                <InputGroup.Text>£</InputGroup.Text>
                                                                <Form.Control
                                                                    type="number"
                                                                    inputMode="decimal"
                                                                    name="pensionContributions.personal"
                                                                    value={values.pensionContributions.personal}
                                                                    onChange={handleInputChange}
                                                                    isValid={!errors.pensionContributions?.personal}
                                                                    isInvalid={!!errors.pensionContributions?.personal}
                                                                    min={0}
                                                                    step={100}
                                                                />
                                                                <Form.Control.Feedback type="invalid">
                                                                    {errors.pensionContributions?.personal}
                                                                </Form.Control.Feedback>
                                                            </InputGroup>
                                                        </Col>
                                                    </Form.Group>
                                                    <Form.Check
                                                        type="switch"
                                                        id="taxReliefAtSource"
                                                        label={<>Relief at source <InfoPopover {...explanations.taxReliefAtSource} /></>}
                                                        name="taxReliefAtSource"
                                                        checked={values.taxReliefAtSource}
                                                        onChange={handleInputChange}
                                                    />
                                                </div>
                                            </Collapse>
                                        </Card.Body>
                                    </Card>

                                    <Form.Group as={Row} controlId="annualGrossSalary" className="mt-2">
                                        <Form.Label column>Annual Gross Salary <InfoPopover {...explanations.annualGrossSalary} /></Form.Label>
                                        <Col>
                                            <InputGroup hasValidation>
                                                <InputGroup.Text>£</InputGroup.Text>
                                                <Form.Control
                                                    type="number"
                                                    inputMode="decimal"
                                                    name="annualGrossSalary"
                                                    value={values.annualGrossSalary}
                                                    onChange={handleInputChange}
                                                    isValid={!errors.annualGrossSalary}
                                                    isInvalid={!!errors.annualGrossSalary}
                                                    min={0}
                                                    step={1000}
                                                />
                                                <Form.Control.Feedback type="invalid">
                                                    {errors.annualGrossSalary}
                                                </Form.Control.Feedback>
                                            </InputGroup>
                                        </Col>
                                    </Form.Group>

                                    <Form.Group as={Row} controlId="workingDaysPerWeek" className="mt-2">
                                        <Form.Label column>Working Days per Week <InfoPopover {...explanations.workingDaysPerWeek} /></Form.Label>
                                        <Col>
                                            <Form.Select
                                                name="workingDaysPerWeek"
                                                value={values.workingDaysPerWeek}
                                                onChange={handleInputChange}
                                            >
                                                {[5, 4, 3, 2, 1].map(days => (
                                                    <option key={days} value={days}>
                                                        {days === 5 ? '5 (full-time)' : days}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                        </Col>
                                    </Form.Group>

                                    <Form.Group as={Row} controlId="annualGrossBonus" className="mt-2">
                                        <Form.Label column>Annual Gross Bonus <InfoPopover {...explanations.annualGrossBonus} /></Form.Label>
                                        <Col>
                                            <InputGroup hasValidation>
                                                <InputGroup.Text>£</InputGroup.Text>
                                                <Form.Control
                                                    type="number"
                                                    inputMode="decimal"
                                                    name="annualGrossBonus"
                                                    value={values.annualGrossBonus}
                                                    onChange={handleInputChange}
                                                    isValid={!errors.annualGrossBonus}
                                                    isInvalid={!!errors.annualGrossBonus}
                                                    min={0}
                                                    step={1000}
                                                />
                                                <Form.Control.Feedback type="invalid">
                                                    {errors.annualGrossBonus}
                                                </Form.Control.Feedback>
                                            </InputGroup>
                                        </Col>
                                    </Form.Group>

                                    <Form.Group as={Row} controlId="annualGrossDividends" className="mt-2">
                                        <Form.Label column>Annual Gross Dividends <InfoPopover {...explanations.annualGrossDividends} /></Form.Label>
                                        <Col>
                                            <InputGroup hasValidation>
                                                <InputGroup.Text>£</InputGroup.Text>
                                                <Form.Control
                                                    type="number"
                                                    inputMode="decimal"
                                                    name="annualGrossDividends"
                                                    value={values.annualGrossDividends}
                                                    onChange={handleInputChange}
                                                    isValid={!errors.annualGrossDividends}
                                                    isInvalid={!!errors.annualGrossDividends}
                                                    min={0}
                                                    step={500}
                                                />
                                                <Form.Control.Feedback type="invalid">
                                                    {errors.annualGrossDividends}
                                                </Form.Control.Feedback>
                                            </InputGroup>
                                        </Col>
                                    </Form.Group>

                                    <iframe
                                        src="https://github.com/sponsors/wozniakpawel/button"
                                        title="Sponsor wozniakpawel"
                                        height="32"
                                        width="114"
                                        style={{ border: '0', borderRadius: "6px" }}
                                        className="mt-2"
                                    />

                                </Form>
                                <UseEffectWrapper onUserInputsChange={onUserInputsChange} />
                            </>
                        );
                    }}
                </Formik>
            </Container>
        </>
    );
};
