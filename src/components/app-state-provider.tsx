"use client";

import { useEffect, useState } from "react";
import { Provider } from "react-redux";
import { makeStore, type AppStore } from "@/store/store";
import { markReady, setAccessToken } from "@/store/auth-slice";

function SessionHydrator({ store }: { store: AppStore }) {
  useEffect(() => {
    const token = localStorage.getItem("still_access");
    if (token) store.dispatch(setAccessToken(token));
    else store.dispatch(markReady());
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
