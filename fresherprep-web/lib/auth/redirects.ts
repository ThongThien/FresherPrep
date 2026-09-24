import { DEFAULT_AUTHENTICATED_ROUTE } from "./constants";

export function getSafeRedirectPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return DEFAULT_AUTHENTICATED_ROUTE;
  }

  if (value === "/login" || value === "/register") {
    return DEFAULT_AUTHENTICATED_ROUTE;
  }

  return value;
}
