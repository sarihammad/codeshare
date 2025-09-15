import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ToastProvider, useToast } from '../Toast';

// Test component that uses the toast
function TestComponent() {
  const { addToast } = useToast();

  return (
    <div>
      <button onClick={() => addToast('Test message', 'success')}>
        Add Success Toast
      </button>
      <button onClick={() => addToast('Error message', 'error')}>
        Add Error Toast
      </button>
      <button onClick={() => addToast('Warning message', 'warning')}>
        Add Warning Toast
      </button>
      <button onClick={() => addToast('Info message', 'info')}>
        Add Info Toast
      </button>
    </div>
  );
}

describe('Toast', () => {
  it('renders without crashing', () => {
    render(
      <ToastProvider>
        <div>Test content</div>
      </ToastProvider>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('shows success toast when added', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    act(() => {
      screen.getByText('Add Success Toast').click();
    });

    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('shows error toast when added', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    act(() => {
      screen.getByText('Add Error Toast').click();
    });

    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('shows warning toast when added', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    act(() => {
      screen.getByText('Add Warning Toast').click();
    });

    expect(screen.getByText('Warning message')).toBeInTheDocument();
  });

  it('shows info toast when added', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    act(() => {
      screen.getByText('Add Info Toast').click();
    });

    expect(screen.getByText('Info message')).toBeInTheDocument();
  });

  it('allows closing toast manually', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    act(() => {
      screen.getByText('Add Success Toast').click();
    });

    expect(screen.getByText('Test message')).toBeInTheDocument();

    act(() => {
      screen.getByLabelText('Close toast').click();
    });

    expect(screen.queryByText('Test message')).not.toBeInTheDocument();
  });

  it('throws error when useToast is used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useToast must be used within a ToastProvider');

    consoleSpy.mockRestore();
  });
});
