/** Shared domain types mirrored from the API DTOs. */

export type AssetClass = 'Stock' | 'MutualFund' | 'Etf' | 'Bond';

export type TransactionType =
  | 'Buy'
  | 'Sell'
  | 'Deposit'
  | 'Withdrawal'
  | 'TransferIn'
  | 'TransferOut'
  | 'Income'
  | 'Expense';

export type TransactionStatus = 'Pending' | 'Completed' | 'Failed' | 'Cancelled';

export interface Portfolio {
  id: number;
  name: string;
  description: string;
  baseCurrency: string;
  createdAt: string;
}

export interface Holding {
  id: number;
  portfolioId: number;
  symbol: string;
  assetName: string;
  assetClass: AssetClass;
  quantity: number;
  averageCostBasis: number;
  currentPrice: number;
  marketValue: number;
  unrealizedGainLoss: number;
  unrealizedGainLossPercent: number;
}

export interface Account {
  id: number;
  name: string;
  accountType: string;
  institution: string;
  currency: string;
  currentBalance: number;
}

export interface Transaction {
  id: number;
  transactionDate: string;
  type: TransactionType;
  accountId: number;
  accountName?: string;
  symbol?: string;
  quantity?: number;
  amount: number;
  status: TransactionStatus;
  notes?: string;
}

export interface LedgerEntry {
  id: number;
  entryDate: string;
  account: string;
  accountCode: string;
  description: string;
  debit: number;
  credit: number;
}

export interface DashboardSummary {
  portfolioValue: number;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  unrealizedGainLoss: number;
  unrealizedGainLossPercent: number;
  realizedGainLoss: number;
  cashOnHand: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  recentTransactions: Transaction[];
  investmentDistribution: InvestmentDistributionItem[];
  portfolioHistory: PortfolioHistoryPoint[];
}

export interface InvestmentDistributionItem {
  assetClass: string;
  /** Asset-class label supplied by the API, e.g. "Stock". */
  label?: string;
  marketValue: number;
  percentage: number;
  /** Optional hex color the UI can map onto chart points. */
  color?: string;
}

export interface PortfolioHistoryPoint {
  /** ISO date string; the API serializes this from SnapshotDate. */
  snapshotDate?: string;
  date?: string;
  value: number;
  benchmarkValue?: number;
  benchmark?: number;
}
