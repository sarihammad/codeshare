'use client';

import React from 'react';
import Link from 'next/link';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { logoutThunk } from '@/store/authSlice';
import { useRouter } from 'next/navigation';

const Navbar: React.FC = () => {
  const auth = useSelector((state: RootState) => state.auth);
  const isAuthenticated = auth.isAuthenticated;
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const handleLogout = async () => {
    await dispatch(logoutThunk()).unwrap();
    router.push('/login');
  };

  return (
    <nav className="w-full bg-white shadow flex items-center justify-between px-6 py-3" role="navigation" aria-label="Main navigation">
      <Link href="/" className="text-xl font-bold text-red-600" aria-label="CodeShare home">
        CodeShare
      </Link>
      <div className="flex items-center gap-4">
        {isAuthenticated ? (
          <>
            <Link href="/dashboard" className="hover:text-red-600" aria-label="Go to dashboard">
              Dashboard
            </Link>
            <Link href="/profile" className="hover:text-red-600" aria-label="Go to profile">
              Profile
            </Link>
            <Link href="/settings" className="hover:text-red-600" aria-label="Go to settings">
              Settings
            </Link>
            <button
              onClick={handleLogout}
              className="ml-2 px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600"
              aria-label="Logout from account"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="hover:text-red-600" aria-label="Login to account">
              Login
            </Link>
            <Link href="/register" className="hover:text-red-600" aria-label="Create new account">
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
