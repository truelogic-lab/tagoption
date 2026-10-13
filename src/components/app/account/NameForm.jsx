import React, { useState } from "react";
import { accountApi } from "../../../lib/api";

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
      // Persist to the local session so the header shows the new name
      const raw = localStorage.getItem("tagoption.session");
      if (raw) {
        const s = JSON.parse(raw);
        s.user = { ...s.user, name: res.user.name, email: res.user.email };
        localStorage.setItem("tagoption.session", JSON.stringify(s));
      }
      setMsg("Profile updated.");
      onSaved?.(res.user);
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
