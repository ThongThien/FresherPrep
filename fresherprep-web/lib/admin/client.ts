import { readApiError } from "@/lib/api/client";

export async function adminRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/admin/${path}`, {
    cache: "no-store",
    ...init,
    headers: init?.body ? { "Content-Type": "application/json", ...init.headers } : init?.headers,
  });
  if (response.status === 401) {
    window.location.replace(`/login?next=${encodeURIComponent(window.location.pathname)}`);
    throw new Error("Authentication required");
  }
  if (response.status === 403) {
    window.location.replace("/dashboard");
    throw new Error("Administrator access required");
  }
  if (!response.ok) throw new Error((await readApiError(response)).message);
  if (response.status === 204) return undefined as T;
  return await response.json() as T;
}

export function jsonBody(value: unknown): RequestInit {
  return { body: JSON.stringify(value) };
}

export async function adminOptional<T>(path: string): Promise<T | undefined> {
  const response = await fetch(`/api/admin/${path}`, { cache: "no-store" });
  if (response.status === 404) return undefined;
  if (response.status === 401) {
    window.location.replace(`/login?next=${encodeURIComponent(window.location.pathname)}`);
    throw new Error("Authentication required");
  }
  if (response.status === 403) {
    window.location.replace("/dashboard");
    throw new Error("Administrator access required");
  }
  if (!response.ok) throw new Error((await readApiError(response)).message);
  return await response.json() as T;
}
