import React, { useEffect, useState } from "react";
import { adminApi } from "../../lib/api";

function money(n) { return `$${Number(n || 0).toFixed(2)}`; }

export default function Trades() {
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("open");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try { setRows(await adminApi.trades({ status, limit: 200 })); } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [status]); // eslint-disable-line

  const forceSettle = async (t, result) => {
    if (!window.confirm(`Force-settle ${t.id} as ${result.toUpperCase()}?`)) return;
    try { await adminApi.forceSettle(t.id, result); await load(); }
    catch (e) { alert(e.message || "Failed"); }
  };

  return (
    <>
      <div className="adm__filters">
        {["open", "won", "lost", "all"].map((s) => (
          <button key={s} className={`adm__chip ${status === s ? "is-active" : ""}`} onClick={() => setStatus(s)}>
            {s}
          </button>
        ))}
      </div>

      {loading ? <div className="adm__loading">Loading…</div> : (
        <div className="adm__table">
          <div className="adm__row adm__row--head">
            <span>User</span><span>Market</span><span>Contract</span><span>Stake</span><span>Status</span><span />
          </div>
          {rows.map((t) => (
            <div className="adm__row" key={t.id}>
              <span className="adm__cell-email">{t.email}</span>
              <span>{t.market}</span>
              <span>{t.contract}{t.auto && " · auto"}</span>
              <span>{money(t.stake)}</span>
              <span>{t.status}</span>
              <span className="adm__row-actions">
                {t.status === "open" && (
                  <>
                    <button className="adm__btn adm__btn--ok" onClick={() => forceSettle(t, "won")}>Won</button>
                    <button className="adm__btn adm__btn--danger" onClick={() => forceSettle(t, "lost")}>Lost</button>
                  </>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
