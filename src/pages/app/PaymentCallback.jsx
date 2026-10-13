import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { LuCheck, LuClock, LuX, LuArrowRight } from "react-icons/lu";
import { paymentsApi } from "../../lib/api";
import { celebrateDeposit } from "../../lib/celebrate";

export default function PaymentCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("pending");
  const [amount, setAmount] = useState(null);

  const trackingId = params.get("OrderTrackingId") || params.get("orderTrackingId");

  useEffect(() => {
    if (!trackingId) { setStatus("failed"); return; }

    let stopped = false;
    let attempts = 0;
    const maxAttempts = 20;   // ~1 minute of polling

    const poll = async () => {
      if (stopped) return;
      try {
        const s = await paymentsApi.status(trackingId);
        if (stopped) return;
        setAmount(s.amount ?? null);
        setStatus(s.status);
        if (s.status === "completed") {
          celebrateDeposit({ amount: s.amount ?? 0, method: "Pesapal" });
          return;
        }
        if (s.status === "failed") return;
      } catch {}
      attempts += 1;
      if (attempts < maxAttempts) setTimeout(poll, 3000);
    };
    poll();
    return () => { stopped = true; };
  }, [trackingId]);

  const meta = {
    completed: { Icon: LuCheck, tone: "ok", title: "Payment received", sub: "Your balance has been updated." },
    failed:    { Icon: LuX,     tone: "err", title: "Payment failed",  sub: "Nothing was charged. Try again or contact support." },
    pending:   { Icon: LuClock, tone: "wait", title: "Confirming payment", sub: "This can take a few seconds. Don't close the app." },
  }[status];

  return (
    <div className="callback">
      <div className={`callback__icon callback__icon--${meta.tone}`}>
        <meta.Icon />
      </div>
      <h1 className="callback__title">{meta.title}</h1>
      <p className="callback__sub">{meta.sub}</p>

      {amount != null && (
        <div className="callback__amount">
          <span>Amount</span>
          <strong>${amount.toFixed(2)}</strong>
        </div>
      )}

      <button className="btn btn-blue callback__btn" onClick={() => navigate("/trade")}>
        Back to trading <LuArrowRight />
      </button>
    </div>
  );
}
