import { db } from "./db";
// import GoogleProvider from "next-auth/providers/google";
// import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { apiCall, API_ENDPOINTS } from "@/config/api";

export async function loginUser(email: string, password: string) {
  const user = await db.user.findUnique({
    where: { email },
  });

  if (!user) {
    return null;
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return null;
  }

  return user;
}

// export const authOptions = {
//   providers: [
//     GoogleProvider({
//       clientId: process.env.GOOGLE_CLIENT_ID || "",
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
//     }),
//     CredentialsProvider({
//       name: "Credentials",
//       credentials: {
//         email: { label: "Email", type: "email" },
//         password: { label: "Password", type: "password" },
//       },
//       async authorize(credentials) {
//         if (!credentials?.email || !credentials?.password) return null;
//         const user = await loginUser(credentials.email, credentials.password);
//         if (user) {
//           return { id: String(user.id), name: user.name, email: user.email };
//         }
//         return null;
//       },
//     }),
//   ],
//   session: {
//     strategy: "jwt" as const,
//   },
//   callbacks: {
//     async jwt({ token, user }: { token: any; user?: any }) {
//       if (user) token.id = user.id;
//       return token;
//     },
//     async session({ session, token }: { session: any; token: any }) {
//       if (token && session.user) {
//         session.user.id = token.id;
//       }
//       return session;
//     },
//   },
// };

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
