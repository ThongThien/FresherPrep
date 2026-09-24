import type { ApiError } from "@/lib/auth/types";

export async function readApiError(response: Response): Promise<ApiError> {
  try {
    const value = (await response.json()) as Partial<ApiError>;
    return {
      status: response.status,
      error: typeof value.error === "string" ? value.error : "Request Failed",
      code: typeof value.code === "string" ? value.code : "REQUEST_FAILED",
      message:
        typeof value.message === "string"
          ? value.message
          : "The request could not be completed. Please try again.",
      fieldErrors:
        value.fieldErrors && typeof value.fieldErrors === "object" ? value.fieldErrors : {},
    };
  } catch {
    return {
      status: response.status,
      error: "Request Failed",
      code: "REQUEST_FAILED",
      message: "The request could not be completed. Please try again.",
      fieldErrors: {},
    };
  }
}

export function userFacingAuthMessage(error: ApiError, operation: "login" | "register") {
  if (error.status === 401) return "Email or password is incorrect.";
  if (error.status === 409 && operation === "register") {
    return "An account with this email already exists.";
  }
  if (error.status >= 500) return "The service is temporarily unavailable. Please try again.";
  return error.message || "The request could not be completed. Please try again.";
}
