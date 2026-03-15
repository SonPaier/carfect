import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SocialMediaCard } from './SocialMediaCard';

describe('SocialMediaCard', () => {
  it('renders nothing when no social links', () => {
    const { container } = render(<SocialMediaCard />);
    expect(container.innerHTML).toBe('');
  });

  it('renders only provided links', () => {
    render(
      <SocialMediaCard
        facebook="https://facebook.com/test"
        instagram="https://instagram.com/test"
      />,
    );

    expect(screen.getByText('Facebook')).toBeInTheDocument();
    expect(screen.getByText('Instagram')).toBeInTheDocument();
    expect(screen.queryByText('Opinie Google')).toBeNull();
    expect(screen.queryByText('Realizacje')).toBeNull();
  });

  it('renders all links when provided', () => {
    render(
      <SocialMediaCard
        facebook="https://facebook.com/test"
        instagram="https://instagram.com/test"
        googleReviewsUrl="https://g.page/test"
        portfolioUrl="https://portfolio.test.com"
      />,
    );

    expect(screen.getByText('Facebook')).toBeInTheDocument();
    expect(screen.getByText('Instagram')).toBeInTheDocument();
    expect(screen.getByText('Opinie Google')).toBeInTheDocument();
    expect(screen.getByText('Realizacje')).toBeInTheDocument();
  });

  it('links open in new tab', () => {
    render(<SocialMediaCard facebook="https://facebook.com/test" />);

    const link = screen.getByText('Facebook').closest('a');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(link).toHaveAttribute('href', 'https://facebook.com/test');
  });
});
