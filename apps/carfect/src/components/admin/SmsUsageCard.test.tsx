import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SmsUsageCard } from './SmsUsageCard';

describe('SmsUsageCard', () => {
  it('shows usage count and limit', () => {
    render(<SmsUsageCard smsCount={42} smsLimit={100} />);
    expect(screen.getByText('42 / 100')).toBeInTheDocument();
    expect(screen.getByText('42% wykorzystane')).toBeInTheDocument();
  });

  it('shows near-limit warning when usage >= 80%', () => {
    render(<SmsUsageCard smsCount={85} smsLimit={100} />);
    expect(screen.getByText('Pozostało 15 SMS')).toBeInTheDocument();
  });

  it('shows limit exhausted when usage equals limit', () => {
    render(<SmsUsageCard smsCount={100} smsLimit={100} />);
    expect(screen.getByText('Limit wyczerpany')).toBeInTheDocument();
  });

  it('shows over-limit cost and invoice notice', () => {
    render(<SmsUsageCard smsCount={120} smsLimit={100} />);
    expect(screen.getByText('20 SMS ponad limit = 2,40 zł netto')).toBeInTheDocument();
    expect(
      screen.getByText('1 SMS ponad limit = 0,12 zł netto. Zostanie doliczone do najbliższej faktury.'),
    ).toBeInTheDocument();
  });

  it('does not show invoice notice when under limit', () => {
    render(<SmsUsageCard smsCount={50} smsLimit={100} />);
    expect(
      screen.queryByText(/Zostanie doliczone/),
    ).not.toBeInTheDocument();
  });

  it('shows instance name when showInstanceName is true', () => {
    render(<SmsUsageCard smsCount={10} smsLimit={100} showInstanceName instanceName="ARM CAR" />);
    expect(screen.getByText('ARM CAR')).toBeInTheDocument();
  });

  it('shows default label when showInstanceName is false', () => {
    render(<SmsUsageCard smsCount={10} smsLimit={100} />);
    expect(screen.getByText('Zużycie SMS')).toBeInTheDocument();
  });

  it('handles zero limit without division by zero', () => {
    render(<SmsUsageCard smsCount={5} smsLimit={0} />);
    expect(screen.getByText('5 / 0')).toBeInTheDocument();
  });

  it('calculates cost correctly for single SMS over limit', () => {
    render(<SmsUsageCard smsCount={101} smsLimit={100} />);
    expect(screen.getByText('1 SMS ponad limit = 0,12 zł netto')).toBeInTheDocument();
  });
});
