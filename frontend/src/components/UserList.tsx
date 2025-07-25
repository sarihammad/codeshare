import React from 'react';

interface User {
  name: string;
  color: string;
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
      <h2 className="font-semibold mb-2">Active Users</h2>
      {users.length === 0 ? (
        <div className="text-gray-500">No users present</div>
      ) : (
        <ul className="space-y-2">
          {users.map((user, idx) => (
            <li key={idx} className="flex items-center gap-2">
              <span
                className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: user.color }}
                title={user.name}
              >
                {getInitials(user.name)}
              </span>
              <span
                className="text-sm font-medium"
                style={{ color: user.color }}
              >
                {user.name}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default UserList;
