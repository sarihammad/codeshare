import React, { useEffect, useRef, useState, useCallback } from 'react';
import Monaco from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import * as monaco from 'monaco-editor';
import * as Y from 'yjs';
import { MonacoBinding } from 'y-monaco';
import { WebsocketProvider } from 'y-websocket';
import type { Awareness } from 'y-protocols/awareness';
import { API_CONFIG, apiCall, API_ENDPOINTS } from '@/config/api';
import { useToast } from './Toast';
import { notifyError } from '@/lib/notify';

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
  const [saveState, setSaveState] = useState<
    'idle' | 'saving' | 'saved' | 'error'
  >('idle');
  const [wsStatus, setWsStatus] = useState<
    'connected' | 'disconnected' | 'connecting'
  >('connecting');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { addToast } = useToast();

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
        // No existing content found, starting fresh
      }
    };

    loadContent();
  }, [roomId]);

  // Auto-save function with better error handling and save state
  const saveContent = useCallback(
    async (content: string) => {
      if (!roomId || !content) return;

      try {
        setSaveState('saving');
        const res = await apiCall(API_ENDPOINTS.ROOMS.SNAPSHOT(roomId), {
          method: 'POST',
          body: JSON.stringify({ content }),
        });

        if (!res.ok) {
          throw new Error(`Failed to save content, status: ${res.status}`);
        }

        setSaveState('saved');
        addToast('Content saved successfully', 'success', 2000);
        // Reset to idle after 2 seconds
        setTimeout(() => setSaveState('idle'), 2000);
      } catch (error) {
        notifyError(error as Error);
        setSaveState('error');
        addToast(
          'Failed to save content. Will retry automatically.',
          'error',
          5000
        );
        // Reset to idle after 5 seconds on error
        setTimeout(() => setSaveState('idle'), 5000);
      }
    },
    [roomId, addToast]
  );

  // Manual save function for keyboard shortcut
  const forceSave = async () => {
    if (!editorRef.current || !roomId) return;

    const content = editorRef.current.getValue();
    await saveContent(content);
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

    // 2.5. Monitor WebSocket connection status
    provider.on('status', (event: { status: string }) => {
      if (event.status === 'connected') {
        setWsStatus('connected');
        addToast('Connected to collaboration server', 'success', 3000);
      } else if (event.status === 'disconnected') {
        setWsStatus('disconnected');
        addToast('Disconnected from collaboration server', 'warning', 5000);
      } else {
        setWsStatus('connecting');
      }
    });

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
      // Proper cleanup to prevent memory leaks
      if (providerRef.current) {
        providerRef.current.destroy();
        providerRef.current = null;
      }
      if (ydocRef.current) {
        ydocRef.current.destroy();
        ydocRef.current = null;
      }
      if (editorRef.current) {
        editorRef.current.dispose();
        editorRef.current = null;
      }
      if (awarenessRef.current) {
        awarenessRef.current.destroy();
        awarenessRef.current = null;
      }
    };
  }, [
    roomId,
    userId,
    onAwarenessUpdate,
    initialContent,
    saveContent,
    addToast,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (providerRef.current) {
        providerRef.current.destroy();
      }
      if (ydocRef.current) {
        ydocRef.current.destroy();
      }
      if (editorRef.current) {
        editorRef.current.dispose();
      }
      if (awarenessRef.current) {
        awarenessRef.current.destroy();
      }
    };
  }, []);

  function handleEditorDidMount(editorInstance: editor.IStandaloneCodeEditor) {
    editorRef.current = editorInstance;

    // Set initial content if available
    if (initialContent && editorInstance.getModel()) {
      editorInstance.getModel()?.setValue(initialContent);
    }

    // Add keyboard shortcuts
    editorInstance.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
      () => {
        forceSave();
      }
    );

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

  // Helper function to get status display
  const getSaveStatusDisplay = () => {
    switch (saveState) {
      case 'saving':
        return <span className="text-yellow-600">Saving...</span>;
      case 'saved':
        return <span className="text-green-600">Saved</span>;
      case 'error':
        return <span className="text-red-600">Save failed</span>;
      default:
        return <span className="text-gray-500">All changes saved</span>;
    }
  };

  const getWsStatusDisplay = () => {
    switch (wsStatus) {
      case 'connected':
        return <span className="text-green-600">● Connected</span>;
      case 'disconnected':
        return <span className="text-red-600">● Disconnected</span>;
      case 'connecting':
        return <span className="text-yellow-600">● Connecting...</span>;
      default:
        return <span className="text-gray-500">● Unknown</span>;
    }
  };

  return (
    <div className="h-full w-full">
      <div className="mb-2 flex justify-between items-center text-xs">
        <div className="text-gray-500">Active users: {userCount}</div>
        <div className="flex gap-4">
          <div>{getSaveStatusDisplay()}</div>
          <div>{getWsStatusDisplay()}</div>
        </div>
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
