import { baseApi } from '../../api/baseApi';
import { ApiEnvelope, Income, PaginationMeta } from '../../types/api';

export interface IncomeListResult {
  income: Income[];
  meta: PaginationMeta;
}

export type IncomeInput = Pick<Income, 'title' | 'amount' | 'source' | 'date'> &
  Partial<Pick<Income, 'description'>>;

interface IncomeListParams {
  page?: number;
  limit?: number;
  source?: string;
  q?: string;
}

export const incomeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listIncome: builder.query<IncomeListResult, IncomeListParams>({
      query: (params) => ({ url: '/income', params }),
      transformResponse: (response: ApiEnvelope<{ income: Income[] }>) => ({
        income: response.data.income,
        meta: response.meta as PaginationMeta,
      }),
      serializeQueryArgs: ({ queryArgs }) => {
        const filters = { ...queryArgs };
        delete filters.page;
        return JSON.stringify(filters);
      },
      merge: (current, incoming, { arg }) => {
        if ((arg.page ?? 1) === 1) return incoming;
        return { income: [...current.income, ...incoming.income], meta: incoming.meta };
      },
      forceRefetch: ({ currentArg, previousArg }) =>
        JSON.stringify(currentArg) !== JSON.stringify(previousArg),
      providesTags: (result) =>
        result
          ? [
              ...result.income.map((i) => ({ type: 'Income' as const, id: i._id })),
              { type: 'Income', id: 'LIST' },
            ]
          : [{ type: 'Income', id: 'LIST' }],
    }),

    getIncome: builder.query<Income, string>({
      query: (id) => `/income/${id}`,
      transformResponse: (response: ApiEnvelope<{ income: Income }>) => response.data.income,
      providesTags: (_r, _e, id) => [{ type: 'Income', id }],
    }),

    createIncome: builder.mutation<Income, IncomeInput>({
      query: (body) => ({ url: '/income', method: 'POST', body }),
      transformResponse: (response: ApiEnvelope<{ income: Income }>) => response.data.income,
      invalidatesTags: [{ type: 'Income', id: 'LIST' }, 'Dashboard'],
    }),

    updateIncome: builder.mutation<Income, { id: string; patch: Partial<IncomeInput> }>({
      query: ({ id, patch }) => ({ url: `/income/${id}`, method: 'PATCH', body: patch }),
      transformResponse: (response: ApiEnvelope<{ income: Income }>) => response.data.income,
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Income', id },
        { type: 'Income', id: 'LIST' },
        'Dashboard',
      ],
    }),

    deleteIncome: builder.mutation<null, string>({
      query: (id) => ({ url: `/income/${id}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'Income', id },
        { type: 'Income', id: 'LIST' },
        'Dashboard',
      ],
    }),
  }),
});

export const {
  useListIncomeQuery,
  useGetIncomeQuery,
  useCreateIncomeMutation,
  useUpdateIncomeMutation,
  useDeleteIncomeMutation,
} = incomeApi;
