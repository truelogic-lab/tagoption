import React, { useEffect, useState } from "react";
import { adminApi } from "../../lib/api";
import Spinner from "../../components/ui/Spinner";

export default function Audit() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await adminApi.audit();
        const list = Array.isArray(data) ? data : Array.isArray(data?.rows) ? data.rows : [];
        if (!cancelled) setRows(list);
      } catch (e) {
        if (!cancelled) setError(e.message || "Failed to load audit log");
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="adm-page">
      <div className="adm-hero adm-hero--compact">
        <div>
          <h1 className="adm-hero__title">Audit log</h1>
          <p className="adm-hero__sub">
            {rows.length} action{rows.length === 1 ? "" : "s"} recorded
          </p>
        </div>
      </div>

      {loading ? (
        <div className="loading">
          <Spinner size="md" tone="muted" />
          <span>Loading audit log…</span>
        </div>
      ) : error ? (
        <div className="adm-state">{error}</div>
      ) : rows.length === 0 ? (
        <div className="adm-state">No admin actions yet.</div>
      ) : (
        <div className="adm-rows">
          {rows.map((a) => (
            <article className="adm-audit" key={a.id}>
              <header className="adm-audit__head">
                <span className="adm-audit__actor">{a.adminEmail || a.actorEmail || "—"}</span>
                <span className="adm-audit__action">{a.action}</span>
              </header>
              <div className="adm-audit__grid">
                <Field label="Target" value={a.targetId?.slice(-12) || "—"} />
                <Field label="When"   value={new Date(a.at).toLocaleString()} />
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div className="adm-field">
      <span className="adm-field__label">{label}</span>
      <span className="adm-field__value">{value}</span>
    </div>
  );
}
