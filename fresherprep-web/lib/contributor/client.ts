import { readApiError } from "@/lib/api/client";

export async function contributorRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/contributor/${path}`, {
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
    throw new Error("Contributor access required");
  }
  if (!response.ok) throw new Error((await readApiError(response)).message);
  return await response.json() as T;
}

export function contributorJson(value: unknown): RequestInit {
  return { body: JSON.stringify(value) };
}
