import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { User } from "@/lib/contracts";

type AuthState = {
  accessToken: string | null;
  user: User | null;
  status: "loading" | "authenticated" | "anonymous";
};

const initialState: AuthState = {
  accessToken: null,
  user: null,
  status: "loading",
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setSession(
      state,
      action: PayloadAction<{ accessToken: string; user: User }>,
    ) {
      state.accessToken = action.payload.accessToken;
      state.user = action.payload.user;
      state.status = "authenticated";
    },
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload;
      state.status = "authenticated";
    },
    setAccessToken(state, action: PayloadAction<string>) {
      state.accessToken = action.payload;
      state.status = "authenticated";
    },
    clearAuth(state) {
      state.accessToken = null;
      state.user = null;
      state.status = "anonymous";
    },
    setLoading(state) {
      state.status = "loading";
    },
  },
});

export const { clearAuth, setAccessToken, setLoading, setSession, setUser } =
  authSlice.actions;
export default authSlice.reducer;
