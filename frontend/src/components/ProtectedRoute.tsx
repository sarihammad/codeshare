'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import EditorSkeleton from '@/components/EditorSkeleton';
import { RootState } from '@/store';
import { AuthState } from '@/store/authSlice';
import { checkAuthThunk } from '@/store/authSlice';
import { AppDispatch } from '@/store';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const dispatch = useDispatch<AppDispatch>();
  const auth = useSelector((state: RootState) => state.auth) as AuthState;
  const { isAuthenticated, loading } = auth;
  const router = useRouter();
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  useEffect(() => {
    // Only check auth once on mount
    if (!hasCheckedAuth) {
      console.log('ProtectedRoute: Checking authentication...');
      dispatch(checkAuthThunk()).finally(() => {
        setHasCheckedAuth(true);
      });
    }
  }, [dispatch, hasCheckedAuth]);

  useEffect(() => {
    // Only redirect after we've checked auth and confirmed user is not authenticated
    if (hasCheckedAuth && !loading && !isAuthenticated) {
      console.log(
        'ProtectedRoute: User not authenticated, redirecting to login'
      );
      router.replace('/login');
    }
  }, [hasCheckedAuth, isAuthenticated, loading, router]);

  // Show skeleton until auth check is complete
  if (!hasCheckedAuth || loading) {
    return <EditorSkeleton />;
  }

  // If auth check is complete and user is not authenticated, show skeleton while redirecting
  if (!isAuthenticated) {
    return <EditorSkeleton />;
  }

  // User is authenticated, render children
  return <>{children}</>;
};

export default ProtectedRoute;
