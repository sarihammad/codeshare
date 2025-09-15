import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import UserList from '../UserList';

describe('UserList', () => {
  it('renders empty state when no users', () => {
    render(<UserList users={[]} />);

    expect(screen.getByText('No users present')).toBeInTheDocument();
    expect(screen.getByText('Active Users (0)')).toBeInTheDocument();
  });

  it('renders users with avatars and names', () => {
    const users = [
      { name: 'John Doe', color: '#ff0000' },
      { name: 'Jane Smith', color: '#00ff00' },
    ];

    render(<UserList users={users} />);

    expect(screen.getByText('Active Users (2)')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();

    // Check for user initials in avatars
    expect(screen.getByText('JD')).toBeInTheDocument();
    expect(screen.getByText('JS')).toBeInTheDocument();
  });

  it('shows activity indicator for users with cursor', () => {
    const users = [
      {
        name: 'Active User',
        color: '#ff0000',
        cursor: { x: 100, y: 200 },
      },
    ];

    render(<UserList users={users} />);

    expect(screen.getByText('Active User')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('handles single name users correctly', () => {
    const users = [{ name: 'SingleName', color: '#ff0000' }];

    render(<UserList users={users} />);

    expect(screen.getByText('SingleName')).toBeInTheDocument();
    expect(screen.getByText('S')).toBeInTheDocument();
  });

  it('handles users with multiple names correctly', () => {
    const users = [{ name: 'John Michael Doe', color: '#ff0000' }];

    render(<UserList users={users} />);

    expect(screen.getByText('John Michael Doe')).toBeInTheDocument();
    expect(screen.getByText('JM')).toBeInTheDocument();
  });
});
