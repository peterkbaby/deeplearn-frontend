import "server-only";
import axios, { AxiosError, type AxiosResponse } from "axios";
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function api(
  path: string,
  init: RequestInit = {},
): Promise<AxiosResponse> {
  const base = process.env.AUTH_API_URL;
  if (!base)
    throw new ApiError(
      503,
      "The sign-in service is not configured yet. Please try again later.",
    );
  let response: AxiosResponse;
  try {
    response = await axios({
      url: `${base.replace(/\/$/, "")}/user-service${path}`,
      method: init.method || "GET",
      data: init.body as unknown,
      headers: {
        ...(init.body instanceof FormData
          ? {}
          : { "Content-Type": "application/json" }),
        ...(init.headers
          ? Object.fromEntries(new Headers(init.headers).entries())
          : {}),
      },
      timeout: 12_000,
      validateStatus: () => true,
    });
  } catch (error) {
    if (error instanceof AxiosError && error.code === "ECONNABORTED")
      throw new ApiError(503, "The sign-in service took too long to respond.");
    throw new ApiError(
      503,
      "We couldn’t reach the sign-in service. Please try again.",
    );
  }
  if (response.status < 200 || response.status >= 300) {
    const data = response.data;
    const message =
      response.status === 429
        ? "Too many attempts. Please wait a minute and try again."
        : response.status >= 500
          ? "The sign-in service is temporarily unavailable. Please try again."
          : typeof data?.detail === "string"
            ? data.detail.slice(0, 240)
            : "We couldn’t complete that request. Check your details and try again.";
    throw new ApiError(response.status, message);
  }
  return response;
}
export function errorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Something went wrong. Please try again.";
}
