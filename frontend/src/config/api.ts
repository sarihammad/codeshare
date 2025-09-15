// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080",
  WS_URL: process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080/ws/editor",
  YJS_WS_URL:
    process.env.NEXT_PUBLIC_YJS_WS_URL || "ws://localhost:8080/ws/yjs",
};

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/api/auth/login",
    REGISTER: "/api/auth/register",
    LOGOUT: "/api/auth/logout",
    ME: "/api/auth/me",
    FORGOT_PASSWORD: "/api/auth/forgot-password",
  },
  ROOMS: {
    CREATE: "/api/rooms",
    JOIN: "/api/rooms/join",
    MY_ROOMS: "/api/rooms/me",
    SNAPSHOT: (roomId: string) => `/api/rooms/${roomId}/snapshot`,
    HISTORY: (roomId: string) => `/api/rooms/${roomId}/history`,
    PRESENCE: (roomId: string) => `/api/rooms/${roomId}/presence`,
  },
  // FEEDBACK: "/api/feedback",
  // STRIPE: {
  //   CHECKOUT: "/api/stripe/checkout",
  // },
};

// Helper function to build full API URLs
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function for API calls
export const apiCall = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const url = buildApiUrl(endpoint);
  const defaultOptions: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "include", // Always include cookies
    ...options,
  };

  return fetch(url, defaultOptions);
};
