import React, { useState } from "react";
import { LuCheck } from "react-icons/lu";
import PageShell from "../components/layout/PageShell";

export default function LiveChat() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <PageShell
      eyebrow="Live Chat"
      title="Talk to a human."
      lead="Average reply time: under 3 minutes, 24 hours a day. Drop a message and we'll pick it up right away."
    >
      <section className="page__section">
        <div className="container">
          {sent ? (
            <div className="form" style={{ alignItems: "center", textAlign: "center" }}>
              <div style={{
                width: 56, height: 56, borderRadius: "50%",
                display: "grid", placeItems: "center",
                background: "rgba(34,197,94,.12)", color: "#22c55e",
                fontSize: 26, marginBottom: 8,
              }}>
                <LuCheck />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800 }}>Message sent</h2>
              <p style={{ color: "var(--text-2)", fontSize: 14 }}>
                We'll reply to {form.email} shortly.
              </p>
            </div>
          ) : (
            <form className="form" onSubmit={submit}>
              <label className="form__field">
                <span className="form__label">Your name</span>
                <input
                  className="form__input"
                  type="text"
                  placeholder="Warren Musungu"
                  value={form.name}
                  onChange={update("name")}
                  required
                />
              </label>

              <label className="form__field">
                <span className="form__label">Email address</span>
                <input
                  className="form__input"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={update("email")}
                  required
                />
              </label>

              <label className="form__field">
                <span className="form__label">Message</span>
                <textarea
                  className="form__textarea"
                  placeholder="How can we help?"
                  value={form.message}
                  onChange={update("message")}
                  required
                />
              </label>

              <button type="submit" className="btn btn-primary" style={{ alignSelf: "flex-start" }}>
                Send Message
              </button>
            </form>
          )}
        </div>
      </section>
    </PageShell>
  );
}
