'use client';

import React, { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { AuthState } from '@/store/authSlice';
import { logoutThunk } from '@/store/authSlice';
import { AppDispatch } from '@/store';
import Link from 'next/link';
import { apiCall, API_ENDPOINTS } from '@/config/api';
import { motion } from 'framer-motion';
import { notifyError } from '@/lib/notify';
import {
  PlusIcon,
  UserGroupIcon,
  ClockIcon,
  CodeBracketIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';

interface Room {
  id: string;
  name: string;
  language?: string;
  createdAt: string;
}

const DashboardPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const auth = useSelector((state: RootState) => state.auth) as AuthState;
  const { isAuthenticated } = auth;
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRooms = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiCall(API_ENDPOINTS.ROOMS.MY_ROOMS);
        if (!res.ok) throw new Error('Failed to fetch rooms');
        const data = await res.json();
        setRooms(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    if (isAuthenticated) fetchRooms();
  }, [isAuthenticated]);

  const handleLogout = async () => {
    try {
      await dispatch(logoutThunk()).unwrap();
    } catch (err) {
      notifyError(err as Error);
    }
  };

  const getLanguageColor = (language?: string) => {
    const colors: { [key: string]: string } = {
      javascript: 'bg-yellow-500',
      typescript: 'bg-blue-500',
      python: 'bg-green-500',
      java: 'bg-red-500',
      csharp: 'bg-purple-500',
      cpp: 'bg-black-500',
      go: 'bg-cyan-500',
      rust: 'bg-orange-500',
      markdown: 'bg-gray-500',
      plaintext: 'bg-gray-400',
    };
    return colors[language || 'plaintext'] || 'bg-gray-400';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex justify-between items-center"
          >
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Your Workspace
              </h1>
              <p className="text-gray-300">
                Manage your collaborative coding rooms
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white px-4 py-2 rounded-xl hover:bg-white/20 transition-all duration-300"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
              Logout
            </button>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col sm:flex-row gap-4 mb-8"
          >
            <Link
              href="/create-room"
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-3 rounded-xl hover:shadow-lg hover:shadow-red-500/25 transition-all duration-300 transform hover:scale-105"
            >
              <PlusIcon className="w-5 h-5" />
              Create New Room
            </Link>
            <Link
              href="/join-room"
              className="flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white px-6 py-3 rounded-xl hover:bg-white/20 transition-all duration-300"
            >
              <UserGroupIcon className="w-5 h-5" />
              Join Room
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          >
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                  <CodeBracketIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">
                    {rooms.length}
                  </div>
                  <div className="text-gray-400 text-sm">Total Rooms</div>
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                  <UserGroupIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">Active</div>
                  <div className="text-gray-400 text-sm">Collaborations</div>
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <ClockIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">24/7</div>
                  <div className="text-gray-400 text-sm">Available</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Rooms Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
              </div>
            ) : error ? (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
                <div className="text-red-400 font-medium">{error}</div>
              </div>
            ) : rooms.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CodeBracketIcon className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  No rooms yet
                </h3>
                <p className="text-gray-400 mb-6">
                  Create your first collaborative coding room to get started
                </p>
                <Link
                  href="/create-room"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-3 rounded-xl hover:shadow-lg hover:shadow-red-500/25 transition-all duration-300"
                >
                  <PlusIcon className="w-5 h-5" />
                  Create Your First Room
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rooms.map((room, index) => (
                  <motion.div
                    key={room.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    whileHover={{ scale: 1.02 }}
                    className="group"
                  >
                    <Link
                      href={`/editor/${room.id}`}
                      className="block bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 h-full"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-3 h-3 rounded-full ${getLanguageColor(
                              room.language
                            )}`}
                          />
                          <h3 className="text-lg font-semibold text-white group-hover:text-red-400 transition-colors">
                            {room.name}
                          </h3>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-400">
                        <span className="capitalize">
                          {room.language || 'plaintext'}
                        </span>
                        <span>{formatDate(room.createdAt)}</span>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default DashboardPage;
