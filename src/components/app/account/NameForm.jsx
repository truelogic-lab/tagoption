import React, { useState } from "react";
import { accountApi } from "../../../lib/api";

/**
 * Profile form. The server returns the updated user as flat fields —
 * { id, email, name, role, ... } — not nested under `user`. Do not read
 * res.user.name; that was the earlier bug and it reported failure on a
 * successful update.
 */
export default function NameForm({ initialName, initialEmail, onSaved }) {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    setErr("");
    try {
      const res = await accountApi.updateProfile({ name, email });

      // Persist to the local session so the header and drawer show the
      // new values without a reload.
      try {
        const raw = localStorage.getItem("tagoption.session");
        if (raw) {
          const s = JSON.parse(raw);
          s.user = {
            ...s.user,
            name: res?.name ?? name,
            email: res?.email ?? email,
          };
          localStorage.setItem("tagoption.session", JSON.stringify(s));
        }
      } catch {
        // Session write failing must not be reported as a profile failure.
      }

      setMsg("Profile updated.");
      onSaved?.(res);
      setTimeout(() => setMsg(""), 1800);
    } catch (e) {
      setErr(e.message || "Could not update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="account-form" onSubmit={submit}>
      <label className="account-form__field">
        <span>Full name</span>
        <input value={name} onChange={(e) => setName(e.target.value)} required />
      </label>
      <label className="account-form__field">
        <span>Email address</span>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </label>
      {msg && <div className="account-form__msg">{msg}</div>}
      {err && <div className="account-form__msg account-form__msg--err">{err}</div>}
      <button className="btn btn-blue account-form__submit" type="submit" disabled={saving}>
        {saving ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
