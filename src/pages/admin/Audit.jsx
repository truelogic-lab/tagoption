import React, { useEffect, useState } from "react";
import { adminApi } from "../../lib/api";

export default function Audit() {
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
        <span>Admin</span><span>Action</span><span>Target</span><span>Payload</span><span>When</span>
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
