'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import LoadingSpinner from '@/components/LoadingSpinner';
import { diffLines, Change } from 'diff';
import { Diff, parseDiff } from 'react-diff-view';
import 'react-diff-view/style/index.css';
import { apiCall, API_ENDPOINTS, buildApiUrl } from '@/config/api';

interface Snapshot {
  key: string;
}

const HistoryPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [diffContent, setDiffContent] = useState<{
    oldText: string;
    newText: string;
  } | null>(null);
  const [diffLoading, setDiffLoading] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiCall(API_ENDPOINTS.ROOMS.HISTORY(roomId));
        if (!res.ok) throw new Error('Failed to fetch history');
        const data = await res.json();
        setSnapshots(data.map((key: string) => ({ key })));
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    if (roomId) fetchHistory();
  }, [roomId]);

  const handleDownload = async (key: string) => {
    try {
      const res = await fetch(
        `${buildApiUrl(
          API_ENDPOINTS.ROOMS.SNAPSHOT(roomId)
        )}?key=${encodeURIComponent(key)}`
      );
      if (!res.ok) throw new Error('Failed to download snapshot');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = key.split('/').pop() || 'snapshot.txt';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleSelect = (key: string) => {
    setDiffContent(null);
    setSelected((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key);
      if (prev.length === 2) return [prev[1], key];
      return [...prev, key];
    });
  };

  const handleViewDiff = async () => {
    if (selected.length !== 2) return;
    setDiffLoading(true);
    try {
      const [res1, res2] = await Promise.all([
        fetch(
          `${buildApiUrl(
            API_ENDPOINTS.ROOMS.SNAPSHOT(roomId)
          )}?key=${encodeURIComponent(selected[0])}`
        ),
        fetch(
          `${buildApiUrl(
            API_ENDPOINTS.ROOMS.SNAPSHOT(roomId)
          )}?key=${encodeURIComponent(selected[1])}`
        ),
      ]);
      if (!res1.ok || !res2.ok)
        throw new Error('Failed to fetch snapshots for diff');
      const oldText = await res1.text();
      const newText = await res2.text();
      setDiffContent({ oldText, newText });
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setDiffLoading(false);
    }
  };

  // Generate a unified diff string for react-diff-view
  function getUnifiedDiff(oldText: string, newText: string) {
    const changes: Change[] = diffLines(oldText, newText);
    let diff = `--- Old\n+++ New\n@@ -1,1 +1,1 @@\n`;
    changes.forEach((change) => {
      const lines = change.value.split('\n');
      lines.pop(); // Remove last empty string after split
      lines.forEach((line) => {
        if (change.added) {
          diff += `+${line}\n`;
        } else if (change.removed) {
          diff += `-${line}\n`;
        } else {
          diff += ` ${line}\n`;
        }
      });
    });
    return diff;
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900">
        <div className="max-w-2xl mx-auto py-10 px-4">
          <h1 className="text-2xl font-bold mb-6 text-white">Room History</h1>
          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size={32} />
            </div>
          ) : error ? (
            <div className="text-red-400">{error}</div>
          ) : snapshots.length === 0 ? (
            <div className="text-gray-300">
              No snapshots found for this room.
            </div>
          ) : (
            <>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 shadow mb-6 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-white/10">
                      <th className="py-3 px-4 text-left text-white font-medium">
                        Timestamp
                      </th>
                      <th className="py-3 px-4 text-center text-white font-medium">
                        Actions
                      </th>
                      <th className="py-3 px-4 text-center text-white font-medium">
                        Select for Diff
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {snapshots.map((snap) => {
                      const ts = snap.key
                        .split('/')
                        .pop()
                        ?.replace('snapshot-', '')
                        .replace('.txt', '');
                      const date = ts
                        ? new Date(Number(ts)).toLocaleString()
                        : snap.key;
                      return (
                        <tr key={snap.key} className="border-t border-white/10">
                          <td className="py-3 px-4 text-gray-300">{date}</td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => handleDownload(snap.key)}
                              className="px-3 py-1 bg-gradient-to-r from-red-500 to-black text-white rounded hover:shadow-lg hover:shadow-red-500/25 transition-all duration-300 text-sm"
                            >
                              Download
                            </button>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={selected.includes(snap.key)}
                              onChange={() => handleSelect(snap.key)}
                              disabled={
                                selected.length === 2 &&
                                !selected.includes(snap.key)
                              }
                              className="w-4 h-4 text-red-500 focus:ring-red-500 border-white/20 rounded bg-white/10"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mb-6">
                <button
                  onClick={handleViewDiff}
                  disabled={selected.length !== 2 || diffLoading}
                  className="px-4 py-2 bg-gradient-to-r from-red-500 to-black text-white rounded hover:shadow-lg hover:shadow-red-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {diffLoading ? 'Loading...' : 'View Diff'}
                </button>
              </div>

              {diffContent && (
                <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
                  <Diff
                    hunks={
                      parseDiff(
                        getUnifiedDiff(diffContent.oldText, diffContent.newText)
                      )[0].hunks
                    }
                    diffType="modify"
                    viewType="split"
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default HistoryPage;
