import React from 'react';

interface User {
  name: string;
  color: string;
  cursor?: {
    x: number;
    y: number;
  };
}

interface UserListProps {
  users: User[];
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0]?.toUpperCase() || '')
    .join('')
    .slice(0, 2);
}

const UserList: React.FC<UserListProps> = ({ users }) => {
  return (
    <div className="bg-white rounded shadow p-4 mb-4">
      <h2 className="font-semibold mb-2">Active Users ({users.length})</h2>
      {users.length === 0 ? (
        <div className="text-gray-500">No users present</div>
      ) : (
        <ul className="space-y-2">
          {users.map((user, idx) => (
            <li key={idx} className="flex items-center gap-2">
              <div className="relative">
                <span
                  className="inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold text-white shadow-sm"
                  style={{ backgroundColor: user.color }}
                  title={user.name}
                >
                  {getInitials(user.name)}
                </span>
                {user.cursor && (
                  <div
                    className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white shadow-sm animate-pulse"
                    style={{ backgroundColor: user.color }}
                    title={`${user.name} is typing`}
                  />
                )}
              </div>
              <div className="flex flex-col">
                <span
                  className="text-sm font-medium"
                  style={{ color: user.color }}
                >
                  {user.name}
                </span>
                {user.cursor && (
                  <span className="text-xs text-gray-500">Active</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default UserList;
