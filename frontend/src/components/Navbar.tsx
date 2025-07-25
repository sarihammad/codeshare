'use client';

import React from 'react';
import Link from 'next/link';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { logout } from '@/store/authSlice';
import { useRouter } from 'next/navigation';

const Navbar: React.FC = () => {
  const { token } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const handleLogout = () => {
    dispatch(logout());
    router.push('/login');
  };

  return (
    <nav className="w-full bg-white shadow flex items-center justify-between px-6 py-3">
      <Link href="/" className="text-xl font-bold text-red-600">
        CodeShare
      </Link>
      <div className="flex items-center gap-4">
        {token ? (
          <>
            <Link href="/dashboard" className="hover:text-red-600">
              Dashboard
            </Link>
            <Link href="/profile" className="hover:text-red-600">
              Profile
            </Link>
            <Link href="/settings" className="hover:text-red-600">
              Settings
            </Link>
            <button
              onClick={handleLogout}
              className="ml-2 px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="hover:text-red-600">
              Login
            </Link>
            <Link href="/register" className="hover:text-red-600">
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
