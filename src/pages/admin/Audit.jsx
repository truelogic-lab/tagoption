import React, { useEffect, useState } from "react";
import { adminApi } from "../../lib/api";
import Spinner from "../../components/ui/Spinner";

export default function Audit() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await adminApi.audit();
        setRows(data);
      } catch {}
      setLoading(false);
    })();
  }, []);

  return (
    <div className="adm-page">
      <div className="adm-page__head">
        <h1 className="adm-page__title">Audit log</h1>
        <p className="adm-page__sub">
          {rows.length} action{rows.length === 1 ? "" : "s"} recorded
        </p>
      </div>

      {loading ? (
        <div className="loading"><Spinner size="md" tone="muted" /><span>Loading audit log…</span></div>
      ) : rows.length === 0 ? (
        <div className="adm-state">No admin actions yet.</div>
      ) : (
        <div className="adm-list">
          {rows.map((a) => (
            <article className="adm-item" key={a.id}>
              <header className="adm-item__head">
                <span className="adm-item__email">{a.adminEmail}</span>
                <span className="adm-item__action">{a.action}</span>
              </header>

              <div className="adm-item__grid">
                <Field label="Target"  value={a.targetId?.slice(-12) || "—"} />
                <Field label="When"    value={new Date(a.at).toLocaleString()} />
                {a.payload && (
                  <Field label="Payload" value={JSON.stringify(a.payload)} />
                )}
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
