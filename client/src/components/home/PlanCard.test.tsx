import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrdSummary } from '../../types';
import { PlanCard } from './PlanCard';

// Mock lucide-react icons
vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react');
  return {
    ...actual,
    Calendar: (props: any) => <svg data-testid="calendar-icon" {...props} />,
  };
});

const mockSummaryBase: PrdSummary = {
  id: 'plan1',
  name: 'Test Plan Name',
  description: 'Test Plan Description',
  createdAt: new Date().toISOString(),
  totalTasks: 0,
  completedTasks: 0,
};

describe('PlanCard', () => {
  const mockOnSelectPlan = vi.fn();

  beforeEach(() => {
    mockOnSelectPlan.mockClear();
  });

  it('renders at all', () => {
    render(<PlanCard summary={mockSummaryBase} onSelectPlan={mockOnSelectPlan} />);
    // No assertions yet, just checking if render itself causes a type error on import
  });

  it('renders plan name, description, and creation date', () => {
    const summary = { ...mockSummaryBase };
    render(<PlanCard summary={summary} onSelectPlan={mockOnSelectPlan} />);
    expect(screen.getByText(summary.name)).toBeInTheDocument();
    expect(screen.getByText(summary.description!)).toBeInTheDocument(); // Assuming description is present
    expect(screen.getByTestId('calendar-icon')).toBeInTheDocument();
    expect(screen.getByText(`Created: ${new Date(summary.createdAt).toLocaleDateString()}`)).toBeInTheDocument();
  });

  it('does not render description if not provided', () => {
    const summary = { ...mockSummaryBase, description: null };
    render(<PlanCard summary={summary} onSelectPlan={mockOnSelectPlan} />);
    expect(screen.queryByText(mockSummaryBase.description!)).not.toBeInTheDocument();
  });

  it('calculates and displays 0% progress for no tasks', () => {
    const summary = { ...mockSummaryBase, totalTasks: 0, completedTasks: 0 };
    const { container } = render(<PlanCard summary={summary} onSelectPlan={mockOnSelectPlan} />);
    expect(screen.getByText('0/0 tasks')).toBeInTheDocument();
    expect(screen.getByText('No tasks yet. Add tasks to see progress.')).toBeInTheDocument();
    const progressBar = container.querySelector('.bg-primary.h-2.5.rounded-full');
    expect(progressBar).toHaveStyle('width: 0%');
  });

  it('calculates and displays 50% progress', () => {
    const summary = { ...mockSummaryBase, totalTasks: 10, completedTasks: 5 };
    const { container } = render(<PlanCard summary={summary} onSelectPlan={mockOnSelectPlan} />);
    expect(screen.getByText('5/10 tasks')).toBeInTheDocument();
    expect(screen.getByText('Keep going!')).toBeInTheDocument();
    const progressBar = container.querySelector('.bg-primary.h-2.5.rounded-full');
    expect(progressBar).toHaveStyle('width: 50%');
  });

  it('calculates and displays 100% progress', () => {
    const summary = { ...mockSummaryBase, totalTasks: 10, completedTasks: 10 };
    const { container } = render(<PlanCard summary={summary} onSelectPlan={mockOnSelectPlan} />);
    expect(screen.getByText('10/10 tasks')).toBeInTheDocument();
    expect(screen.getByText('Plan complete!')).toBeInTheDocument();
    const progressBar = container.querySelector('.bg-primary.h-2.5.rounded-full');
    expect(progressBar).toHaveStyle('width: 100%');
  });

  it('calls onSelectPlan with summary.id when clicked', () => {
    const summary = { ...mockSummaryBase };
    render(<PlanCard summary={summary} onSelectPlan={mockOnSelectPlan} />);
    fireEvent.click(screen.getByRole('button')); // The whole card is a button
    expect(mockOnSelectPlan).toHaveBeenCalledWith(summary.id);
  });

  it('calls onSelectPlan with summary.id on Enter key press', () => {
    const summary = { ...mockSummaryBase };
    render(<PlanCard summary={summary} onSelectPlan={mockOnSelectPlan} />);
    fireEvent.keyPress(screen.getByRole('button'), { key: 'Enter', code: 'Enter', charCode: 13 });
    expect(mockOnSelectPlan).toHaveBeenCalledWith(summary.id);
  });

  it('handles totalTasks or completedTasks being undefined (should default to 0)', () => {
    const summary = {
      ...mockSummaryBase,
      totalTasks: undefined as any, // Test undefined explicitly
      completedTasks: undefined as any,
    };
    const { container } = render(<PlanCard summary={summary} onSelectPlan={mockOnSelectPlan} />);
    expect(screen.getByText('0/0 tasks')).toBeInTheDocument();
    const progressBar = container.querySelector('.bg-primary.h-2.5.rounded-full');
    expect(progressBar).toHaveStyle('width: 0%');
  });

}); 
