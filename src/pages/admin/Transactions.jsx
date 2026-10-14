import React, { useEffect, useState } from "react";
import { adminApi } from "../../lib/api";

function money(n) { return `$${Number(n || 0).toFixed(2)}`; }

export default function Transactions() {
  const [rows, setRows] = useState([]);
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try { setRows(await adminApi.transactions({ type, status, limit: 200 })); } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [type, status]); // eslint-disable-line

  return (
    <>
      <div className="adm__filters">
        {["all", "deposit", "withdraw", "trade-open", "trade-settle"].map((t) => (
          <button key={t} className={`adm__chip ${type === t ? "is-active" : ""}`} onClick={() => setType(t)}>{t}</button>
        ))}
      </div>
      <div className="adm__filters">
        {["all", "pending", "completed", "failed"].map((s) => (
          <button key={s} className={`adm__chip ${status === s ? "is-active" : ""}`} onClick={() => setStatus(s)}>{s}</button>
        ))}
      </div>

      {loading ? <div className="adm__loading">Loading…</div> : (
        <div className="adm__table">
          <div className="adm__row adm__row--head">
            <span>User</span><span>Type</span><span>Amount</span><span>Method</span><span>Status</span><span />
          </div>
          {rows.map((t) => (
            <div className="adm__row" key={t.id}>
              <span className="adm__cell-email">{t.email}</span>
              <span data-label="Type">{t.type}</span>
              <span data-label="Amount" className={t.amount >= 0 ? "adm__pos" : "adm__neg"}>
                {money(t.amount)}
              </span>
              <span data-label="Method">{t.method || "—"}</span>
              <span data-label="Status">{t.status}</span>
              <span data-label="Ref" className="adm__cell-mono">{t.id.slice(-8)}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
