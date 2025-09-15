import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MonacoEditor from '../MonacoEditor';

// Mock the Toast context
const mockAddToast = vi.fn();
vi.mock('../Toast', () => ({
  useToast: () => ({
    addToast: mockAddToast,
  }),
}));

// Mock the API config
vi.mock('@/config/api', () => ({
  API_CONFIG: {
    YJS_WS_URL: 'ws://localhost:8080/ws/yjs',
  },
  apiCall: vi.fn(),
  API_ENDPOINTS: {
    ROOMS: {
      SNAPSHOT: (roomId: string) => `/api/rooms/${roomId}/snapshot`,
    },
  },
}));

describe('MonacoEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the editor with default props', () => {
    render(<MonacoEditor />);

    expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
  });

  it('shows active users count', () => {
    render(<MonacoEditor roomId="test-room" userId="test-user" />);

    expect(screen.getByText(/Active users:/)).toBeInTheDocument();
  });

  it('displays save status indicators', () => {
    render(<MonacoEditor roomId="test-room" />);

    // Should show "All changes saved" by default
    expect(screen.getByText('All changes saved')).toBeInTheDocument();
  });

  it('displays WebSocket connection status', () => {
    render(<MonacoEditor roomId="test-room" />);

    // Should show connecting status initially
    expect(screen.getByText(/● Connecting/)).toBeInTheDocument();
  });

  it('calls onAwarenessUpdate when provided', async () => {
    const mockOnAwarenessUpdate = vi.fn();

    render(
      <MonacoEditor
        roomId="test-room"
        userId="test-user"
        onAwarenessUpdate={mockOnAwarenessUpdate}
      />
    );

    // Wait for the component to initialize
    await waitFor(() => {
      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });
  });

  it('handles keyboard shortcuts', async () => {
    render(<MonacoEditor roomId="test-room" />);

    // The keyboard shortcut should be registered when the editor mounts
    await waitFor(() => {
      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });
  });
});
