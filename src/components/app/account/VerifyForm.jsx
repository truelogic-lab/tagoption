import React, { useEffect, useState } from "react";
import { accountApi } from "../../../lib/api";

/**
 * Identity verification.
 *
 * Reads the current status on mount so a reload does not reset what the user
 * already submitted. The backend stores the submission and marks it pending;
 * approval is manual. Copy is written to match that — no automated SLA.
 */
const STATUS_COPY = {
  none:     { label: "Not submitted",   tone: "idle" },
  pending:  { label: "Pending review",  tone: "wait" },
  approved: { label: "Verified",        tone: "ok"   },
  rejected: { label: "Rejected",        tone: "err"  },
};

export default function VerifyForm() {
  const [status, setStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await accountApi.verification();
        if (cancelled) return;
        setStatus(res?.status || "none");
      } catch {
        if (!cancelled) setStatus("none");
      } finally {
        if (!cancelled) setLoadingStatus(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const submit = async () => {
    setErr("");
    setSubmitting(true);
    try {
      const res = await accountApi.submitKYC({});
      setStatus(res?.status || "pending");
    } catch (e) {
      setErr(e?.message || "Could not submit verification");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingStatus) {
    return (
      <div className="account-form">
        <p className="account-form__note">Loading verification status…</p>
      </div>
    );
  }

  const meta = STATUS_COPY[status] || STATUS_COPY.none;
  const canSubmit = status === "none" || status === "rejected";

  return (
    <div className="account-form">
      <div className={`account-form__status account-form__status--${meta.tone}`}>
        {meta.label}
      </div>

      <p className="account-form__note">
        {status === "pending"
          ? "A team member is reviewing your submission. You will be notified when it's complete."
          : status === "approved"
            ? "Your identity is verified. No further action is required."
            : status === "rejected"
              ? "Your previous submission was not accepted. You can submit again."
              : "Submit your identity for review. A team member checks each submission manually and will notify you when it's complete."}
      </p>

      {canSubmit && (
        <button
          className="btn btn-blue account-form__submit"
          onClick={submit}
          disabled={submitting}
        >
          {submitting ? "Submitting…" : status === "rejected" ? "Resubmit" : "Start verification"}
        </button>
      )}

      {err && <div className="account-form__msg account-form__msg--err">{err}</div>}
    </div>
  );
}
