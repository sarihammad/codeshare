import "@testing-library/jest-dom";
import React from "react";

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
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
jest.mock("@monaco-editor/react", () => ({
  default: ({ onMount, ...props }: { onMount?: (editor: unknown) => void; [key: string]: unknown }) => {
    const mockEditor = {
      getValue: () => "test content",
      setValue: jest.fn(),
      addCommand: jest.fn(),
      getModel: () => ({
        setValue: jest.fn(),
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
jest.mock("yjs", () => ({
  Doc: jest.fn().mockImplementation(() => ({
    getText: jest.fn(() => ({
      insert: jest.fn(),
      observe: jest.fn(),
      toString: jest.fn(() => "test content"),
    })),
    destroy: jest.fn(),
  })),
}));

jest.mock("y-websocket", () => ({
  WebsocketProvider: jest.fn().mockImplementation(() => ({
    awareness: {
      setLocalStateField: jest.fn(),
      on: jest.fn(),
      getStates: jest.fn(() => new Map()),
    },
    on: jest.fn(),
    destroy: jest.fn(),
  })),
}));

jest.mock("y-monaco", () => ({
  MonacoBinding: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;
