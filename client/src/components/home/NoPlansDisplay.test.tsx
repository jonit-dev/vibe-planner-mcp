import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest'; // Vitest globals
import { NoPlansDisplay } from './NoPlansDisplay'; // Named import

// Mock lucide-react icons
vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react');
  return {
    ...actual,
    Briefcase: (props: any) => <svg data-testid="briefcase-icon" {...props} />,
  };
});

describe('NoPlansDisplay', () => {
  it('renders without crashing', () => {
    render(<NoPlansDisplay />);
  });

  it('renders the icon, text, and button', () => {
    render(<NoPlansDisplay />);
    expect(screen.getByTestId('briefcase-icon')).toBeInTheDocument();
    expect(screen.getByText('No plans available yet.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create your first plan/i })).toBeInTheDocument();
  });

  it('calls onCreatePlan when the button is clicked if prop is provided', () => {
    const mockOnCreatePlan = vi.fn();
    render(<NoPlansDisplay onCreatePlan={mockOnCreatePlan} />);
    const button = screen.getByRole('button', { name: /create your first plan/i });
    fireEvent.click(button);
    expect(mockOnCreatePlan).toHaveBeenCalledTimes(1);
  });

  it('does not throw error if onCreatePlan is not provided and button is clicked', () => {
    render(<NoPlansDisplay />);
    const button = screen.getByRole('button', { name: /create your first plan/i });
    // Expecting no error to be thrown here
    expect(() => fireEvent.click(button)).not.toThrow();
  });
}); 
