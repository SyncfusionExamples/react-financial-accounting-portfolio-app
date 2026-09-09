import { useState } from 'react';
import {
  useGetTransactionsQuery,
  useCreateTransactionMutation,
  useGetAccountsQuery,
} from '../api/apiSlice';
import type { TransactionType } from '../api/types';
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
import { ButtonComponent } from '@syncfusion/ej2-react-buttons';
import { DialogComponent } from '@syncfusion/ej2-react-popups';
import { DropDownListComponent } from '@syncfusion/ej2-react-dropdowns';
import { NumericTextBoxComponent, TextBoxComponent } from '@syncfusion/ej2-react-inputs';
import { formatCurrency, parseDate } from '../utils/format';

const TRANSACTION_TYPES: { text: string; value: TransactionType }[] = [
  { text: 'Buy', value: 'Buy' },
  { text: 'Sell', value: 'Sell' },
  { text: 'Deposit', value: 'Deposit' },
  { text: 'Withdrawal', value: 'Withdrawal' },
  { text: 'Transfer In', value: 'TransferIn' },
  { text: 'Transfer Out', value: 'TransferOut' },
  { text: 'Income', value: 'Income' },
  { text: 'Expense', value: 'Expense' },
];

export default function Transactions() {
  const { data: transactions = [], isLoading } = useGetTransactionsQuery();
  const { data: accounts = [] } = useGetAccountsQuery();
  const [createTransaction] = useCreateTransactionMutation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    type: 'Deposit' as TransactionType,
    accountId: 0,
    symbol: '',
    quantity: 0,
    amount: 0,
    transactionDate: new Date().toISOString().slice(0, 10),
    notes: '',
  });

  async function handleSubmit() {
    setSaving(true);
    try {
      await createTransaction({
        transactionDate: form.transactionDate,
        type: form.type,
        accountId: form.accountId,
        accountName: accounts.find((a) => a.id === form.accountId)?.name,
        symbol: form.symbol || undefined,
        quantity: form.quantity || undefined,
        amount: form.amount,
        status: 'Completed',
        notes: form.notes || undefined,
      }).unwrap();
      setDialogOpen(false);
      resetForm();
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setForm({
      type: 'Deposit',
      accountId: accounts[0]?.id ?? 0,
      symbol: '',
      quantity: 0,
      amount: 0,
      transactionDate: new Date().toISOString().slice(0, 10),
      notes: '',
    });
  }

  const accountOptions = accounts.map((a) => ({ text: a.name, value: a.id }));

  if (isLoading) return <div className="state-msg">Loading transactions…</div>;

  // Cash-flow rollups for the summary cards
  const inflow = transactions
    .filter((t) => t.type === 'Deposit' || t.type === 'Income' || t.type === 'TransferIn')
    .reduce((sum, t) => sum + t.amount, 0);
  const outflow = transactions
    .filter((t) => t.type === 'Withdrawal' || t.type === 'Expense' || t.type === 'TransferOut')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="page">
      <h1 className="page-title">Transaction Management</h1>
      <p className="page-subtitle">
        Buy/sell trades, deposits, withdrawals, and account transfers.
      </p>

      <section aria-label="Transaction summary" className="kpi-grid">
        <KpiCard
          icon="e-icons e-swap-arrow"
          label="Transactions"
          value={String(transactions.length)}
          tone="info"
        />
        <KpiCard
          icon="e-icons e-arrow-up"
          label="Total Inflow"
          value={formatCurrency(inflow)}
          tone="gain"
        />
        <KpiCard
          icon="e-icons e-arrow-down"
          label="Total Outflow"
          value={formatCurrency(outflow)}
          tone="loss"
        />
      </section>

      <div className="page-toolbar">
        <div className="toolbar-hint">
          {transactions.length} transactions
        </div>
        <ButtonComponent
          cssClass="e-primary"
          iconCss="e-icons e-plus"
          onClick={() => {
            resetForm();
            setDialogOpen(true);
          }}
        >
          New Transaction
        </ButtonComponent>
      </div>

      <section className="card">
        <GridComponent
          dataSource={transactions}
          allowPaging={true}
          pageSettings={{ pageSize: 12 }}
          allowSorting={true}
          allowFiltering={true}
        >
          <ColumnsDirective>
            <ColumnDirective field="transactionDate" headerText="Date" width="130" type="datetime" format="yMd" valueAccessor={(field, data) => parseDate((data as Record<string, unknown>)[field])} />
            <ColumnDirective field="type" headerText="Type" width="130" />
            <ColumnDirective field="accountName" headerText="Account" width="170" />
            <ColumnDirective field="symbol" headerText="Symbol" width="110" />
            <ColumnDirective field="quantity" headerText="Qty" width="100" textAlign="Right" format="N4" />
            <ColumnDirective field="amount" headerText="Amount" width="130" textAlign="Right" format="C2" />
            <ColumnDirective field="status" headerText="Status" width="120" />
            <ColumnDirective field="notes" headerText="Notes" width="220" />
          </ColumnsDirective>
          <Inject services={[Page, Sort, Filter]} />
        </GridComponent>
      </section>

      <DialogComponent
        id="new-transaction-dialog"
        header="New Transaction"
        isModal={true}
        visible={dialogOpen}
        width="420px"
        showCloseIcon={true}
        close={() => setDialogOpen(false)}
        buttons={[
          {
            click: handleSubmit,
            buttonModel: { content: 'Save', isPrimary: true, disabled: saving },
          },
          { click: () => setDialogOpen(false), buttonModel: { content: 'Cancel' } },
        ]}
      >
        <form
          className="form-stack"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <label className="form-field">
            <span>Type</span>
            <DropDownListComponent
              dataSource={TRANSACTION_TYPES}
              fields={{ text: 'text', value: 'value' }}
              value={form.type}
              change={(e: { value?: string }) =>
                setForm((f) => ({ ...f, type: (e.value ?? 'Deposit') as TransactionType }))
              }
            />
          </label>

          <label className="form-field">
            <span>Account</span>
            <DropDownListComponent
              dataSource={accountOptions}
              fields={{ text: 'text', value: 'value' }}
              value={form.accountId}
              change={(e: { value?: number }) =>
                setForm((f) => ({ ...f, accountId: e.value ?? accounts[0]?.id ?? 0 }))
              }
            />
          </label>

          {(form.type === 'Buy' || form.type === 'Sell') && (
            <>
              <label className="form-field">
                <span>Symbol</span>
                <TextBoxComponent
                  placeholder="e.g. AAPL"
                  value={form.symbol}
                  input={(e) => setForm((f) => ({ ...f, symbol: e.value ?? '' }))}
                />
              </label>
              <label className="form-field">
                <span>Quantity</span>
                <NumericTextBoxComponent
                  value={form.quantity}
                  min={0}
                  decimals={4}
                  change={(e) => setForm((f) => ({ ...f, quantity: e.value ?? 0 }))}
                />
              </label>
            </>
          )}

          <label className="form-field">
            <span>Amount (USD)</span>
            <NumericTextBoxComponent
              value={form.amount}
              min={0}
              decimals={2}
              format="C2"
              change={(e) => setForm((f) => ({ ...f, amount: e.value ?? 0 }))}
            />
          </label>

          <label className="form-field">
            <span>Notes</span>
            <TextBoxComponent
              placeholder="Optional note"
              value={form.notes}
              input={(e) => setForm((f) => ({ ...f, notes: e.value ?? '' }))}
            />
          </label>
        </form>
      </DialogComponent>
    </div>
  );
}
