import { baseApi } from '../../api/baseApi';
import {
  ApiEnvelope,
  Expense,
  ExpenseListParams,
  PaginationMeta,
} from '../../types/api';

export interface ExpenseListResult {
  expenses: Expense[];
  meta: PaginationMeta;
}

export type ExpenseInput = Pick<
  Expense,
  'title' | 'amount' | 'category' | 'paymentMethod' | 'date'
> &
  Partial<Pick<Expense, 'description' | 'tags' | 'isRecurring' | 'location'>>;

export const expensesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listExpenses: builder.query<ExpenseListResult, ExpenseListParams>({
      query: (params) => ({ url: '/expenses', params }),
      transformResponse: (response: ApiEnvelope<{ expenses: Expense[] }>) => ({
        expenses: response.data.expenses,
        meta: response.meta as PaginationMeta,
      }),
      // One cache entry per filter combination (page changes merge into it)
      serializeQueryArgs: ({ queryArgs }) => {
        const filters = { ...queryArgs };
        delete filters.page;
        return JSON.stringify(filters);
      },
      merge: (current, incoming, { arg }) => {
        if ((arg.page ?? 1) === 1) return incoming;
        return {
          expenses: [...current.expenses, ...incoming.expenses],
          meta: incoming.meta,
        };
      },
      forceRefetch: ({ currentArg, previousArg }) =>
        JSON.stringify(currentArg) !== JSON.stringify(previousArg),
      providesTags: (result) =>
        result
          ? [
              ...result.expenses.map((e) => ({ type: 'Expense' as const, id: e._id })),
              { type: 'Expense', id: 'LIST' },
            ]
          : [{ type: 'Expense', id: 'LIST' }],
    }),

    getExpense: builder.query<Expense, string>({
      query: (id) => `/expenses/${id}`,
      transformResponse: (response: ApiEnvelope<{ expense: Expense }>) => response.data.expense,
      providesTags: (_r, _e, id) => [{ type: 'Expense', id }],
    }),

    createExpense: builder.mutation<Expense, ExpenseInput>({
      query: (body) => ({ url: '/expenses', method: 'POST', body }),
      transformResponse: (response: ApiEnvelope<{ expense: Expense }>) => response.data.expense,
      invalidatesTags: [{ type: 'Expense', id: 'LIST' }, 'Dashboard'],
    }),

    updateExpense: builder.mutation<Expense, { id: string; patch: Partial<ExpenseInput> }>({
      query: ({ id, patch }) => ({ url: `/expenses/${id}`, method: 'PATCH', body: patch }),
      transformResponse: (response: ApiEnvelope<{ expense: Expense }>) => response.data.expense,
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Expense', id },
        { type: 'Expense', id: 'LIST' },
        'Dashboard',
      ],
    }),

    deleteExpense: builder.mutation<null, string>({
      query: (id) => ({ url: `/expenses/${id}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'Expense', id },
        { type: 'Expense', id: 'LIST' },
        'Dashboard',
      ],
    }),
  }),
});

export const {
  useListExpensesQuery,
  useGetExpenseQuery,
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
  useDeleteExpenseMutation,
} = expensesApi;
