import React, { useEffect, useRef, useState } from 'react';
import Monaco from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import * as Y from 'yjs';
import { MonacoBinding } from 'y-monaco';
import { WebsocketProvider } from 'y-websocket';
import type { Awareness } from 'y-protocols/awareness';
import { API_CONFIG, apiCall, API_ENDPOINTS } from '@/config/api';

interface MonacoEditorProps {
  language?: string;
  roomId?: string;
  userId?: string;
  onAwarenessUpdate?: (users: { name: string; color: string }[]) => void;
}

const MonacoEditor: React.FC<MonacoEditorProps> = ({
  language = 'javascript',
  roomId = 'default',
  userId,
  onAwarenessUpdate,
}) => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const awarenessRef = useRef<Awareness | null>(null);
  const [userCount, setUserCount] = React.useState(1);
  const [initialContent, setInitialContent] = useState<string>('');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load initial content
  useEffect(() => {
    if (!roomId) return;

    const loadContent = async () => {
      try {
        const res = await apiCall(API_ENDPOINTS.ROOMS.SNAPSHOT(roomId), {
          method: 'GET',
        });
        if (res.ok) {
          const data = await res.json();
          setInitialContent(data.content || '');
        }
      } catch {
        console.log('No existing content found, starting fresh');
      }
    };

    loadContent();
  }, [roomId]);

  // Auto-save function with better error handling
  const saveContent = async (content: string) => {
    if (!roomId || !content) return;

    try {
      const res = await apiCall(API_ENDPOINTS.ROOMS.SNAPSHOT(roomId), {
        method: 'POST',
        body: JSON.stringify({ content }),
      });

      if (!res.ok) {
        console.warn('Failed to save content, status:', res.status);
      }
    } catch (error) {
      console.warn('Failed to save content:', error);
    }
  };

  useEffect(() => {
    if (!roomId) return;

    // Clean up previous Yjs doc/provider
    if (providerRef.current) providerRef.current.destroy();
    if (ydocRef.current) ydocRef.current.destroy();

    // 1. Create Yjs doc and provider
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;
    const provider = new WebsocketProvider(API_CONFIG.YJS_WS_URL, roomId, ydoc);
    providerRef.current = provider;

    // 2. Set initial content if available
    if (initialContent) {
      const ytext = ydoc.getText('monaco');
      ytext.insert(0, initialContent);
    }

    // 3. Awareness (presence)
    const awareness = provider.awareness;
    awarenessRef.current = awareness;
    awareness.setLocalStateField('user', {
      name: userId || 'Anonymous',
      color: '#' + Math.floor(Math.random() * 16777215).toString(16),
    });

    const updateUserList = () => {
      const users = Array.from(awareness.getStates().values())
        .map((state: unknown) => {
          if (typeof state === 'object' && state && 'user' in state) {
            return (state as { user: { name: string; color: string } }).user;
          }
          return undefined;
        })
        .filter(Boolean) as { name: string; color: string }[];
      setUserCount(users.length);
      if (onAwarenessUpdate) onAwarenessUpdate(users);
    };
    awareness.on('change', updateUserList);
    updateUserList();

    // 4. Set up auto-save on content changes with debounce
    const ytext = ydoc.getText('monaco');
    ytext.observe(() => {
      const content = ytext.toString();

      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Set new timeout for debounced save
      saveTimeoutRef.current = setTimeout(() => {
        saveContent(content);
      }, 2000); // Increased debounce time to reduce API calls
    });

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      provider.destroy();
      ydoc.destroy();
    };
  }, [roomId, userId, onAwarenessUpdate, initialContent]);

  function handleEditorDidMount(editorInstance: editor.IStandaloneCodeEditor) {
    editorRef.current = editorInstance;

    // Set initial content if available
    if (initialContent && editorInstance.getModel()) {
      editorInstance.getModel()?.setValue(initialContent);
    }

    // 3. Bind Monaco to Yjs
    if (ydocRef.current) {
      const ytext = ydocRef.current.getText('monaco');
      const model = editorInstance.getModel();
      if (
        model &&
        !(editorInstance as unknown as { _yjsBinding?: unknown })._yjsBinding
      ) {
        (editorInstance as unknown as { _yjsBinding?: unknown })._yjsBinding =
          new MonacoBinding(
            ytext,
            model,
            new Set([editorInstance]),
            awarenessRef.current as Awareness
          );
      }
    }
  }

  return (
    <div className="h-full w-full">
      <div className="mb-2 text-xs text-gray-500">
        Active users: {userCount}
      </div>
      <Monaco
        height="60vh"
        defaultLanguage={language}
        theme="vs-dark"
        value={initialContent}
        options={{
          fontSize: 14,
          minimap: { enabled: false },
          automaticLayout: true,
          scrollBeyondLastLine: false,
          wordWrap: 'on',
        }}
        onMount={handleEditorDidMount}
        beforeMount={(monaco) => {
          // Configure Monaco Editor to avoid dynamic imports
          monaco.editor.defineTheme('vs-dark', {
            base: 'vs-dark',
            inherit: true,
            rules: [],
            colors: {},
          });
        }}
      />
    </div>
  );
};

export default MonacoEditor;
