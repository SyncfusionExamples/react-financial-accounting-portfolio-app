import { useGetDashboardSummaryQuery, useGetTransactionsQuery } from '../api/apiSlice';
import type { PortfolioHistoryPoint } from '../api/types';
import KpiCard from '../components/KpiCard';
import {
  ChartComponent,
  SeriesCollectionDirective,
  SeriesDirective,
  Inject,
  LineSeries,
  ColumnSeries,
  Legend,
  Tooltip,
  Category,
  DateTime,
} from '@syncfusion/ej2-react-charts';
import { formatCurrency } from '../utils/format';

/** Chart-friendly point with a real Date object for the DateTime axis. */
interface HistoryChartPoint {
  date: Date;
  value: number;
  benchmark: number;
}

/**
 * The API serializes snapshots as { snapshotDate, value, benchmarkValue }.
 * Map them to the field names the chart series bind against, and convert
 * the ISO date string to a Date so the DateTime axis renders real months
 * instead of epoch values.
 */
function toHistoryPoints(history: PortfolioHistoryPoint[] | undefined): HistoryChartPoint[] {
  if (!history?.length) return [];
  return history
    .filter((p) => (p.snapshotDate ?? p.date) != null)
    .map((p) => ({
      date: new Date(p.snapshotDate ?? p.date ?? 0),
      value: Number(p.value ?? 0),
      benchmark: Number(p.benchmarkValue ?? p.benchmark ?? 0),
    }));
}

export default function Analytics() {
  const { data, isLoading, isError, error } = useGetDashboardSummaryQuery();
  // Full transaction list for the cash flow chart. The dashboard summary
  // only includes the 10 most recent, which would clip the chart to a
  // handful of months.
  const { data: transactions } = useGetTransactionsQuery();

  if (isLoading) return <div className="state-msg">Loading analytics…</div>;
  if (isError)
    return (
      <div className="state-msg error">
        Failed to load analytics.
        <code>{String(error)}</code>
      </div>
    );
  if (!data) return <div className="state-msg">No data available.</div>;

  const monthlyNet = computeMonthlyNet(transactions ?? data.recentTransactions);
  const historyPoints = toHistoryPoints(data.portfolioHistory);

  return (
    <div className="page">
      <h1 className="page-title">Analytics & Reports</h1>
      <p className="page-subtitle">
        Performance charts, cash flow analysis, and financial summaries.
      </p>

      <section className="grid two-col">
        <div className="card">
          <h2 className="section-title">Net Worth Trend</h2>
          <ChartComponent
            id="net-worth-trend"
            primaryXAxis={{ valueType: 'DateTime', labelFormat: 'MMM y' }}
            primaryYAxis={{ labelFormat: '${value}' }}
            tooltip={{ enable: true }}
            width="100%"
            height="300px"
          >
            <Inject services={[LineSeries, DateTime, Legend, Tooltip]} />
            <SeriesCollectionDirective>
              <SeriesDirective
                dataSource={historyPoints}
                xName="date"
                yName="value"
                name="Net Worth"
                type="Line"
                width={2}
              />
            </SeriesCollectionDirective>
          </ChartComponent>
        </div>

        <div className="card">
          <h2 className="section-title">Monthly Cash Flow</h2>
          <ChartComponent
            id="monthly-cashflow"
            primaryXAxis={{
              valueType: 'Category',
              labelRotation: 45,
              labelIntersectAction: 'Rotate45',
              interval: monthlyNet.length > 12 ? 1 : undefined,
            }}
            primaryYAxis={{ labelFormat: '${value}' }}
            tooltip={{ enable: true }}
            legendSettings={{ visible: true, position: 'Bottom' }}
            width="100%"
            height="300px"
          >
            <Inject services={[ColumnSeries, Category, Legend, Tooltip]} />
            <SeriesCollectionDirective>
              <SeriesDirective
                dataSource={monthlyNet}
                xName="monthLabel"
                yName="income"
                name="Income"
                type="Column"
              />
              <SeriesDirective
                dataSource={monthlyNet}
                xName="monthLabel"
                yName="expenses"
                name="Expenses"
                type="Column"
              />
            </SeriesCollectionDirective>
          </ChartComponent>
        </div>
      </section>

      <section aria-label="Financial summary" className="kpi-grid">
        <KpiCard
          icon="e-icons e-money"
          label="Total Assets"
          value={formatCurrency(data.totalAssets)}
          tone="accent"
        />
        <KpiCard
          icon="e-icons e-wallet"
          label="Cash on Hand"
          value={formatCurrency(data.cashOnHand)}
          tone="info"
        />
        <KpiCard
          icon="e-icons e-arrow-up"
          label="Monthly Income"
          value={formatCurrency(data.monthlyIncome)}
          tone="gain"
          hint="This month to date"
        />
        <KpiCard
          icon="e-icons e-arrow-down"
          label="Monthly Expenses"
          value={formatCurrency(data.monthlyExpenses)}
          tone="loss"
          hint="This month to date"
        />
        <KpiCard
          icon="e-icons e-trending-up"
          label="Unrealized Gain/Loss"
          value={formatCurrency(data.unrealizedGainLoss)}
          tone={data.unrealizedGainLoss >= 0 ? 'gain' : 'loss'}
          change={data.unrealizedGainLoss}
        />
        <KpiCard
          icon="e-icons e-clock"
          label="Realized Gain/Loss"
          value={formatCurrency(data.realizedGainLoss)}
          tone="info"
        />
      </section>

      <section className="card">
        <h2 className="section-title">Historical Trend</h2>
        <ChartComponent
          id="historical-trend"
          primaryXAxis={{ valueType: 'DateTime', labelFormat: 'MMM y' }}
          primaryYAxis={{ labelFormat: '${value}' }}
          tooltip={{ enable: true }}
          legendSettings={{ visible: true, position: 'Bottom' }}
          width="100%"
          height="300px"
        >
          <Inject services={[LineSeries, DateTime, Legend, Tooltip]} />
          <SeriesCollectionDirective>
            <SeriesDirective
              dataSource={historyPoints}
              xName="date"
              yName="value"
              name="Portfolio Value"
              type="Line"
              width={2}
            />
            <SeriesDirective
              dataSource={historyPoints}
              xName="date"
              yName="benchmark"
              name="Benchmark"
              type="Line"
              width={2}
              dashArray="5,5"
            />
          </SeriesCollectionDirective>
        </ChartComponent>
      </section>
    </div>
  );
}

