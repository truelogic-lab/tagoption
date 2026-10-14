import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LuArrowLeft, LuUsers, LuActivity, LuDollarSign, LuShieldCheck, LuClock,
} from "react-icons/lu";
import { adminApi } from "../../lib/api";
import { getSession } from "../../lib/auth";

const TABS = [
  { id: "overview",      label: "Overview" },
  { id: "users",         label: "Users" },
  { id: "trades",        label: "Trades" },
  { id: "transactions",  label: "Transactions" },
  { id: "audit",         label: "Audit" },
];

function money(n) {
  return `$${Number(n || 0).toFixed(2)}`;
}

export default function Admin() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("overview");

  // Guard: only reachable if logged in. The API will 403 non-admins.
  useEffect(() => {
    if (!getSession()) navigate("/auth", { replace: true });
  }, [navigate]);

  return (
    <div className="adm">
      <div className="adm__head">
        <Link to="/trade" className="adm__back">
          <LuArrowLeft /> Back
        </Link>
        <span className="adm__badge">
          <LuShieldCheck /> Admin
        </span>
      </div>

      <div className="adm__tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`adm__tab ${tab === t.id ? "is-active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && <Overview />}
      {tab === "users" && <Users />}
      {tab === "trades" && <Trades />}
      {tab === "transactions" && <Transactions />}
      {tab === "audit" && <Audit />}
    </div>
  );
}

/* -------------------- overview -------------------- */

function Overview() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    let stopped = false;
    const load = async () => {
      try {
        const d = await adminApi.overview();
        if (!stopped) setData(d);
      } catch (e) {
        if (!stopped) setErr(e.message || "Failed to load");
      }
    };
    load();
    const id = setInterval(load, 5000);
    return () => { stopped = true; clearInterval(id); };
  }, []);

  if (err) return <div className="adm__err">{err}</div>;
  if (!data) return <div className="adm__loading">Loading…</div>;

  return (
    <div className="adm__grid">
      <Card icon={<LuUsers />} label="Users" value={data.users} />
      <Card icon={<LuDollarSign />} label="User balances" value={money(data.totalUserBalance)} />
      <Card icon={<LuDollarSign />} label="Platform" value={money(data.totalPlatform)} />
      <Card icon={<LuDollarSign />} label="Escrow" value={money(data.totalEscrow)} />
      <Card icon={<LuActivity />} label="Volume" value={money(data.totalVolume)} />
      <Card icon={<LuActivity />} label="Real edge" value={`${(data.edge * 100).toFixed(2)}%`} />
      <Card label="Open trades" value={data.trades.open} />
      <Card label="Won / Lost" value={`${data.trades.won} / ${data.trades.lost}`} />
      <Card label="Win rate" value={`${(data.winRate * 100).toFixed(1)}%`} />
      <Card label="Deposits" value={data.transactions.deposits} />
      <Card label="Withdrawals" value={data.transactions.withdrawals} />
      <Card label="Pending tx" value={data.transactions.pending} />
    </div>
  );
}

function Card({ icon, label, value }) {
  return (
    <div className="adm-card">
      {icon && <div className="adm-card__icon">{icon}</div>}
      <div className="adm-card__label">{label}</div>
      <div className="adm-card__value">{value}</div>
    </div>
  );
}

/* -------------------- users -------------------- */

function Users() {
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
    } catch (e) {
      alert(e.message || "Failed");
    }
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
              <span>{u.name}</span>
              <span>{money(u.balance)}</span>
              <span>{money(u.volume)}</span>
              <span>
                <button
                  className="adm__btn"
                  onClick={() => adjust(u)}
                  disabled={acting === u.id}
                >
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

/* -------------------- trades -------------------- */

function Trades() {
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
    try {
      await adminApi.forceSettle(t.id, result);
      await load();
    } catch (e) { alert(e.message || "Failed"); }
  };

  return (
    <>
      <div className="adm__filters">
        {["open", "won", "lost", "all"].map((s) => (
          <button
            key={s}
            className={`adm__chip ${status === s ? "is-active" : ""}`}
            onClick={() => setStatus(s)}
          >{s}</button>
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

/* -------------------- transactions -------------------- */

function Transactions() {
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
              <span>{t.type}</span>
              <span className={t.amount >= 0 ? "adm__pos" : "adm__neg"}>{money(t.amount)}</span>
              <span>{t.method || "—"}</span>
              <span>{t.status}</span>
              <span className="adm__cell-mono">{t.id.slice(-8)}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* -------------------- audit -------------------- */

function Audit() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { setRows(await adminApi.audit()); } catch {}
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="adm__loading">Loading…</div>;

  return (
    <div className="adm__table">
      <div className="adm__row adm__row--head">
        <span>Admin</span><span>Action</span><span>Target</span><span>Payload</span><span />
      </div>
      {rows.map((a) => (
        <div className="adm__row" key={a.id}>
          <span className="adm__cell-email">{a.adminEmail}</span>
          <span>{a.action}</span>
          <span className="adm__cell-mono">{a.targetId?.slice(-12) || "—"}</span>
          <span className="adm__cell-mono">{a.payload ? JSON.stringify(a.payload) : "—"}</span>
          <span className="adm__cell-mono">{new Date(a.at).toLocaleTimeString()}</span>
        </div>
      ))}
    </div>
  );
}
