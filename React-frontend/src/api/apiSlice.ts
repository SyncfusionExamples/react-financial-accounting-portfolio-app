import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  Account,
  DashboardSummary,
  Holding,
  LedgerEntry,
  Portfolio,
  Transaction,
} from './types';

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5130/api',
});

/**
 * Single typed query API covering every backend controller.
 * Tags keep grids and charts in sync after mutations.
 */
export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: ['Portfolio', 'Holding', 'Account', 'Transaction', 'Ledger', 'Dashboard'],
  endpoints: (builder) => ({
    // ===== Dashboard =====
    getDashboardSummary: builder.query<DashboardSummary, void>({
      query: () => '/dashboard/summary',
      providesTags: ['Dashboard'],
    }),

    // ===== Portfolios =====
    getPortfolios: builder.query<Portfolio[], void>({
      query: () => '/portfolios',
      providesTags: ['Portfolio'],
    }),

    // ===== Holdings =====
    // `?portfolioId=` filtering exists on the API but no page uses it today;
    // kept as a plain query so the signature matches actual usage.
    getHoldings: builder.query<Holding[], void>({
      query: () => '/holdings',
      providesTags: ['Holding'],
    }),

    // ===== Accounts =====
    getAccounts: builder.query<Account[], void>({
      query: () => '/accounts',
      providesTags: ['Account'],
    }),

    // ===== Transactions =====
    getTransactions: builder.query<Transaction[], void>({
      query: () => '/transactions',
      providesTags: ['Transaction'],
    }),
    createTransaction: builder.mutation<Transaction, Omit<Transaction, 'id'>>({
      query: (body) => ({ url: '/transactions', method: 'POST', body }),
      invalidatesTags: ['Transaction', 'Account', 'Dashboard', 'Ledger', 'Holding'],
    }),

    // ===== Ledger =====
    getLedger: builder.query<LedgerEntry[], void>({
      query: () => '/ledger',
      providesTags: ['Ledger'],
    }),
  }),
});

export const {
  useGetDashboardSummaryQuery,
  useGetPortfoliosQuery,
  useGetHoldingsQuery,
  useGetAccountsQuery,
  useGetTransactionsQuery,
  useCreateTransactionMutation,
  useGetLedgerQuery,
} = apiSlice;
