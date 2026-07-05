import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { StorageKeys, storage, tokenStorage } from '../../storage/mmkv';
import { User } from '../../types/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

/** Rehydrate synchronously from MMKV so cold start lands on the right stack. */
function loadInitialState(): AuthState {
  const token = tokenStorage.getAccessToken();
  const userJson = storage.getString(StorageKeys.user);
  if (token && userJson) {
    try {
      return { user: JSON.parse(userJson) as User, isAuthenticated: true };
    } catch {
      tokenStorage.clear();
    }
  }
  return { user: null, isAuthenticated: false };
}

const authSlice = createSlice({
  name: 'auth',
  initialState: loadInitialState,
  reducers: {
    sessionStarted(
      state,
      action: PayloadAction<{ user: User; accessToken: string; refreshToken: string }>,
    ) {
      const { user, accessToken, refreshToken } = action.payload;
      tokenStorage.setTokens(accessToken, refreshToken);
      storage.set(StorageKeys.user, JSON.stringify(user));
      storage.set(StorageKeys.currency, user.currency);
      state.user = user;
      state.isAuthenticated = true;
    },
    userUpdated(state, action: PayloadAction<User>) {
      storage.set(StorageKeys.user, JSON.stringify(action.payload));
      storage.set(StorageKeys.currency, action.payload.currency);
      state.user = action.payload;
    },
    tokensRefreshed(_state, action: PayloadAction<{ accessToken: string; refreshToken: string }>) {
      tokenStorage.setTokens(action.payload.accessToken, action.payload.refreshToken);
    },
    sessionEnded(state) {
      tokenStorage.clear();
      state.user = null;
      state.isAuthenticated = false;
    },
  },
});

export const { sessionStarted, tokensRefreshed, sessionEnded, userUpdated } = authSlice.actions;
export const authReducer = authSlice.reducer;
