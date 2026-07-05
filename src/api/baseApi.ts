import {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
  createApi,
  fetchBaseQuery,
} from '@reduxjs/toolkit/query/react';
import { Mutex } from 'async-mutex';
import { API_BASE_URL } from '../constants/config';
import { sessionEnded, tokensRefreshed } from '../features/auth/authSlice';
import { tokenStorage } from '../storage/mmkv';
import { ApiEnvelope } from '../types/api';

/**
 * Base query with silent token refresh:
 * a 401 triggers one /auth/refresh (mutex-guarded so concurrent 401s share a
 * single refresh), then the original request is retried. If refresh fails,
 * the session is ended and the navigator falls back to the auth stack.
 */
const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers) => {
    const token = tokenStorage.getAccessToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return headers;
  },
});

const refreshMutex = new Mutex();

export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  await refreshMutex.waitForUnlock();
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    if (!refreshMutex.isLocked()) {
      const release = await refreshMutex.acquire();
      try {
        const refreshToken = tokenStorage.getRefreshToken();
        if (!refreshToken) {
          api.dispatch(sessionEnded());
          return result;
        }

        const refreshResult = await rawBaseQuery(
          { url: '/auth/refresh', method: 'POST', body: { refreshToken } },
          api,
          extraOptions,
        );

        const envelope = refreshResult.data as
          | ApiEnvelope<{ accessToken: string; refreshToken: string }>
          | undefined;

        if (envelope?.success) {
          api.dispatch(tokensRefreshed(envelope.data));
        } else {
          api.dispatch(sessionEnded());
          return result;
        }
      } finally {
        release();
      }
    } else {
      // Another request is already refreshing — wait for it
      await refreshMutex.waitForUnlock();
    }

    result = await rawBaseQuery(args, api, extraOptions);
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Expense', 'Income', 'Dashboard', 'User'],
  endpoints: () => ({}),
});
