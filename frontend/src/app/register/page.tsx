'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store';
import { registerThunk, checkAuthThunk } from '@/store/authSlice';
import { AuthState } from '@/store/authSlice';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import LoadingSpinner from '@/components/LoadingSpinner';
import { notifyError } from '@/lib/notify';

const schema = z
  .object({
    email: z.string().email(),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6),
    agreeToTerms: z.literal(true, {
      errorMap: () => ({
        message: 'You must agree to the terms and conditions',
      }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const auth = useSelector((state: RootState) => state.auth) as AuthState;
  const { isAuthenticated, loading, error, user } = auth;
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  // Check authentication status on mount
  useEffect(() => {
    if (!hasCheckedAuth) {
      console.log('Register page: Checking authentication status...');
      dispatch(checkAuthThunk()).finally(() => {
        setHasCheckedAuth(true);
      });
    }
  }, [dispatch, hasCheckedAuth]);

  // Redirect if already authenticated
  useEffect(() => {
    if (hasCheckedAuth && isAuthenticated && !loading) {
      console.log(
        'Register page: User already authenticated, redirecting to dashboard'
      );
      router.replace('/dashboard');
    }
  }, [hasCheckedAuth, isAuthenticated, loading, router]);

  // Handle successful registration
  useEffect(() => {
    console.log(
      'Register page useEffect - isAuthenticated:',
      isAuthenticated,
      'user:',
      user,
      'loading:',
      loading
    );
    // Only redirect if we are authenticated and not loading
    if (isAuthenticated && user && !loading) {
      console.log(
        'Register page: Registration successful, redirecting to dashboard...'
      );
      router.replace('/dashboard');
    }
  }, [isAuthenticated, user, loading, router]);

  const onSubmit = async (data: FormData) => {
    try {
      await dispatch(
        registerThunk({ email: data.email, password: data.password })
      ).unwrap();
      // If registration is successful, the useEffect above will handle the redirect
    } catch (err) {
      // Error is already handled by the Redux slice
      notifyError(err as Error);
    }
  };

  // Show loading spinner while checking authentication
  if (!hasCheckedAuth || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 flex items-center justify-center">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  // If already authenticated, show loading while redirecting
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 flex items-center justify-center">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 flex flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-16 h-16 bg-gradient-to-br from-gray-900 via-green-800 to-black rounded-2xl flex items-center justify-center mx-auto mb-4"
          >
            <span className="text-white font-bold text-2xl">C</span>
          </motion.div>
          <h2 className="text-3xl font-bold text-white mb-2">
            Create Your Account
          </h2>
          <p className="text-gray-300">
            Join us and start your collaborative coding journey today!
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10"
        >
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm"
            >
              {error}
            </motion.div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                {...register('email')}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300"
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="text-xs text-red-400 mt-2">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                {...register('password')}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300"
                placeholder="Enter your password"
              />
              {errors.password && (
                <p className="text-xs text-red-400 mt-2">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                {...register('confirmPassword')}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300"
                placeholder="Confirm your password"
              />
              {errors.confirmPassword && (
                <p className="text-xs text-red-400 mt-2">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <div className="flex items-start gap-3">
              <input
                id="terms"
                type="checkbox"
                {...register('agreeToTerms')}
                className="mt-1 h-4 w-4 text-green-500 focus:ring-green-500 border-white/20 rounded bg-white/10"
              />
              <label htmlFor="terms" className="text-sm text-gray-300">
                I agree to the{' '}
                <Link
                  href="/terms"
                  className="text-green-400 hover:text-green-300 transition-colors"
                >
                  Terms
                </Link>{' '}
                and{' '}
                <Link
                  href="/privacy"
                  className="text-green-400 hover:text-green-300 transition-colors"
                >
                  Privacy Policy
                </Link>
              </label>
            </div>
            {errors.agreeToTerms && (
              <p className="text-xs text-red-400 mt-1">
                {errors.agreeToTerms.message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-br from-gray-900 via-green-800 to-black text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-green-500/25 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Creating account...
                </div>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-medium text-green-400 hover:text-green-300 transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
