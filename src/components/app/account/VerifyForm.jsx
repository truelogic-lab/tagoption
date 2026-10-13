import React, { useState } from "react";
import { accountApi } from "../../../lib/api";

export default function VerifyForm() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      await accountApi.submitKYC({});
      setSent(true);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="account-form">
      <p className="account-form__note">
        Upload a government-issued ID (passport, driver's licence, or national ID)
        and a clear selfie. Verification usually completes within 24 hours.
      </p>

      {sent ? (
        <div className="account-form__status account-form__status--ok">
          Documents submitted. We'll email you once verification is complete.
        </div>
      ) : (
        <button className="btn btn-blue account-form__submit" onClick={submit} disabled={loading}>
          {loading ? "Submitting…" : "Start verification"}
        </button>
      )}
    </div>
  );
}
