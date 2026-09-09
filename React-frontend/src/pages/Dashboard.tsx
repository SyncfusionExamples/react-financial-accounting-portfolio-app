import { useGetDashboardSummaryQuery } from '../api/apiSlice';
import type { PortfolioHistoryPoint } from '../api/types';
import KpiCard from '../components/KpiCard';
import {
  ChartComponent,
  SeriesCollectionDirective,
  SeriesDirective,
  Inject,
  LineSeries,
  DateTime,
  Legend,
  Tooltip,
  AccumulationChartComponent,
  AccumulationSeriesCollectionDirective,
  AccumulationSeriesDirective,
  PieSeries,
  AccumulationLegend,
  AccumulationTooltip,
  AccumulationDataLabel,
} from '@syncfusion/ej2-react-charts';
import {
  GridComponent,
  ColumnsDirective,
  ColumnDirective,
  Inject as GridInject,
  Page,
  Sort,
} from '@syncfusion/ej2-react-grids';
import { formatCurrency, formatPercent, parseDate } from '../utils/format';

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

/** Fixed palette so asset-class slices stay the same color on every render. */
const DISTRIBUTION_COLORS = ['#00B262', '#3A7BFD', '#F59E0B', '#8B5CF6', '#64748B'];

export default function Dashboard() {
  const { data, isLoading, isError, error } = useGetDashboardSummaryQuery();

  if (isLoading) return <div className="state-msg">Loading dashboard…</div>;
  if (isError)
    return (
      <div className="state-msg error">
        Failed to load dashboard.
        <code>{String(error)}</code>
      </div>
    );
  if (!data) return <div className="state-msg">No data available.</div>;

  const historyPoints = toHistoryPoints(data.portfolioHistory);
  const hasBenchmark = historyPoints.some((p) => p.benchmark != null && p.benchmark !== 0);

  // Attach the fixed palette to the distribution slices the API returns.
  const distribution = data.investmentDistribution.map((d, i) => ({
    ...d,
    color: d.color ?? DISTRIBUTION_COLORS[i % DISTRIBUTION_COLORS.length],
  }));

  return (
    <div className="page">
      <h1 className="page-title">Dashboard</h1>
      <p className="page-subtitle">
        Portfolio value, asset overview, and recent activity at a glance.
      </p>

      <section aria-label="Key metrics" className="kpi-grid">
        <KpiCard
          icon="e-icons e-chart"
          label="Portfolio Value"
          value={formatCurrency(data.portfolioValue)}
          tone="accent"
          hint={`${distribution.length} asset classes`}
        />
        <KpiCard
          icon="e-icons e-money"
          label="Total Assets"
          value={formatCurrency(data.totalAssets)}
          tone="info"
          hint="Investments + cash"
        />
        <KpiCard
          icon="e-icons e-trending-up"
          label="Gains / Losses"
          value={formatCurrency(data.unrealizedGainLoss)}
          tone={data.unrealizedGainLoss >= 0 ? 'gain' : 'loss'}
          change={data.unrealizedGainLoss}
          hint={formatPercent(data.unrealizedGainLossPercent)}
        />
        <KpiCard
          icon="e-icons e-wallet"
          label="Cash on Hand"
          value={formatCurrency(data.cashOnHand)}
          tone="info"
        />
      </section>

      <section className="grid two-col" aria-label="Charts">
        <div className="card">
          <h2 className="section-title">Portfolio Value Trend</h2>
          <ChartComponent
            id="portfolio-trend"
            primaryXAxis={{ valueType: 'DateTime', labelFormat: 'MMM y' }}
            primaryYAxis={{ labelFormat: '${value}' }}
            tooltip={{ enable: true, shared: true }}
            legendSettings={{ visible: true, position: 'Bottom' }}
            width="100%"
            height="320px"
          >
            <Inject services={[LineSeries, DateTime, Legend, Tooltip]} />
            <SeriesCollectionDirective>
              <SeriesDirective
                dataSource={historyPoints}
                xName="date"
                yName="value"
                name="Portfolio"
                type="Line"
                width={2}
              />
              {hasBenchmark && (
                <SeriesDirective
                  dataSource={historyPoints}
                  xName="date"
                  yName="benchmark"
                  name="Benchmark"
                  type="Line"
                  dashArray="5,3"
                  width={1.5}
                />
              )}
            </SeriesCollectionDirective>
          </ChartComponent>
        </div>

        <div className="card">
          <h2 className="section-title">Investment Distribution</h2>
          <AccumulationChartComponent
            id="investment-distribution"
            legendSettings={{ visible: true, position: 'Bottom' }}
            tooltip={{ enable: true }}
            width="100%"
            height="320px"
          >
            <Inject
              services={[
                PieSeries,
                AccumulationLegend,
                AccumulationTooltip,
                AccumulationDataLabel,
              ]}
            />
            <AccumulationSeriesCollectionDirective>
              <AccumulationSeriesDirective
                dataSource={distribution}
                xName="label"
                yName="marketValue"
                type="Pie"
                innerRadius="40%"
                pointColorMapping="color"
              />
            </AccumulationSeriesCollectionDirective>
          </AccumulationChartComponent>
        </div>
      </section>

      <section className="card" aria-label="Recent transactions">
        <h2 className="section-title">Recent Transactions</h2>
        <GridComponent
          dataSource={data.recentTransactions}
          allowPaging={false}
          allowSorting={true}
          height="260"
        >
          <ColumnsDirective>
            <ColumnDirective field="transactionDate" headerText="Date" width="140" type="datetime" format="yMd" textAlign="Left" valueAccessor={(field, data) => parseDate((data as Record<string, unknown>)[field])} />
            <ColumnDirective field="type" headerText="Type" width="120" />
            <ColumnDirective field="accountName" headerText="Account" width="170" />
            <ColumnDirective field="symbol" headerText="Symbol" width="110" />
            <ColumnDirective field="amount" headerText="Amount" width="130" textAlign="Right" format="C2" />
            <ColumnDirective field="status" headerText="Status" width="120" />
          </ColumnsDirective>
          <GridInject services={[Page, Sort]} />
        </GridComponent>
      </section>
    </div>
  );
}
