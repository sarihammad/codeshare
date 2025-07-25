'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import ProtectedRoute from '../../../components/ProtectedRoute';
import dynamic from 'next/dynamic';
import UserList from '../../../components/UserList';
import EditorSkeleton from '../../../components/EditorSkeleton';
import { apiCall, API_ENDPOINTS } from '@/config/api';

const MonacoEditor = dynamic(() => import('@/components/MonacoEditor'), {
  ssr: false,
  loading: () => <EditorSkeleton />,
});

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'csharp', label: 'C#' },
  { value: 'cpp', label: 'C++' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'plaintext', label: 'Plain Text' },
];

const EditorPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [userIds, setUserIds] = useState<string[]>([]);
  const [language, setLanguage] = useState('javascript');
  const [theme, setTheme] = useState<'vs-dark' | 'light'>('vs-dark');
  const users = userIds.map((id) => ({
    name: `User ${id.slice(0, 6)}`,
    color: getColorForUserId(id),
  }));

  React.useEffect(() => {
    if (!roomId) return;
    let ws: WebSocket | null = null;
    const url = `${
      process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080/ws/editor'
    }?roomId=${roomId}`;
    // If JWT cookie is not available, optionally add token param if you have it
    // if (auth.token) url += `&token=${auth.token}`;
    ws = new WebSocket(url);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'presence' && Array.isArray(data.users)) {
          setUserIds(data.users);
        }
      } catch {}
    };
    ws.onopen = () => {
      // Optionally: send a hello message or similar
    };
    ws.onerror = () => {};
    ws.onclose = () => {};
    return () => {
      if (ws) ws.close();
    };
  }, [roomId]);

  // Assign a color to each user ID for display
  function getColorForUserId(userId: string) {
    // Simple hash to color
    const colors = [
      '#3b82f6',
      '#ef4444',
      '#10b981',
      '#f59e42',
      '#a78bfa',
      '#f472b6',
      '#facc15',
      '#6ee7b7',
      '#f87171',
      '#818cf8',
    ];
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  // Save snapshot
  const handleSaveSnapshot = async () => {
    try {
      const res = await apiCall(API_ENDPOINTS.ROOMS.SNAPSHOT(roomId), {
        method: 'POST',
        body: JSON.stringify({ content: 'Sample content' }),
      });
      if (!res.ok) throw new Error('Failed to save snapshot');
      alert('Snapshot saved!');
    } catch (err) {
      alert((err as Error).message);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900">
        <div className="mx-auto py-8 px-4">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
                <h1 className="text-xl font-bold text-white">Room: {roomId}</h1>
                <div className="flex gap-2 items-center">
                  <label
                    htmlFor="language"
                    className="text-sm font-medium text-gray-300"
                  >
                    Language:
                  </label>
                  <select
                    id="language"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="border border-white/20 bg-white/10 rounded px-2 py-1 text-sm text-white"
                  >
                    {LANGUAGES.map((lang) => (
                      <option key={lang.value} value={lang.value}>
                        {lang.label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() =>
                      setTheme(theme === 'vs-dark' ? 'light' : 'vs-dark')
                    }
                    className="ml-2 px-2 py-1 rounded border border-white/20 text-sm bg-white/10 hover:bg-white/20 text-white transition-colors"
                  >
                    {theme === 'vs-dark' ? '🌙 Dark' : '☀️ Light'}
                  </button>
                </div>
              </div>
              <MonacoEditor language={language} roomId={roomId} />
              <button
                onClick={handleSaveSnapshot}
                className="mt-4 px-4 py-2 bg-gradient-to-r from-red-500 to-black-500 text-white rounded hover:shadow-lg hover:shadow-red-500/25 transition-all duration-300 transform hover:scale-105"
              >
                Save Snapshot
              </button>
            </div>
            <div className="w-full md:w-64 flex flex-col gap-4">
              <UserList users={users} />
              {/* ChatBox stub */}
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <h2 className="font-semibold mb-2 text-white">Chat</h2>
                <div className="text-gray-400">(Chat coming soon)</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default EditorPage;
