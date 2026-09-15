"use client";

import { useEffect, useState } from "react";
import { Provider } from "react-redux";
import { makeStore, type AppStore } from "@/store/store";
import { clearAuth, setAccessToken, setSession } from "@/store/auth-slice";
import { clientApi } from "@/lib/client-api";
import { userSchema } from "@/lib/contracts";

function SessionHydrator({ store }: { store: AppStore }) {
  useEffect(() => {
    // The OAuth handoff owns its first /me request. Avoid rotating the fresh
    // OAuth refresh cookie while it is exchanging the URL fragment.
    if (window.location.pathname === "/auth/complete") return;

    async function resolveAccessToken(): Promise<string> {
      const storedToken = localStorage.getItem("still_access");
      if (storedToken) return storedToken;

      const refreshed = await clientApi.post("/refresh");
      if (typeof refreshed.data.access_token !== "string") {
        throw new Error(
          "The refresh response did not include an access token.",
        );
      }
      localStorage.setItem("still_access", refreshed.data.access_token);
      return refreshed.data.access_token;
    }

    async function restore() {
      try {
        const accessToken = await resolveAccessToken();
        const profile = await clientApi.get("/me");
        store.dispatch(
          setSession({
            accessToken,
            user: userSchema.parse(profile.data),
          }),
        );
      } catch {
        localStorage.removeItem("still_access");
        store.dispatch(clearAuth());
      }
    }
    void restore();

    function handleAccessToken(event: Event) {
      const token = (event as CustomEvent<string>).detail;
      if (typeof token === "string") store.dispatch(setAccessToken(token));
    }
    function handleSessionExpired() {
      store.dispatch(clearAuth());
    }
    window.addEventListener("still:access-token", handleAccessToken);
    window.addEventListener("still:session-expired", handleSessionExpired);
    return () => {
      window.removeEventListener("still:access-token", handleAccessToken);
      window.removeEventListener("still:session-expired", handleSessionExpired);
    };
  }, [store]);
  return null;
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [store] = useState(makeStore);
  return (
    <Provider store={store}>
      <SessionHydrator store={store} />
      {children}
    </Provider>
  );
}
