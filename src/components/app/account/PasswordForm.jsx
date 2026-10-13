import React, { useState } from "react";
import { accountApi } from "../../../lib/api";

export default function PasswordForm() {
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    setErr("");
    if (form.next.length < 6) return setErr("New password must be at least 6 characters.");
    if (form.next !== form.confirm) return setErr("Passwords don't match.");

    setSaving(true);
    try {
      await accountApi.changePassword({ current: form.current, next: form.next });
      setMsg("Password changed.");
      setForm({ current: "", next: "", confirm: "" });
      setTimeout(() => setMsg(""), 1800);
    } catch (e) {
      setErr(e.message || "Could not change password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="account-form" onSubmit={submit}>
      <label className="account-form__field">
        <span>Current password</span>
        <input type="password" value={form.current} onChange={update("current")} required />
      </label>
      <label className="account-form__field">
        <span>New password</span>
        <input type="password" value={form.next} onChange={update("next")} required />
      </label>
      <label className="account-form__field">
        <span>Confirm new password</span>
        <input type="password" value={form.confirm} onChange={update("confirm")} required />
      </label>
      {msg && <div className="account-form__msg">{msg}</div>}
      {err && <div className="account-form__msg account-form__msg--err">{err}</div>}
      <button className="btn btn-blue account-form__submit" type="submit" disabled={saving}>
        {saving ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
