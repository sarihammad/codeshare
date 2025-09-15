import "@testing-library/jest-dom";
import React from "react";
import { vi } from "vitest";

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return "/";
  },
}));

// Mock Monaco Editor
vi.mock("@monaco-editor/react", () => ({
  default: ({ onMount, ...props }: { onMount?: (editor: unknown) => void; [key: string]: unknown }) => {
    const mockEditor = {
      getValue: () => "test content",
      setValue: vi.fn(),
      addCommand: vi.fn(),
      getModel: () => ({
        setValue: vi.fn(),
      }),
    };

    // Call onMount immediately instead of using useEffect
    if (onMount) {
      onMount(mockEditor);
    }

    return React.createElement("div", {
      "data-testid": "monaco-editor",
      ...props,
    });
  },
}));

// Mock Yjs and WebSocket
vi.mock("yjs", () => ({
  Doc: vi.fn().mockImplementation(() => ({
    getText: vi.fn(() => ({
      insert: vi.fn(),
      observe: vi.fn(),
      toString: vi.fn(() => "test content"),
    })),
    destroy: vi.fn(),
  })),
}));

vi.mock("y-websocket", () => ({
  WebsocketProvider: vi.fn().mockImplementation(() => ({
    awareness: {
      setLocalStateField: vi.fn(),
      on: vi.fn(),
      getStates: vi.fn(() => new Map()),
    },
    on: vi.fn(),
    destroy: vi.fn(),
  })),
}));

vi.mock("y-monaco", () => ({
  MonacoBinding: vi.fn(),
}));

// Mock fetch
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};
global.localStorage = localStorageMock as Storage;
