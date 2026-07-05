import { baseApi } from '../../api/baseApi';
import { ApiEnvelope, DashboardSummary } from '../../types/api';

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    dashboardSummary: builder.query<DashboardSummary, { month?: string }>({
      query: (params) => ({ url: '/dashboard/summary', params }),
      transformResponse: (response: ApiEnvelope<DashboardSummary>) => response.data,
      providesTags: ['Dashboard'],
    }),

    dashboardInsight: builder.query<string | null, { month?: string }>({
      query: (params) => ({ url: '/dashboard/insight', params }),
      transformResponse: (response: ApiEnvelope<{ insight: string | null }>) => response.data.insight,
      providesTags: ['Dashboard'],
    }),
  }),
});

export const { useDashboardSummaryQuery, useDashboardInsightQuery } = dashboardApi;
