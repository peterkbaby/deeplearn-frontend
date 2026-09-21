"use client";

import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

export class ClientApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export const clientApi = axios.create({
  baseURL: "/user-service",
  withCredentials: true,
  timeout: 12_000,
});

export const docmindApi = axios.create({
  baseURL: "/doc-service",
  withCredentials: true,
  timeout: 120_000,
});

type RetriableRequest = InternalAxiosRequestConfig & { _retried?: boolean };

let refreshInFlight: Promise<string> | null = null;

function emit(name: string, detail?: string) {
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

async function refreshAccessToken() {
  if (!refreshInFlight) {
    refreshInFlight = axios
      .post("/user-service/refresh", undefined, {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      })
      .then((response) => {
        const token = response.data?.access_token;
        if (typeof token !== "string") {
          throw new Error(
            "The refresh response did not include an access token.",
          );
        }
        localStorage.setItem("still_access", token);
        emit("still:access-token", token);
        return token;
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

function isSessionEndpoint(url?: string) {
  return ["/login", "/register", "/refresh", "/logout"].some((path) =>
    url?.endsWith(path),
  );
}

function addInterceptors(api: typeof clientApi, unavailableMessage: string) {
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem("still_access");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    if (!(config.data instanceof FormData))
      config.headers["Content-Type"] ??= "application/json";
    return config;
  });

  api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<{ detail?: string }>) => {
      const request = error.config as RetriableRequest | undefined;
      if (
        error.response?.status === 401 &&
        request &&
        !request._retried &&
        !isSessionEndpoint(request.url)
      ) {
        request._retried = true;
        try {
          const token = await refreshAccessToken();
          request.headers.Authorization = `Bearer ${token}`;
          return api(request);
        } catch {
          localStorage.removeItem("still_access");
          emit("still:session-expired");
        }
      }
      if (!error.response)
        return Promise.reject(new ClientApiError(503, unavailableMessage));
      const message =
        typeof error.response.data?.detail === "string"
          ? error.response.data.detail
          : "We couldn’t complete that request. Please try again.";
      return Promise.reject(new ClientApiError(error.response.status, message));
    },
  );
}

addInterceptors(clientApi, "We couldn’t reach the sign-in service.");
addInterceptors(docmindApi, "We couldn’t reach the document service.");
