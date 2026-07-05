import { authReducer, sessionEnded, sessionStarted, tokensRefreshed } from './authSlice';
import { tokenStorage } from '../../storage/mmkv';
import { User } from '../../types/api';

const mockUser: User = {
  _id: 'u1',
  name: 'Demo User',
  email: 'demo@expenseflow.app',
  currency: 'INR',
  createdAt: new Date().toISOString(),
};

describe('authSlice', () => {
  beforeEach(() => {
    tokenStorage.clear();
  });

  it('starts logged out by default', () => {
    const state = authReducer(undefined, { type: '@@INIT' });
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
  });

  it('sessionStarted logs the user in and persists tokens', () => {
    const state = authReducer(
      undefined,
      sessionStarted({ user: mockUser, accessToken: 'access-1', refreshToken: 'refresh-1' }),
    );

    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(mockUser);
    expect(tokenStorage.getAccessToken()).toBe('access-1');
    expect(tokenStorage.getRefreshToken()).toBe('refresh-1');
  });

  it('tokensRefreshed updates stored tokens without changing auth state', () => {
    let state = authReducer(
      undefined,
      sessionStarted({ user: mockUser, accessToken: 'access-1', refreshToken: 'refresh-1' }),
    );
    state = authReducer(state, tokensRefreshed({ accessToken: 'access-2', refreshToken: 'refresh-2' }));

    expect(state.isAuthenticated).toBe(true);
    expect(tokenStorage.getAccessToken()).toBe('access-2');
    expect(tokenStorage.getRefreshToken()).toBe('refresh-2');
  });

  it('sessionEnded logs the user out and clears storage', () => {
    let state = authReducer(
      undefined,
      sessionStarted({ user: mockUser, accessToken: 'access-1', refreshToken: 'refresh-1' }),
    );
    state = authReducer(state, sessionEnded());

    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(tokenStorage.getAccessToken()).toBeUndefined();
    expect(tokenStorage.getRefreshToken()).toBeUndefined();
  });
});
