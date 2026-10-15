import { LuTriangleAlert, LuX } from "react-icons/lu";

/**
 * Single error strip for the trade page. Sources are passed in as an array
 * of { label, message, clear } — a source without a clear callback is not
 * dismissible because its state is derived, not owned.
 */
export default function TradeErrorBanner({ sources = [] }) {
  const active = sources.filter((s) => s.message);
  if (!active.length) return null;

  const primary = active[0];

  return (
    <div className="trade-error" role="alert">
      <LuTriangleAlert />
      <div>
        <strong>{primary.label}</strong>
        <span>{primary.message}</span>
      </div>
      {primary.clear && (
        <button
          className="trade-error__dismiss"
          onClick={primary.clear}
          aria-label="Dismiss error"
        >
          <LuX />
        </button>
      )}
    </div>
  );
}
