import { createAPIFileRoute } from "@tanstack/react-start/api";

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

const mapUser = (data: Record<string, unknown>) => {
  const id = data.id ?? data.pk;
  const email = data.email ?? data.username ?? data.user_email;
  const nameFromParts = [data.first_name, data.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  const name =
    (data.name as string) || nameFromParts || (email as string) || undefined;
  const image =
    (data.image as string) ||
    (data.avatar as string) ||
    (data.profile_image as string) ||
    undefined;

  return {
    id: id ? String(id) : undefined,
    email: email ? String(email) : undefined,
    name,
    image,
  };
};

const callMe = async (access: string) => {
  return {
    id: "1",
    email: "admin@chelsea.com",
    name: "Roman Abramovich",
    image: "",
  }

  // TODO; - @nangosha - implement this on the backend and then re-enable this call
  const mePath = ensureEnv(AUTH_ME_PATH, "AUTH_ME_PATH");
  const response = await fetch(buildUrl(mePath), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${access}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as Record<string, unknown>;
  return mapUser(data);
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
        const user = await callMe(access);

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
          if (refresh) {
            await fetch(buildUrl(AUTH_LOGOUT_PATH), {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
              },
              body: JSON.stringify({ refresh }),
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
