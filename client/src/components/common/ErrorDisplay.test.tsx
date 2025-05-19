import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest'; // Vitest globals
import { ErrorDisplay } from './ErrorDisplay'; // Named import

// Mock lucide-react icons
vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react');
  return {
    ...actual,
    Zap: (props: any) => <svg data-testid="zap-icon" {...props} />,
  };
});

describe('ErrorDisplay', () => {
  const testMessage = 'This is a test error message.';

  it('renders without crashing', () => {
    render(<ErrorDisplay message={testMessage} />);
  });

  it('displays the passed message prop', () => {
    render(<ErrorDisplay message={testMessage} />);
    expect(screen.getByText(`Error: ${testMessage}`)).toBeInTheDocument();
  });

  it('displays the generic error title', () => {
    render(<ErrorDisplay message={testMessage} />);
    expect(screen.getByText('Could not load plans.')).toBeInTheDocument();
  });

  it('renders the error icon', () => {
    render(<ErrorDisplay message={testMessage} />);
    expect(screen.getByTestId('zap-icon')).toBeInTheDocument();
  });
}); 
