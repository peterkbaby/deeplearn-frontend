import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type AuthState = {
  accessToken: string | null;
  ready: boolean;
};

const initialState: AuthState = { accessToken: null, ready: false };

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAccessToken(state, action: PayloadAction<string>) {
      state.accessToken = action.payload;
      state.ready = true;
    },
    clearAuth(state) {
      state.accessToken = null;
      state.ready = true;
    },
    markReady(state) {
      state.ready = true;
    },
  },
});

export const { clearAuth, markReady, setAccessToken } = authSlice.actions;
export default authSlice.reducer;
