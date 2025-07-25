'use client';

import React from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';

const GRAFANA_URL =
  process.env.NEXT_PUBLIC_GRAFANA_URL ||
  'https://play.grafana.org/d/000000012/grafana-play-home?orgId=1';

const MetricsPage: React.FC = () => {
  return (
    <ProtectedRoute>
      <div className="max-w-5xl mx-auto py-10 px-4">
        <h1 className="text-2xl font-bold mb-6">Metrics & Monitoring</h1>
        <div className="mb-4">
          <a
            href={GRAFANA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Open Grafana in a new tab
          </a>
        </div>
        <div className="w-full h-[600px] border rounded shadow overflow-hidden bg-white">
          <iframe
            src={GRAFANA_URL}
            title="Grafana Dashboard"
            width="100%"
            height="100%"
            className="w-full h-full border-0"
            allowFullScreen
          />
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default MetricsPage;
