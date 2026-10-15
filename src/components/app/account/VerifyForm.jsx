import React, { useState } from "react";
import { accountApi } from "../../../lib/api";

/**
 * Identity verification. The backend stores the submission and marks it
 * pending; approval is a manual admin action. Copy reflects that — no
 * automated SLA is promised because none exists.
 */
export default function VerifyForm() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    setErr("");
    setLoading(true);
    try {
      await accountApi.submitKYC({});
      setSent(true);
    } catch (e) {
      setErr(e?.message || "Could not submit verification");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="account-form">
      <p className="account-form__note">
        Submit your identity for review. A team member checks each submission
        manually and will notify you when it's complete.
      </p>

      {sent ? (
        <div className="account-form__status account-form__status--ok">
          Submitted. Verification is pending review.
        </div>
      ) : (
        <button className="btn btn-blue account-form__submit" onClick={submit} disabled={loading}>
          {loading ? "Submitting…" : "Start verification"}
        </button>
      )}

      {err && <div className="account-form__msg account-form__msg--err">{err}</div>}
    </div>
  );
}
