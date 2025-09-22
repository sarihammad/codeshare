import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  login as loginApi,
  register as registerApi,
  logout as logoutApi,
  checkAuth,
} from "@/lib/auth";
import { notifyError } from "@/lib/notify";

interface User {
  id: string;
  email: string;
  name?: string | null;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

export const loginThunk = createAsyncThunk(
  "auth/login",
  async (
    { email, password }: { email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      await loginApi(email, password);
      return { email };
    } catch (err) {
      notifyError(err as Error);
      return rejectWithValue((err as Error).message);
    }
  }
);

export const registerThunk = createAsyncThunk(
  "auth/register",
  async (
    { email, password }: { email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      console.log("Register attempt for:", email);
      await registerApi(email, password);
      console.log("Register successful");
      return { email };
    } catch (err) {
      notifyError(err as Error);
      return rejectWithValue((err as Error).message);
    }
  }
);

export const logoutThunk = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      console.log("Logout attempt");
      await logoutApi();
      console.log("Logout successful");
      return true;
    } catch (err) {
      notifyError(err as Error);
      return rejectWithValue((err as Error).message);
    }
  }
);

export const checkAuthThunk = createAsyncThunk(
  "auth/checkAuth",
  async (_, { rejectWithValue }) => {
    try {
      console.log("Checking authentication...");
      const response = await checkAuth();
      console.log("Auth check successful:", response);
      return response;
    } catch (err) {
      notifyError(err as Error);
      return rejectWithValue((err as Error).message);
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = { id: "temp", email: action.payload.email, name: null };
        state.error = null;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Register
      .addCase(registerThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = { id: "temp", email: action.payload.email, name: null };
        state.error = null;
      })
      .addCase(registerThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Logout
      .addCase(logoutThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutThunk.fulfilled, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.error = null;
      })
      .addCase(logoutThunk.rejected, (state, action) => {
        state.loading = false;
        // Even if logout fails, clear the auth state
        state.isAuthenticated = false;
        state.user = null;
        state.error = action.payload as string;
      })
      // Check Auth
      .addCase(checkAuthThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkAuthThunk.fulfilled, (state) => {
        state.loading = false;
        state.isAuthenticated = true;
        // We don't have user details from the /me endpoint, so we'll keep it simple
        state.user = {
          id: "authenticated",
          email: "user@example.com",
          name: null,
        };
        state.error = null;
      })
      .addCase(checkAuthThunk.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
