const API_BASE_URL =
  import.meta.env.VITE_APP_URL || "http://localhost:8000/api/";

export const getApiBaseUrl = () => API_BASE_URL;

export const buildApiUrl = (path: string) => {
  let baseUrl = getApiBaseUrl();

  if (!baseUrl) {
    throw new Error("Missing base URL definition");
  }

  if (path.includes("/auth")) {
    // replace "api/" in baseUrl with ""
    baseUrl = baseUrl.replace(/\/api\/$/, "/");
  }

  return new URL(path.replace(/^\//, ""), baseUrl).toString(); // remove the leading slash on the path to ensure correct URL construction
};
