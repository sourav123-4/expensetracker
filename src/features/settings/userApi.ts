import { baseApi } from '../../api/baseApi';
import { ApiEnvelope, User } from '../../types/api';
import { userUpdated } from '../auth/authSlice';

export interface ExportBundle {
  version: 1;
  exportedAt: string;
  user: { name: string; email: string; currency: string };
  expenses: unknown[];
  income: unknown[];
}

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    updateProfile: builder.mutation<User, { name?: string; currency?: string }>({
      query: (body) => ({ url: '/users/me', method: 'PATCH', body }),
      transformResponse: (response: ApiEnvelope<{ user: User }>) => response.data.user,
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        dispatch(userUpdated(data));
      },
      // Currency affects every formatted amount — refetch everything visible
      invalidatesTags: ['Dashboard', 'Expense', 'Income', 'User'],
    }),

    registerFcmToken: builder.mutation<null, { token: string }>({
      query: (body) => ({ url: '/users/me/fcm-token', method: 'PUT', body }),
    }),

    unregisterFcmToken: builder.mutation<null, { token: string }>({
      query: (body) => ({ url: '/users/me/fcm-token', method: 'DELETE', body }),
    }),

    exportData: builder.mutation<ExportBundle, void>({
      query: () => ({ url: '/users/me/export', method: 'GET' }),
      transformResponse: (response: ApiEnvelope<ExportBundle>) => response.data,
    }),

    importData: builder.mutation<{ expenses: number; income: number }, ExportBundle>({
      query: (body) => ({ url: '/users/me/import', method: 'POST', body }),
      transformResponse: (response: ApiEnvelope<{ expenses: number; income: number }>) =>
        response.data,
      invalidatesTags: ['Dashboard', { type: 'Expense', id: 'LIST' }, { type: 'Income', id: 'LIST' }],
    }),

    sendTestPush: builder.mutation<{ sent: number }, void>({
      query: () => ({ url: '/users/me/test-push', method: 'POST' }),
      transformResponse: (response: ApiEnvelope<{ sent: number }>) => response.data,
    }),
  }),
});

export const {
  useUpdateProfileMutation,
  useRegisterFcmTokenMutation,
  useUnregisterFcmTokenMutation,
  useExportDataMutation,
  useImportDataMutation,
  useSendTestPushMutation,
} = userApi;
