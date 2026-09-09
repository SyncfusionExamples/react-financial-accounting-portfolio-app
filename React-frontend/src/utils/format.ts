/** Shared display formatters for money and percentages. */

export function formatCurrency(
  value: number | undefined | null,
  options?: Intl.NumberFormatOptions,
): string {
  if (value == null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
    ...options,
  }).format(value);
}

export function formatPercent(value: number | undefined | null): string {
  if (value == null) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function formatSignedCurrency(value: number | undefined | null): string {
  if (value == null) return '—';
  const formatted = formatCurrency(value, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
  return value > 0 ? `+${formatted}` : formatted;
}

/**
 * Parses ISO date strings from the API into Date objects (for Syncfusion grid
 * columns with type="datetime"). Returns '' for missing/invalid values so the
 * grid's ValueAccessor (which requires an Object) stays type-safe.
 */
export function parseDate(value: unknown): Date | string {
  if (value == null || value === '') return '';
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? '' : d;
}
