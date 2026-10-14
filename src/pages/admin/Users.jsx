import React, { useEffect, useState } from "react";
import { adminApi } from "../../lib/api";

function money(n) { return `$${Number(n || 0).toFixed(2)}`; }

export default function Users() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);

  const load = async (query = "") => {
    setLoading(true);
    try {
      const d = await adminApi.users(query ? { q: query } : {});
      setRows(d);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const adjust = async (u) => {
    const raw = window.prompt(`Adjust balance for ${u.email}\n+100 credits $100, -50 debits $50`, "10");
    if (raw === null) return;
    const amount = Number(raw);
    if (!Number.isFinite(amount) || amount === 0) return;
    const reason = window.prompt("Reason (for audit log)", "Manual adjustment");
    if (!reason) return;
    setActing(u.id);
    try {
      await adminApi.adjust(u.id, amount, reason);
      await load(q);
    } catch (e) { alert(e.message || "Failed"); }
    setActing(null);
  };

  return (
    <>
      <div className="adm__search">
        <input
          type="text"
          placeholder="Search email, name, or user id"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load(q)}
        />
        <button className="btn btn-blue" onClick={() => load(q)}>Search</button>
      </div>

      {loading ? <div className="adm__loading">Loading…</div> : (
        <div className="adm__table">
          <div className="adm__row adm__row--head">
            <span>Email</span><span>Name</span><span>Balance</span><span>Volume</span><span />
          </div>
          {rows.map((u) => (
            <div className="adm__row" key={u.id}>
              <span className="adm__cell-email">{u.email}</span>
              <span data-label="Name">{u.name}</span>
              <span data-label="Balance">{money(u.balance)}</span>
              <span data-label="Volume">{money(u.volume)}</span>
              <span className="adm__row-actions">
                <button className="adm__btn" onClick={() => adjust(u)} disabled={acting === u.id}>
                  Adjust
                </button>
              </span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
