import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { LuCheck, LuClock, LuX, LuArrowRight } from "react-icons/lu";
import { paymentsApi } from "../../lib/api";
import { celebrateDeposit } from "../../lib/celebrate";

const MAX_ATTEMPTS = 20;
const POLL_MS = 3000;

export default function PaymentCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("pending");
  const [amount, setAmount] = useState(null);
  const [reference, setReference] = useState(null);

  const trackingId =
    params.get("OrderTrackingId") ||
    params.get("orderTrackingId") ||
    params.get("pesapal_transaction_tracking_id");

  useEffect(() => {
    if (!trackingId) {
      setStatus("failed");
      return;
    }

    let stopped = false;
    let attempts = 0;

    const poll = async () => {
      if (stopped) return;
      try {
        const s = await paymentsApi.status(trackingId);
        if (stopped) return;

        setAmount(s?.amount ?? null);
        setReference(s?.reference ?? null);
        setStatus(s?.status || "pending");

        if (s?.status === "completed") {
          celebrateDeposit({ amount: s.amount ?? 0, method: "Pesapal" });
          return;
        }
        if (s?.status === "failed") return;
      } catch {
        // Network blip — fall through to retry.
      }

      attempts += 1;
      if (attempts < MAX_ATTEMPTS) setTimeout(poll, POLL_MS);
    };

    poll();
    return () => { stopped = true; };
  }, [trackingId]);

  const meta = {
    completed: {
      tone: "ok",
      Icon: LuCheck,
      title: "Deposit confirmed",
      sub: "Your balance has been updated.",
    },
    failed: {
      tone: "err",
      Icon: LuX,
      title: "Deposit failed",
      sub: "Nothing was charged. Try again, or contact support if the issue persists.",
    },
    pending: {
      tone: "wait",
      Icon: LuClock,
      title: "Confirming deposit",
      sub: "This usually takes a few seconds. Keep this page open.",
    },
  }[status] || {
    tone: "wait",
    Icon: LuClock,
    title: "Confirming deposit",
    sub: "This usually takes a few seconds. Keep this page open.",
  };

  const { Icon } = meta;

  return (
    <div className={`callback callback--${meta.tone}`}>
      <div className="callback__icon">
        <Icon />
      </div>

      <h1 className="callback__title">{meta.title}</h1>
      <p className="callback__sub">{meta.sub}</p>

      {amount != null && (
        <div className="callback__amount">
          <span>Amount</span>
          <strong>${Number(amount).toFixed(2)}</strong>
        </div>
      )}

      {reference && (
        <div className="callback__ref">
          Reference <code>{reference}</code>
        </div>
      )}

      <button className="callback__btn" onClick={() => navigate("/trade")}>
        Back to trading <LuArrowRight />
      </button>

      <button
        className="callback__secondary"
        onClick={() => navigate("/history")}
      >
        View in history
      </button>
    </div>
  );
}
