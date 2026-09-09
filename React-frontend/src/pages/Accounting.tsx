import { useState } from 'react';
import { useGetAccountsQuery, useGetLedgerQuery } from '../api/apiSlice';
import KpiCard from '../components/KpiCard';
import {
  GridComponent,
  ColumnsDirective,
  ColumnDirective,
  Inject,
  Page,
  Sort,
  Filter,
} from '@syncfusion/ej2-react-grids';
import { formatCurrency } from '../utils/format';

export default function Accounting() {
  const { data: accounts = [], isLoading: loadingAccounts } = useGetAccountsQuery();
  const { data: ledger = [], isLoading: loadingLedger } = useGetLedgerQuery();
  const [view, setView] = useState<'accounts' | 'ledger'>('accounts');

  if (loadingAccounts || loadingLedger)
    return <div className="state-msg">Loading accounting data…</div>;

  const totalBalance = accounts.reduce((sum, a) => sum + a.currentBalance, 0);
  const totalDebits = ledger.reduce((sum, l) => sum + l.debit, 0);
  const totalCredits = ledger.reduce((sum, l) => sum + l.credit, 0);

  return (
    <div className="page">
      <h1 className="page-title">Financial Accounting</h1>
      <p className="page-subtitle">
        Accounts, income & expense entries, and the general ledger.
      </p>

      <section aria-label="Accounting summary" className="kpi-grid">
        <KpiCard
          icon="e-icons e-folder"
          label="Accounts"
          value={String(accounts.length)}
          tone="info"
        />
        <KpiCard
          icon="e-icons e-wallet"
          label="Total Balance"
          value={formatCurrency(totalBalance)}
          tone="accent"
        />
        <KpiCard
          icon="e-icons e-arrow-down"
          label="Ledger Debits"
          value={formatCurrency(totalDebits)}
          tone="loss"
          hint={`${ledger.length} entries`}
        />
        <KpiCard
          icon="e-icons e-arrow-up"
          label="Ledger Credits"
          value={formatCurrency(totalCredits)}
          tone="gain"
        />
      </section>

      <div className="page-toolbar">
        <div className="tab-switch" role="tablist" aria-label="Accounting view">
          <button
            role="tab"
            aria-selected={view === 'accounts'}
            className={`tab-btn${view === 'accounts' ? ' active' : ''}`}
            onClick={() => setView('accounts')}
          >
            Accounts
          </button>
          <button
            role="tab"
            aria-selected={view === 'ledger'}
            className={`tab-btn${view === 'ledger' ? ' active' : ''}`}
            onClick={() => setView('ledger')}
          >
            General Ledger
          </button>
        </div>
      </div>

      {view === 'accounts' ? (
        <section className="card">
          <h2 className="section-title">Accounts</h2>
          <GridComponent
            dataSource={accounts}
            allowPaging={true}
            pageSettings={{ pageSize: 10 }}
            allowSorting={true}
            allowFiltering={true}
          >
            <ColumnsDirective>
              <ColumnDirective field="name" headerText="Account" width="200" />
              <ColumnDirective field="accountType" headerText="Type" width="150" />
              <ColumnDirective field="institution" headerText="Institution" width="180" />
              <ColumnDirective field="currency" headerText="Currency" width="110" />
              <ColumnDirective field="currentBalance" headerText="Balance" width="150" textAlign="Right" format="C2" />
            </ColumnsDirective>
            <Inject services={[Page, Sort, Filter]} />
          </GridComponent>
        </section>
      ) : (
        <section className="card">
          <h2 className="section-title">General Ledger</h2>
          <GridComponent
            dataSource={ledger}
            allowPaging={true}
            pageSettings={{ pageSize: 15 }}
            allowSorting={true}
            allowFiltering={true}
          >
            <ColumnsDirective>
              <ColumnDirective field="entryDate" headerText="Date" width="130" format="yMd" />
              <ColumnDirective field="accountCode" headerText="Code" width="100" />
              <ColumnDirective field="account" headerText="Account" width="180" />
              <ColumnDirective field="description" headerText="Description" width="260" />
              <ColumnDirective field="debit" headerText="Debit" width="120" textAlign="Right" format="C2" />
              <ColumnDirective field="credit" headerText="Credit" width="120" textAlign="Right" format="C2" />
            </ColumnsDirective>
            <Inject services={[Page, Sort, Filter]} />
          </GridComponent>
        </section>
      )}
    </div>
  );
}
