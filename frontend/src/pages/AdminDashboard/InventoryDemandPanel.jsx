import { BACKEND_URL } from '../../api';
import { useCallback, useEffect, useState } from 'react';
import { Activity, ChevronDown, RefreshCw } from 'lucide-react';

const FORECAST_URL = `${BACKEND_URL}/api/v1/inventory/forecast`;

const statusLabels = {
  reorder_now: 'Below reorder line',
  threshold_not_configured: 'Set reorder line',
  collecting_history: 'Collecting usage',
  trend_available: 'Trend available',
};

export default function InventoryDemandPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadForecast = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(FORECAST_URL);
      if (!response.ok) throw new Error(`Forecast request failed (${response.status})`);
      const data = await response.json();
      setItems(data.items || []);
    } catch (requestError) {
      setError(requestError.message || 'Unable to load inventory signals.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) loadForecast();
  }, [isOpen, loadForecast]);

  return (
    <section className="border border-[var(--border)] rounded">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls="inventory-demand-content"
        onClick={() => setIsOpen(open => !open)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-[var(--bg-panel-raised)]"
      >
        <span className="flex min-w-0 items-center gap-2">
          <Activity size={15} className="shrink-0 text-[var(--accent-primary)]" />
          <span className="text-xs font-semibold text-[var(--text-primary)]">Inventory demand signals</span>
          <span className="hidden text-[10px] text-[var(--text-secondary)] sm:inline">Optional planning reference</span>
        </span>
        <ChevronDown size={15} className={`shrink-0 text-[var(--text-secondary)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && <div id="inventory-demand-content" className="border-t border-[var(--border)] px-4 py-4">
       <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <button
          type="button"
          onClick={loadForecast}
          disabled={loading}
          aria-label="Refresh inventory demand signals"
          className="inline-flex items-center gap-2 border border-[var(--border)] px-3 py-2 text-xs text-[var(--text-secondary)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
       </div>

      {error ? (
        <p role="alert" className="text-xs text-[var(--critical)]">{error}</p>
      ) : loading && items.length === 0 ? (
        <p className="text-xs text-[var(--text-secondary)]">Loading stock signals...</p>
      ) : items.length === 0 ? (
        <p className="text-xs text-[var(--text-secondary)]">No stock snapshots yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--text-secondary)] uppercase">
                <th className="py-2 pr-4 font-semibold">Base / item</th>
                <th className="py-2 pr-4 font-semibold">Stock</th>
                <th className="py-2 pr-4 font-semibold">Reorder line</th>
                <th className="py-2 pr-4 font-semibold">Consumption</th>
                <th className="py-2 pr-4 font-semibold">Estimated run-out</th>
                <th className="py-2 font-semibold">Planning signal</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={`${item.station}-${item.item_id}`} className="border-b border-[var(--border)]/60 last:border-0">
                  <td className="py-2.5 pr-4">
                    <span className="block text-[var(--text-primary)] font-semibold">{item.name}</span>
                    <span className="text-[var(--text-secondary)]">{item.station}</span>
                  </td>
                  <td className="py-2.5 pr-4 text-[var(--text-primary)]">
                    {Number(item.current_stock).toLocaleString()} {item.unit}
                  </td>
                  <td className="py-2.5 pr-4 text-[var(--text-secondary)]">
                    {item.critical_threshold === null ? 'Not set' : `${Number(item.critical_threshold).toLocaleString()} ${item.unit}`}
                  </td>
                  <td className="py-2.5 pr-4 text-[var(--text-secondary)]">
                    {item.average_daily_consumption === null
                      ? `${item.usage_event_count} uses · ${item.history_days}d history`
                      : `~${item.average_daily_consumption.toFixed(2)} ${item.unit}/day`}
                  </td>
                  <td className="py-2.5 pr-4 text-[var(--text-secondary)]">
                    {item.days_until_stockout === null ? 'Collecting history' : `~${Math.ceil(item.days_until_stockout)} days`}
                  </td>
                  <td className={`py-2.5 font-semibold ${item.status === 'reorder_now' ? 'text-[var(--critical)]' : 'text-[var(--accent-primary)]'}`}>
                    {statusLabels[item.status] || item.status}
                    {item.days_until_threshold !== null && <span className="block font-normal text-[var(--text-secondary)]">Threshold in ~{Math.ceil(item.days_until_threshold)}d</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-3 text-[10px] text-[var(--text-secondary)]">
        Baseline only · no trained demand forecast.
      </p>
      </div>}
    </section>
  );
}