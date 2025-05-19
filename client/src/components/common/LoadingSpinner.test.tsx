import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest'; // Vitest globals
import { LoadingSpinner } from './LoadingSpinner'; // Named import

describe('LoadingSpinner', () => {
  it('renders without crashing', () => {
    render(<LoadingSpinner />);
  });

  it('has the loading-spinner class and is visible', () => {
    const { container } = render(<LoadingSpinner />);
    // DaisyUI uses a span for the spinner. It doesn't have an explicit accessible role by default.
    // Querying by class is more reliable here.
    const spinnerElement = container.querySelector('.loading-spinner');
    expect(spinnerElement).toBeInTheDocument();
    expect(spinnerElement).toHaveClass('loading-spinner');
    expect(spinnerElement).toBeVisible();
  });
}); 
