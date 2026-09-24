export const ACCESS_TOKEN_COOKIE = "fresherprep_access_token";
export const REFRESH_TOKEN_COOKIE = "fresherprep_refresh_token";

export const PROTECTED_ROUTE_PREFIXES = [
  "/dashboard",
  "/learning-paths",
  "/knowledge",
  "/quizzes",
  "/progress",
] as const;

export const DEFAULT_AUTHENTICATED_ROUTE = "/dashboard";
