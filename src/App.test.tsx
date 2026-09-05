import { render, screen, fireEvent, within } from '@testing-library/react';
import { beforeEach, expect, test } from 'vitest';
import App from './App';
beforeEach(() => localStorage.clear());
test('opens with the current tax year and a clearly labelled salary example', () => {
  render(<App />);
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Clearer numbers');
  expect(screen.getByLabelText('Tax Year')).toHaveValue('2026/27');
  expect(screen.getByLabelText('Annual salary before tax')).toHaveValue(45000);
  expect(screen.getByLabelText('Take-home summary')).toHaveTextContent('£2,993.30');
});
test('salary and result-period changes update the take-home result', () => {
  render(<App />);
  fireEvent.change(screen.getByLabelText('Annual salary before tax'), {
    target: { value: '60000' },
  });
  expect(screen.getByLabelText('Take-home summary')).toHaveTextContent('£3,779.78');
  fireEvent.click(screen.getByRole('button', { name: 'Annual' }));
  expect(screen.getByLabelText('Take-home summary')).toHaveTextContent('£45,357.40');
});
test('a negative input is explained and cannot corrupt the last valid result', () => {
  render(<App />);
  fireEvent.change(screen.getByLabelText('Annual salary before tax'), {
    target: { value: '-100' },
  });
  expect(screen.getByLabelText('Annual salary before tax')).toHaveAttribute('aria-invalid', 'true');
  expect(screen.getByText(/Results use your last valid value/)).toBeInTheDocument();
  expect(screen.getByLabelText('Take-home summary')).toHaveTextContent('£2,993.30');
});
test('pension costs appear in total deductions without counting employer money as a cost', () => {
  render(<App />);
  fireEvent.click(screen.getByText('Pension contributions', { exact: true }));
  fireEvent.click(screen.getByRole('switch', { name: 'Include pension' }));
  fireEvent.change(screen.getByLabelText('Workplace · you'), { target: { value: '5' } });
  fireEvent.change(screen.getByLabelText('Workplace · employer'), { target: { value: '3' } });
  const table = within(screen.getByRole('region', { name: 'Income breakdown table' }));
  expect(table.getByRole('row', { name: /Your pension contributions/ })).toHaveTextContent(
    '£2,250.00',
  );
  expect(table.getByRole('row', { name: /Total deductions/ })).toHaveTextContent('£10,700.40');
});
test('dark mode has an accessible state and persists only the preference', () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'Dark mode' }));
  expect(screen.getByRole('button', { name: 'Dark mode' })).toHaveAttribute('aria-pressed', 'true');
  expect(localStorage.getItem('theme')).toBe('dark');
  expect(localStorage.length).toBe(1);
});

test('fractional child counts are rejected rather than silently rounded', () => {
  render(<App />);
  fireEvent.click(screen.getByText('Child Benefit & allowances', { exact: true }));
  fireEvent.change(screen.getByLabelText('Who receives Child Benefit?'), {
    target: { value: 'self' },
  });
  fireEvent.change(screen.getByLabelText('Eligible children'), { target: { value: '1.5' } });
  expect(screen.getByLabelText('Eligible children')).toHaveAttribute('aria-invalid', 'true');
  expect(screen.getByText(/in steps of 1/)).toBeInTheDocument();
});
