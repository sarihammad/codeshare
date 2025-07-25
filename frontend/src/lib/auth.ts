import { apiCall, API_ENDPOINTS } from "@/config/api";

export async function login(email: string, password: string) {
  const res = await apiCall(API_ENDPOINTS.AUTH.LOGIN, {
    method: "POST",
    body: JSON.stringify({ email, password }),
    credentials: "include", // Include cookies in the request
  });
  if (!res.ok) {
    throw new Error("Login failed");
  }
  return res.json();
}

export async function register(email: string, password: string) {
  const res = await apiCall(API_ENDPOINTS.AUTH.REGISTER, {
    method: "POST",
    body: JSON.stringify({ email, password }),
    credentials: "include", // Include cookies in the request
  });
  if (!res.ok) {
    throw new Error("Registration failed");
  }
  return res.json();
}

export async function logout() {
  const res = await apiCall(API_ENDPOINTS.AUTH.LOGOUT, {
    method: "POST",
    credentials: "include", // Include cookies in the request
  });
  if (!res.ok) {
    throw new Error("Logout failed");
  }
  return res.json();
}

export async function checkAuth() {
  const res = await apiCall(API_ENDPOINTS.AUTH.ME, {
    method: "GET",
    credentials: "include", // Include cookies in the request
  });
  if (!res.ok) {
    throw new Error("Authentication check failed");
  }
  return res.json();
}
