import { useAuthStore } from "@/store/auth.store";
import { silentRefresh } from "@/services/auth";

type FetchInput = RequestInfo | URL;

type FetchInit = RequestInit & {
  retryOnUnauthorized?: boolean;
};

export const fetchWithAuth = async (
  input: FetchInput,
  init: FetchInit = {}
): Promise<Response> => {
  const { retryOnUnauthorized = true, ...requestInit } = init;
  const headers = new Headers(requestInit.headers);
  const token = useAuthStore.getState().accessToken;

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(input, {
    ...requestInit,
    headers,
    credentials: requestInit.credentials ?? "include",
  });

  if (!retryOnUnauthorized || response.status !== 401) {
    return response;
  }

  const refreshedToken = await silentRefresh();
  if (!refreshedToken) {
    return response;
  }

  const retryHeaders = new Headers(requestInit.headers);
  retryHeaders.set("Authorization", `Bearer ${refreshedToken}`);

  return fetch(input, {
    ...requestInit,
    headers: retryHeaders,
    credentials: requestInit.credentials ?? "include",
  });
};
