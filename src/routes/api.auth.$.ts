import { createAPIFileRoute } from "@tanstack/react-start/api";
import { decodeJwtPayload } from "@/lib/utils";

const API_URL = process.env.API_URL;
const AUTH_LOGIN_PATH = process.env.AUTH_LOGIN_PATH;
const AUTH_REFRESH_PATH = process.env.AUTH_REFRESH_PATH;
const AUTH_ME_PATH = process.env.AUTH_ME_PATH;
const AUTH_LOGOUT_PATH = process.env.AUTH_LOGOUT_PATH;

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


const buildUrl = (path: string) => {
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
  const refreshPath = ensureEnv(
    AUTH_REFRESH_PATH,
    "AUTH_REFRESH_PATH"
  );
  const response = await fetch(buildUrl(refreshPath), {
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

export const APIRoute = createAPIFileRoute("/api/auth/$")({
  GET: async ({ request }) => {
    try {
      const url = new URL(request.url);
      if (url.pathname.endsWith("/me")) {
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
      }

      return json(404, { message: "Not found" });
    } catch (error) {
      return json(500, { message: (error as Error).message });
    }
  },
  POST: async ({ request }) => {
    try {
      const url = new URL(request.url);

      if (url.pathname.endsWith("/login")) {
        const loginPath = ensureEnv(
          AUTH_LOGIN_PATH,
          "AUTH_LOGIN_PATH"
        );
        const payload = await request.json();

        const response = await fetch(buildUrl(loginPath), {
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
          user,
          isAuthenticated: !!user,
        });
      }

      if (url.pathname.endsWith("/refresh")) {
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
      }

      if (url.pathname.endsWith("/logout")) {
        if (AUTH_LOGOUT_PATH) {
          const body = await request.json().catch(() => ({}));
          const refresh = body.refresh;
          const access = body.access;
          if (refresh) {
            await fetch(buildUrl(AUTH_LOGOUT_PATH), {
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
      }

      return json(404, { message: "Not found" });
    } catch (error) {
      return json(500, { message: (error as Error).message });
    }
  },
});
