import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { BrowserRouter } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';
import { authSlice } from '../../store/authSlice';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: authSlice.reducer,
    },
    preloadedState: {
      auth: {
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null,
        ...initialState,
      },
    },
  });
};

const TestWrapper = ({
  children,
  store,
}: {
  children: React.ReactNode;
  store: any;
}) => (
  <Provider store={store}>
    <BrowserRouter>{children}</BrowserRouter>
  </Provider>
);

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render children when user is authenticated', () => {
    const store = createMockStore({
      isAuthenticated: true,
      user: { id: '1', email: 'test@example.com' },
    });

    render(
      <TestWrapper store={store}>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </TestWrapper>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should show loading spinner when checking authentication', () => {
    const store = createMockStore({
      loading: true,
    });

    render(
      <TestWrapper store={store}>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </TestWrapper>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should redirect to login when user is not authenticated', () => {
    const store = createMockStore({
      isAuthenticated: false,
      user: null,
    });

    render(
      <TestWrapper store={store}>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </TestWrapper>
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
});
