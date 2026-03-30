import { useAuthStore } from "@/store/auth.store";
import { decodeJwtPayload } from "@/lib/utils";
import { buildApiUrl } from "@/lib/api/config";

export interface AuthUser {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
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

const buildUrl = (path: string) => buildApiUrl(path);

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
    getUserFromToken
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
    user: getUserFromToken(data.access || "") || null,
    isAuthenticated: !!data.isAuthenticated,
  };
}

export async function signOut(): Promise<void> {
  const refreshToken = getStoredRefreshToken();
  const accessToken = useAuthStore.getState().accessToken;
  await fetch(buildUrl("/auth/logout/"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({ refresh: refreshToken, access: accessToken }),
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

export async function getCurrentUser(): Promise<AuthUser | null> {
  const accessToken = useAuthStore.getState().accessToken;
  if (!accessToken) {
    return null;
  }

  const user = getUserFromToken(accessToken);
  return user;
}

const serverEnv = () => ({
  API_URL: process.env.API_URL,
  AUTH_LOGIN_PATH: process.env.AUTH_LOGIN_PATH,
  AUTH_REFRESH_PATH: process.env.AUTH_REFRESH_PATH,
  AUTH_ME_PATH: process.env.AUTH_ME_PATH,
  AUTH_LOGOUT_PATH: process.env.AUTH_LOGOUT_PATH,
});

const ensureEnv = (value: string | undefined, name: string) => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const json = (status: number, data: unknown, headers?: HeadersInit) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });

const buildServerUrl = (path: string) => {
  const { API_URL } = serverEnv();
  const baseUrl = ensureEnv(API_URL, "API_URL");
  return new URL(path, baseUrl).toString();
};

const getUserFromToken = (access: string) => {
  const payload = decodeJwtPayload(access);
  if (!payload) {
    return null;
  }

  const name = [payload.first_name, payload.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return {
    id: payload.user_id ? String(payload.user_id) : undefined,
    email: payload.email,
    first_name: payload.first_name,
    last_name: payload.last_name,
    role: payload.role,
    name: name || payload.email || undefined,
  };
};

const refreshAccessToken = async (refresh: string) => {
  const { AUTH_REFRESH_PATH } = serverEnv();
  const refreshPath = ensureEnv(AUTH_REFRESH_PATH, "AUTH_REFRESH_PATH");
  const response = await fetch(buildServerUrl(refreshPath), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ refresh }),
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as Record<string, string>;
  return {
    access: data.access,
    refresh: data.refresh,
  };
};


// TODO; - @nangosha -remove the handleAuth* functions
export const handleAuthMe = async (request: Request) => {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return json(401, { message: "Missing access token" });
  }

  const user = getUserFromToken(token);
  if (!user) {
    return json(401, { message: "Invalid access token" });
  }

  return json(200, { user });
};

export const handleAuthLogin = async (request: Request) => {
  const { AUTH_LOGIN_PATH } = serverEnv();
  const loginPath = ensureEnv(AUTH_LOGIN_PATH, "AUTH_LOGIN_PATH");
  const payload = await request.json();

  const response = await fetch(buildServerUrl(loginPath), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const detail = await response
      .json()
      .catch(() => ({ message: "Login failed" }));
    return json(response.status, detail);
  }

  const data = (await response.json()) as Record<string, string>;
  const access = data.access;
  const refresh = data.refresh;

  if (!access || !refresh) {
    return json(500, { message: "Missing auth tokens" });
  }
  const user = getUserFromToken(access);

  return json(200, {
    access,
    refresh,
    user, //
    isAuthenticated: !!user,
  });
};

export const handleAuthRefresh = async (request: Request) => {
  const body = await request.json().catch(() => ({}));
  const refresh = body.refresh;
  if (!refresh) {
    return json(401, { message: "Missing refresh token" });
  }

  const refreshed = await refreshAccessToken(refresh);
  if (!refreshed?.access) {
    return json(401, { message: "Unable to refresh" });
  }

  return json(200, {
    access: refreshed.access,
    refresh: refreshed.refresh,
  });
};

export const handleAuthLogout = async (request: Request) => {
  const { AUTH_LOGOUT_PATH } = serverEnv();
  if (AUTH_LOGOUT_PATH) {
    const body = await request.json().catch(() => ({}));
    const refresh = body.refresh;
    const access = body.access;
    if (refresh) {
      await fetch(buildServerUrl(AUTH_LOGOUT_PATH), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(access ? { Authorization: `Bearer ${access}` } : {}),
        },
        body: JSON.stringify({ refresh, access }),
      }).catch(() => null);
    }
  }
  return json(200, { ok: true });
};
