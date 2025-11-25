import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { ErrorBoundary } from '../../components/ErrorBoundary';

// Mock the SecurityService
vi.mock('../../services/SecurityService', () => ({
  SecurityService: {
    logSecurityEvent: vi.fn()
  }
}));

// Mock the logger
vi.mock('../../utils/logger', () => ({
  log: {
    error: vi.fn()
  }
}));

describe('ErrorBoundary', () => {
  const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
    if (shouldThrow) {
      throw new Error('Test error');
    }
    return <div>No error</div>;
  };

  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('should catch and display error information', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { /* empty */ });

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Something went wrong/)).toBeInTheDocument();
    expect(screen.getByText(/Test error/)).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('should provide retry functionality', async () => {
    const user = userEvent.setup();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { /* empty */ });

    const TestComponent = () => {
      const [shouldThrow, setShouldThrow] = React.useState(true);
      return (
        <ErrorBoundary>
          {shouldThrow ? (
            <button onClick={() => setShouldThrow(false)}>
              Fix Error
            </button>
          ) : (
            <div>Fixed!</div>
          )}
        </ErrorBoundary>
      );
    };

    render(<TestComponent />);

    expect(screen.getByText(/Something went wrong/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Fix Error/ }));

    expect(screen.getByText('Fixed!')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });
});