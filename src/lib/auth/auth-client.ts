import { useAuthStore } from "@/store/auth.store";
import { console } from "inspector/promises";

export interface AuthUser {
  id?: string;
  name?: string;
  email?: string;
  image?: string;
}

export interface AuthSession {
  user?: AuthUser | null;
  isAuthenticated: boolean;
}

export interface SignInInput {
  email?: string;
  username?: string;
  password: string;
}

const DEFAULT_SERVER_BASE_URL =
  process.env.VITE_APP_URL || "http://localhost:8000/api";

const getBaseUrl = () => DEFAULT_SERVER_BASE_URL;

const buildUrl = (path: string) => {
  const baseUrl = getBaseUrl();
  if (!baseUrl) {
    throw new Error("Base URL is not defined");
  }
  return new URL(path, baseUrl).toString();
};

const REFRESH_TOKEN_KEY = "refresh";

const getStoredRefreshToken = () => {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
};

const setStoredRefreshToken = (token: string | null) => {
  if (typeof window === "undefined") {
    return;
  }
  if (!token) {
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
    return;
  }
  window.localStorage.setItem(REFRESH_TOKEN_KEY, token);
};

export async function signIn(payload: SignInInput): Promise<AuthSession> {
  const response = await fetch(buildUrl("/auth/login/"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message =
      (errorBody && (errorBody.detail || errorBody.message)) ||
      "Unable to sign in";
    throw new Error(message);
  }

  const data = (await response.json()) as AuthSession & {
    access?: string;
    refresh?: string;
  };

  if (data.access) {
    useAuthStore.getState().setAccessToken(data.access);
  }

  if (data.refresh) {
    setStoredRefreshToken(data.refresh);
  }

  useAuthStore.getState().setHasCheckedRefresh(true);

  return {
    user: data.user ?? null,
    isAuthenticated: !!data.isAuthenticated,
  };
}

export async function signOut(): Promise<void> {
  const refreshToken = getStoredRefreshToken();
  await fetch(buildUrl("/auth/logout/"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh: refreshToken }),
  });
  setStoredRefreshToken(null);
  useAuthStore.getState().clearAuth();
  useAuthStore.getState().setHasCheckedRefresh(true);
}

export async function silentRefresh(): Promise<string | null> {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) {
    useAuthStore.getState().clearAuth();
    useAuthStore.getState().setHasCheckedRefresh(true);
    return null;
  }

  const response = await fetch(buildUrl("/auth/refresh/"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh: refreshToken }),
  });

  if (!response.ok) {
    useAuthStore.getState().clearAuth();
    useAuthStore.getState().setHasCheckedRefresh(true);
    return null;
  }

  const data = (await response.json()) as {
    access?: string;
    refresh?: string;
  };
  if (data.access) {
    useAuthStore.getState().setAccessToken(data.access);
    if (data.refresh) {
      setStoredRefreshToken(data.refresh);
    }
    useAuthStore.getState().setHasCheckedRefresh(true);
    return data.access;
  }

  useAuthStore.getState().setHasCheckedRefresh(true);

  return null;
}
