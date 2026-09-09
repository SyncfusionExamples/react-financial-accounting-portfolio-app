import { formatSignedCurrency } from '../utils/format';

/**
 * Shared metric card used by Dashboard, Portfolio, and Analytics.
 *
 * Simpler look: a soft icon chip + label on top, big number, and an
 * optional trend pill. A colored top accent (tone) gives each card a
 * quiet identity without extra chrome.
 */

export type KpiTone = 'accent' | 'gain' | 'loss' | 'info';

export interface KpiCardProps {
  /** Icon class from the Syncfusion "e-icons" font. */
  icon: string;
  label: string;
  value: string;
  tone?: KpiTone;
  /** Trend line under the value, e.g. "+2.4% this month". */
  hint?: string;
  /** Numeric gain/loss; rendered as a signed pill when provided. */
  change?: number;
}

export default function KpiCard({
  icon,
  label,
  value,
  tone = 'accent',
  hint,
  change,
}: KpiCardProps) {
  const hasChange = typeof change === 'number' && change !== 0;
  const changeDirection = hasChange ? (change! > 0 ? 'up' : 'down') : null;

  return (
    <article className={`kpi-card tone-${tone}`}>
      <div className="kpi-head">
        <span className="kpi-icon" aria-hidden="true">
          <i className={icon} />
        </span>
        <span className="kpi-label">{label}</span>
      </div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-foot">
        {hasChange && (
          <span className={`kpi-trend ${changeDirection}`}>
            <i
              className={
                changeDirection === 'up' ? 'e-icons e-arrow-up' : 'e-icons e-arrow-down'
              }
              aria-hidden="true"
            />
            {formatSignedCurrency(Math.abs(change!))}
          </span>
        )}
        {hint && <span className="kpi-hint">{hint}</span>}
      </div>
    </article>
  );
}