import React, { useEffect, useState } from "react";
import {
  LuUsers, LuActivity, LuDollarSign,
} from "react-icons/lu";
import { adminApi } from "../../lib/api";

function money(n) { return `$${Number(n || 0).toFixed(2)}`; }

export default function Overview() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    let stopped = false;
    const load = async () => {
      try {
        const d = await adminApi.overview();
        if (!stopped) { setData(d); setErr(""); }
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
