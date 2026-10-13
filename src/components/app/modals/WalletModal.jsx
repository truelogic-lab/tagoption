import React, { useEffect, useRef, useState } from "react";
import {
  LuX, LuArrowLeft, LuSmartphone, LuCreditCard, LuArrowUpRight,
  LuTriangleAlert, LuExternalLink, LuCircleCheck, LuLoaderCircle,
} from "react-icons/lu";
import { paymentsApi } from "../../../lib/api";
import { celebrateDeposit } from "../../../lib/celebrate";

const METHODS = [
  { id: "M-Pesa",       label: "M-Pesa",       desc: "Instant mobile money",   tone: "blue",  icon: "phone" },
  { id: "Card",         label: "Card",         desc: "Visa, Mastercard",       tone: "blue",  icon: "card" },
  { id: "USDT (TRC20)", label: "USDT (TRC20)", desc: "Cryptocurrency",         tone: "green", icon: "usdt" },
];

export default function WalletModal({ open, mode, balance, onClose, onCompleted }) {
  const isDeposit = mode === "deposit";
  const [step, setStep] = useState("method");     // method | amount | waiting | done
  const [method, setMethod] = useState(null);
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [trackingId, setTrackingId] = useState(null);
  const [status, setStatus] = useState(null);     // pending | completed | failed

  const pollRef = useRef(null);
  const popupRef = useRef(null);

  // Reset on open
  useEffect(() => {
    if (open) {
      setStep("method");
      setMethod(null);
      setAmount("");
      setPhone("");
      setEmail("");
      setError("");
      setLoading(false);
      setTrackingId(null);
      setStatus(null);
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    }
  }, [open, mode]);

  // Stop polling on close
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  if (!open) return null;

  const close = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    onClose();
  };

  const pick = (m) => {
    setMethod(m);
    setStep("amount");
    setError("");
  };

  /** Poll the server for the payment's status. */
  const startPolling = (id) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const s = await paymentsApi.status(id);
        setStatus(s.status);
        if (s.status === "completed") {
          clearInterval(pollRef.current);
          pollRef.current = null;
          setStep("done");
          celebrateDeposit({ amount: s.amount ?? 0, method: method?.label ?? "Pesapal" });
          onCompleted?.();
        } else if (s.status === "failed") {
          clearInterval(pollRef.current);
          pollRef.current = null;
          setStep("done");
        }
      } catch {
        // silent retry
      }
    }, 3000);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    const value = Number(amount);
    if (!value || value < 10) { setError("Minimum deposit is $10"); return; }
    if (!isDeposit && value > balance) { setError("Amount exceeds your balance"); return; }
    if (isDeposit && method.id === "M-Pesa" && phone.replace(/\D/g, "").length < 9) {
      setError("Enter a valid M-Pesa phone number"); return;
    }

    setLoading(true);

    // Open the popup IMMEDIATELY — browsers block window.open if it isn't
    // called in the same tick as the user gesture.
    const popup = isDeposit
      ? window.open("", "pesapal-payment", "width=480,height=720")
      : null;
    popupRef.current = popup;

    try {
      if (isDeposit) {
        const res = await paymentsApi.startDeposit({
          amount: value,
          method: method.label,
          phone: phone || undefined,
          email: email || undefined,
        });
        if (!res?.redirectUrl) throw new Error("Pesapal did not return a redirect URL");

        // Navigate the already-open popup to Pesapal
        if (popup && !popup.closed) {
          popup.location.href = res.redirectUrl;
        } else {
          // Popup was blocked — fall back to redirecting the current tab
          window.location.href = res.redirectUrl;
          return;
        }

        setTrackingId(res.orderTrackingId);
        setStep("waiting");
        startPolling(res.orderTrackingId);
        return;
      }

      throw new Error("Withdrawals are processed manually. Contact support.");
    } catch (e) {
      if (popup && !popup.closed) popup.close();
      setError(e.message || "Something went wrong");
      setLoading(false);
    }
  };

  /* ---------- Renders ---------- */

  return (
    <div className="modal" onClick={close}>
      <div className="modal__panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal__head">
          {step === "amount" ? (
            <button className="modal__back" onClick={() => setStep("method")} aria-label="Back">
              <LuArrowLeft />
            </button>
          ) : <span className="modal__spacer" />}
          <h3 className="modal__title">{isDeposit ? "Deposit Funds" : "Withdraw Funds"}</h3>
          <button className="modal__close" onClick={close} aria-label="Close"><LuX /></button>
        </div>

        {step === "method" && (
          <>
            <p className="modal__lead">Balance: <strong>${balance.toFixed(2)}</strong></p>
            <div className="paylist">
              {METHODS.map((m) => {
                const Icon = m.icon === "usdt"
                  ? () => <span className="paylist__usdt">₮</span>
                  : m.icon === "card" ? LuCreditCard : LuSmartphone;
                return (
                  <button key={m.id} className="paylist__row" onClick={() => pick(m)} type="button">
                    <span className={`paylist__icon paylist__icon--${m.tone}`}><Icon /></span>
                    <div>
                      <strong>{m.label}</strong>
                      <em>{isDeposit ? m.desc : `Withdraw to ${m.label.toLowerCase()}`}</em>
                    </div>
                    <LuArrowUpRight className="paylist__arrow" />
                  </button>
                );
              })}
            </div>
            <div className="modal__trust">
              <span><i className="dot dot--blue" /> Secure</span>
              <span><i className="dot dot--blue" /> Instant</span>
              <span><i className="dot dot--blue" /> 24/7 Support</span>
            </div>
          </>
        )}

        {step === "amount" && method && (
          <form className="wallet-form" onSubmit={submit}>
            <div className="wallet-form__chosen">
              <span className={`paylist__icon paylist__icon--${method.tone}`}>
                {method.icon === "usdt"
                  ? <span className="paylist__usdt">₮</span>
                  : method.icon === "card" ? <LuCreditCard /> : <LuSmartphone />}
              </span>
              <div>
                <strong>{method.label}</strong>
                <em>via Pesapal</em>
              </div>
            </div>

            <label className="wallet-form__field">
              <span>Amount (USD)</span>
              <div className="wallet-form__input">
                <span className="wallet-form__cur">$</span>
                <input
                  type="number" inputMode="decimal" step="0.01" min={10}
                  placeholder="10.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  autoFocus
                  required
                />
              </div>
            </label>

            {method.id === "M-Pesa" && (
              <label className="wallet-form__field">
                <span>M-Pesa phone number</span>
                <input
                  type="tel" inputMode="tel" autoComplete="tel"
                  placeholder="2547XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="wallet-form__input-text"
                  required
                />
              </label>
            )}

            <label className="wallet-form__field">
              <span>Email (receipt)</span>
              <input
                type="email" inputMode="email" autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="wallet-form__input-text"
              />
            </label>

            {error && <div className="auth__error"><LuTriangleAlert /> {error}</div>}

            <button type="submit" className="btn btn-blue wallet-form__submit" disabled={loading}>
              {loading
                ? "Opening Pesapal…"
                : <>Deposit ${amount || 0} <LuExternalLink /></>}
            </button>

            <p className="wallet-form__note">
              Pesapal will open in a new window. Keep this tab open — your balance
              updates automatically once payment is confirmed.
            </p>
          </form>
        )}

        {step === "waiting" && (
          <div className="wallet-waiting">
            <LuLoaderCircle className="wallet-waiting__spin" />
            <h4 className="wallet-waiting__title">Waiting for confirmation</h4>
            <p className="wallet-waiting__text">
              Complete the payment in the Pesapal window. Your balance will update
              here automatically.
            </p>
            <button
              type="button"
              className="btn btn-ghost wallet-waiting__check"
              onClick={() => trackingId && startPolling(trackingId)}
            >
              Check status now
            </button>
          </div>
        )}

        {step === "done" && (
          <div className="wallet-waiting">
            {status === "completed" ? (
              <>
                <LuCircleCheck className="wallet-waiting__icon wallet-waiting__icon--ok" />
                <h4 className="wallet-waiting__title">Payment received</h4>
                <p className="wallet-waiting__text">
                  Your balance has been updated.
                </p>
              </>
            ) : (
              <>
                <LuTriangleAlert className="wallet-waiting__icon wallet-waiting__icon--err" />
                <h4 className="wallet-waiting__title">Payment failed</h4>
                <p className="wallet-waiting__text">
                  Nothing was charged. You can try again.
                </p>
              </>
            )}
            <button type="button" className="btn btn-blue wallet-waiting__check" onClick={close}>
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
