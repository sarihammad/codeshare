import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { X, Search, Save, Plus, Users, Settings } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
}

interface Command {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  shortcut?: string;
}

export default function CommandPalette({
  isOpen,
  onClose,
  onSave,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const commands: Command[] = [
    {
      id: 'save',
      title: 'Save Snapshot',
      description: 'Save current editor state',
      icon: <Save className="w-4 h-4" />,
      action: () => {
        onSave?.();
        onClose();
      },
      shortcut: '⌘ + S',
    },
    {
      id: 'create-room',
      title: 'Create New Room',
      description: 'Start a new collaborative coding session',
      icon: <Plus className="w-4 h-4" />,
      action: () => {
        router.push('/create-room');
        onClose();
      },
      shortcut: 'Alt + 2',
    },
    {
      id: 'join-room',
      title: 'Join Room',
      description: 'Join an existing room with a code',
      icon: <Users className="w-4 h-4" />,
      action: () => {
        router.push('/join-room');
        onClose();
      },
      shortcut: 'Alt + 3',
    },
    {
      id: 'dashboard',
      title: 'Go to Dashboard',
      description: 'View all your rooms and activity',
      icon: <Settings className="w-4 h-4" />,
      action: () => {
        router.push('/dashboard');
        onClose();
      },
      shortcut: 'Alt + 1',
    },
  ];

  const filteredCommands = commands.filter(
    (command) =>
      command.title.toLowerCase().includes(query.toLowerCase()) ||
      command.description.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex((prev) =>
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          );
          break;
        case 'Enter':
          event.preventDefault();
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Command Palette */}
      <div className="relative w-full max-w-2xl mx-4 bg-slate-800 rounded-lg shadow-2xl border border-slate-700">
        {/* Header */}
        <div className="flex items-center px-4 py-3 border-b border-slate-700">
          <Search className="w-5 h-5 text-slate-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="flex-1 bg-transparent text-white placeholder-slate-400 outline-none"
          />
          <button
            onClick={onClose}
            className="ml-3 p-1 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Commands List */}
        <div className="max-h-96 overflow-y-auto">
          {filteredCommands.length === 0 ? (
            <div className="px-4 py-8 text-center text-slate-400">
              No commands found
            </div>
          ) : (
            filteredCommands.map((command, index) => (
              <button
                key={command.id}
                onClick={command.action}
                className={`w-full flex items-center px-4 py-3 text-left hover:bg-slate-700 transition-colors ${
                  index === selectedIndex ? 'bg-slate-700' : ''
                }`}
              >
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-slate-400">
                  {command.icon}
                </div>
                <div className="flex-1 min-w-0 ml-3">
                  <div className="text-white font-medium">{command.title}</div>
                  <div className="text-sm text-slate-400 truncate">
                    {command.description}
                  </div>
                </div>
                {command.shortcut && (
                  <div className="flex-shrink-0 ml-3 text-xs text-slate-500 bg-slate-700 px-2 py-1 rounded">
                    {command.shortcut}
                  </div>
                )}
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-slate-700 text-xs text-slate-400">
          <div className="flex items-center justify-between">
            <span>Use ↑↓ to navigate, Enter to select, Esc to close</span>
            <span>⌘ + K to open</span>
          </div>
        </div>
      </div>
    </div>
  );
}
