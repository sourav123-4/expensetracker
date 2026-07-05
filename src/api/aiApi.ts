import { ApiEnvelope, ParsedAiTransaction } from '../types/api';
import { baseApi } from './baseApi';

export const aiApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    parseTransaction: builder.mutation<ParsedAiTransaction, { text: string }>({
      query: (body) => ({ url: '/ai/parse-transaction', method: 'POST', body }),
      transformResponse: (response: ApiEnvelope<{ transaction: ParsedAiTransaction }>) =>
        response.data.transaction,
    }),
  }),
});

export const { useParseTransactionMutation } = aiApi;
