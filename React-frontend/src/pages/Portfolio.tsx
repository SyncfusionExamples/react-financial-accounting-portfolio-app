import { useGetHoldingsQuery, useGetPortfoliosQuery } from '../api/apiSlice';
import KpiCard from '../components/KpiCard';
import {
  GridComponent,
  ColumnsDirective,
  ColumnDirective,
  Inject,
  Page,
  Sort,
  Filter,
  Group,
} from '@syncfusion/ej2-react-grids';
import {
  AccumulationChartComponent,
  AccumulationSeriesCollectionDirective,
  AccumulationSeriesDirective,
  PieSeries,
  AccumulationLegend,
  AccumulationTooltip,
} from '@syncfusion/ej2-react-charts';
import { formatCurrency } from '../utils/format';

/** Fixed palette so asset-class slices stay the same color on every render. */
const ALLOCATION_COLORS = ['#00B262', '#3A7BFD', '#F59E0B', '#8B5CF6', '#64748B'];

export default function Portfolio() {
  const { data: holdings = [], isLoading: loadingHoldings } = useGetHoldingsQuery();
  const { data: portfolios = [], isLoading: loadingPortfolios } = useGetPortfoliosQuery();

  if (loadingHoldings || loadingPortfolios)
    return <div className="state-msg">Loading portfolio…</div>;

  const totalValue = holdings.reduce((sum, h) => sum + h.marketValue, 0);
  const totalGain = holdings.reduce((sum, h) => sum + h.unrealizedGainLoss, 0);

  // Group holdings by asset class for the allocation doughnut, then paint
  // each group with the fixed palette so colors stay stable across renders.
  const allocation = Object.values(
    holdings.reduce<Record<string, { assetClass: string; marketValue: number }>>(
      (acc, h) => {
        acc[h.assetClass] = acc[h.assetClass] ?? { assetClass: h.assetClass, marketValue: 0 };
        acc[h.assetClass].marketValue += h.marketValue;
        return acc;
      },
      {},
    ),
  ).map((item, i) => ({
    ...item,
    color: ALLOCATION_COLORS[i % ALLOCATION_COLORS.length],
  }));

  return (
    <div className="page">
      <h1 className="page-title">Portfolio & Investments</h1>
      <p className="page-subtitle">
        Holdings across stocks, mutual funds, ETFs, and bonds with performance tracking.
      </p>

      <section aria-label="Portfolio summary" className="kpi-grid">
        <KpiCard
          icon="e-icons e-chart"
          label="Market Value"
          value={formatCurrency(totalValue)}
          tone="accent"
          hint={`${holdings.length} positions`}
        />
        <KpiCard
          icon="e-icons e-trending-up"
          label="Unrealized P/L"
          value={formatCurrency(totalGain)}
          tone={totalGain >= 0 ? 'gain' : 'loss'}
          change={totalGain}
        />
        <KpiCard
          icon="e-icons e-folder"
          label="Portfolios"
          value={String(portfolios.length)}
          tone="info"
        />
      </section>

      <section className="grid two-col">
        <div className="card">
          <h2 className="section-title">Holdings</h2>
          <GridComponent
            dataSource={holdings}
            allowPaging={true}
            pageSettings={{ pageSize: 10 }}
            allowSorting={true}
            allowFiltering={true}
          >
            <ColumnsDirective>
              <ColumnDirective field="symbol" headerText="Symbol" width="110" />
              <ColumnDirective field="assetName" headerText="Asset" width="200" />
              <ColumnDirective field="assetClass" headerText="Class" width="120" />
              <ColumnDirective field="quantity" headerText="Qty" width="100" textAlign="Right" format="N4" />
              <ColumnDirective field="currentPrice" headerText="Price" width="110" textAlign="Right" format="C2" />
              <ColumnDirective field="marketValue" headerText="Market Value" width="140" textAlign="Right" format="C2" />
              <ColumnDirective
                field="unrealizedGainLoss"
                headerText="Gain / Loss"
                width="130"
                textAlign="Right"
                format="C2"
              />
            </ColumnsDirective>
            <Inject services={[Page, Sort, Filter, Group]} />
          </GridComponent>
        </div>

        <div className="card">
          <h2 className="section-title">Asset Allocation</h2>
          <AccumulationChartComponent
            id="allocation-chart"
            legendSettings={{ visible: true, position: 'Bottom' }}
            tooltip={{ enable: true }}
            width="100%"
            height="360px"
          >
            <Inject services={[PieSeries, AccumulationLegend, AccumulationTooltip]} />
            <AccumulationSeriesCollectionDirective>
              <AccumulationSeriesDirective
                dataSource={allocation}
                xName="assetClass"
                yName="marketValue"
                type="Pie"
                innerRadius="45%"
                pointColorMapping="color"
              />
            </AccumulationSeriesCollectionDirective>
          </AccumulationChartComponent>
        </div>
      </section>
    </div>
  );
}
