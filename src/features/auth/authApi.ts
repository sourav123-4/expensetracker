import { baseApi } from '../../api/baseApi';
import { ApiEnvelope, User } from '../../types/api';
import { sessionEnded, sessionStarted } from './authSlice';

interface AuthPayload {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<AuthPayload, { email: string; password: string }>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
      transformResponse: (response: ApiEnvelope<AuthPayload>) => response.data,
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        dispatch(sessionStarted(data));
      },
    }),

    register: builder.mutation<AuthPayload, { name: string; email: string; password: string }>({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
      transformResponse: (response: ApiEnvelope<AuthPayload>) => response.data,
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        dispatch(sessionStarted(data));
      },
    }),

    logout: builder.mutation<null, { refreshToken: string }>({
      query: (body) => ({ url: '/auth/logout', method: 'POST', body }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        // End the local session regardless of whether the server call succeeds
        try {
          await queryFulfilled;
        } finally {
          dispatch(sessionEnded());
          dispatch(baseApi.util.resetApiState());
        }
      },
    }),

    forgotPassword: builder.mutation<null, { email: string }>({
      query: (body) => ({ url: '/auth/forgot-password', method: 'POST', body }),
    }),

    verifyOtp: builder.mutation<{ resetToken: string }, { email: string; otp: string }>({
      query: (body) => ({ url: '/auth/verify-otp', method: 'POST', body }),
      transformResponse: (response: ApiEnvelope<{ resetToken: string }>) => response.data,
    }),

    resetPassword: builder.mutation<
      null,
      { email: string; resetToken: string; newPassword: string }
    >({
      query: (body) => ({ url: '/auth/reset-password', method: 'POST', body }),
    }),

    me: builder.query<User, void>({
      query: () => '/auth/me',
      transformResponse: (response: ApiEnvelope<{ user: User }>) => response.data.user,
      providesTags: ['User'],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useForgotPasswordMutation,
  useVerifyOtpMutation,
  useResetPasswordMutation,
  useMeQuery,
} = authApi;