interface MonthlyNetPoint {
  /** Sort key, e.g. "2026-06". */
  month: string;
  /** Display label, e.g. "Jun 26". */
  monthLabel: string;
  income: number;
  expenses: number;
  net: number;
}

function computeMonthlyNet(transactions: { transactionDate: string; type: string; amount: number }[]): MonthlyNetPoint[] {
  const byMonth = new Map<string, MonthlyNetPoint>();
  for (const tx of transactions) {
    const month = tx.transactionDate.slice(0, 7); // yyyy-MM
    const existing = byMonth.get(month);
    const point =
      existing ??
      {
        month,
        monthLabel: formatMonthLabel(month),
        income: 0,
        expenses: 0,
        net: 0,
      };
    if (tx.type === 'Income' || tx.type === 'Deposit') {
      point.income += tx.amount;
      point.net += tx.amount;
    } else if (tx.type === 'Expense' || tx.type === 'Withdrawal') {
      point.expenses += tx.amount;
      point.net -= tx.amount;
    }
    byMonth.set(month, point);
  }
  return [...byMonth.values()].sort((a, b) => a.month.localeCompare(b.month));
}

/** "2026-06" -> "Jun 26" */
function formatMonthLabel(month: string): string {
  const [year, mon] = month.split('-').map(Number);
  if (!year || !mon) return month;
  const date = new Date(Date.UTC(year, mon - 1, 1));
  return `${date.toLocaleString('en-US', { month: 'short' })} ${String(year).slice(2)}`;
}
