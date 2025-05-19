import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrdSummary } from '../../types';
import { PlanList } from './PlanList';

// Mock PlanCard to verify props and count
vi.mock('./PlanCard', () => ({
  PlanCard: vi.fn((props: { summary: PrdSummary, onSelectPlan: (id: string) => void }) => (
    <div data-testid="plan-card">
      <span data-testid="plan-id">{props.summary.id}</span>
      <button onClick={() => props.onSelectPlan(props.summary.id)}>Select</button>
    </div>
  )),
}));

const mockSummaries: PrdSummary[] = [
  { id: '1', name: 'Plan 1', createdAt: new Date().toISOString(), totalTasks: 1, completedTasks: 0 },
  { id: '2', name: 'Plan 2', createdAt: new Date().toISOString(), totalTasks: 2, completedTasks: 1 },
  { id: '3', name: 'Plan 3', createdAt: new Date().toISOString(), totalTasks: 3, completedTasks: 3 },
];

describe('PlanList', () => {
  const mockOnSelectPlan = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing with empty list', () => {
    render(<PlanList planSummaries={[]} onSelectPlan={mockOnSelectPlan} />);
  });

  it('renders the correct number of PlanCard components', () => {
    render(<PlanList planSummaries={mockSummaries} onSelectPlan={mockOnSelectPlan} />);
    const cards = screen.getAllByTestId('plan-card');
    expect(cards.length).toBe(mockSummaries.length);
  });

  it('passes the correct summary and onSelectPlan props to each PlanCard', async () => {
    render(<PlanList planSummaries={mockSummaries} onSelectPlan={mockOnSelectPlan} />);
    const { PlanCard: MockedPlanCard } = await import('./PlanCard');

    expect(MockedPlanCard).toHaveBeenCalledTimes(mockSummaries.length);

    mockSummaries.forEach((summary, index) => {
      expect(MockedPlanCard).toHaveBeenNthCalledWith(
        index + 1,
        expect.objectContaining({
          summary: summary,
          onSelectPlan: mockOnSelectPlan,
        }),
        {}
      );
    });
  });

  it('calls onSelectPlan when a PlanCard is clicked (simulated via mock)', () => {
    render(<PlanList planSummaries={[mockSummaries[0]]} onSelectPlan={mockOnSelectPlan} />);
    const selectButton = screen.getByText('Select');
    fireEvent.click(selectButton);
    expect(mockOnSelectPlan).toHaveBeenCalledWith(mockSummaries[0].id);
  });
}); 
