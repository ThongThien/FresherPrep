const DEFAULT_BACKEND_URL = "http://localhost:8080";

export function backendFetch(path: string, init?: RequestInit) {
  const baseUrl = (process.env.FRESHERPREP_API_URL ?? DEFAULT_BACKEND_URL).replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return fetch(`${baseUrl}${normalizedPath}`, {
    ...init,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...init?.headers,
    },
  });
}
