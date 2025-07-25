import React from 'react';

const EditorSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900">
      <div className="mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            {/* Header skeleton */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
              <div className="h-6 bg-white/10 rounded animate-pulse w-48"></div>
              <div className="flex gap-2 items-center">
                <div className="h-6 bg-white/10 rounded animate-pulse w-20"></div>
                <div className="h-8 bg-white/10 rounded animate-pulse w-32"></div>
                <div className="h-8 bg-white/10 rounded animate-pulse w-20"></div>
              </div>
            </div>

            {/* Editor skeleton */}
            <div className="h-60vh bg-white/5 rounded-lg border border-white/10 animate-pulse">
              <div className="p-4">
                <div className="space-y-2">
                  <div className="h-4 bg-white/10 rounded w-3/4"></div>
                  <div className="h-4 bg-white/10 rounded w-1/2"></div>
                  <div className="h-4 bg-white/10 rounded w-5/6"></div>
                  <div className="h-4 bg-white/10 rounded w-2/3"></div>
                  <div className="h-4 bg-white/10 rounded w-4/5"></div>
                </div>
              </div>
            </div>

            {/* Button skeleton */}
            <div className="mt-4 h-10 bg-white/10 rounded animate-pulse w-32"></div>
          </div>

          <div className="w-full md:w-64 flex flex-col gap-4">
            {/* User list skeleton */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="h-5 bg-white/10 rounded animate-pulse w-24 mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-white/10 rounded animate-pulse w-full"></div>
                <div className="h-4 bg-white/10 rounded animate-pulse w-3/4"></div>
                <div className="h-4 bg-white/10 rounded animate-pulse w-1/2"></div>
              </div>
            </div>

            {/* Chat skeleton */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="h-5 bg-white/10 rounded animate-pulse w-16 mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-white/10 rounded animate-pulse w-full"></div>
                <div className="h-4 bg-white/10 rounded animate-pulse w-2/3"></div>
                <div className="h-4 bg-white/10 rounded animate-pulse w-4/5"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditorSkeleton;
