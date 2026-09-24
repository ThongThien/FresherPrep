export type UserRole = "USER" | "ADMIN";

export interface CurrentUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  tokenType: "Bearer" | string;
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
}

export interface AuthenticationResponse {
  user: CurrentUser;
  tokens: AuthTokens;
}

export interface ApiError {
  timestamp?: string;
  status: number;
  error: string;
  code: string;
  message: string;
  fieldErrors: Record<string, string>;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput extends LoginInput {
  displayName: string;
}
