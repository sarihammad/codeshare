import React from 'react';
import Link from 'next/link';

interface SkipToEditorProps {
  roomId?: string;
}

export default function SkipToEditor({ roomId }: SkipToEditorProps) {
  const href = roomId ? `/editor/${roomId}` : '/dashboard';

  return (
    <Link
      href={href}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-red-500 focus:text-white focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-900 focus:transition-all focus:duration-200"
    >
      Skip to {roomId ? 'editor' : 'main content'}
    </Link>
  );
}
