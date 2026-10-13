import React, { useEffect, useRef, useState } from "react";
import {
  LuX, LuArrowLeft, LuSmartphone, LuCreditCard, LuArrowUpRight,
  LuTriangleAlert, LuCircleCheck, LuLoaderCircle,
} from "react-icons/lu";
import { paymentsApi } from "../../../lib/api";
import { celebrateDeposit } from "../../../lib/celebrate";
import { useFx } from "../../../lib/useFx";

const MIN_USD = 1;

const METHODS = [
  { id: "M-Pesa",       label: "M-Pesa",       desc: "Instant mobile money",   tone: "blue",  icon: "phone" },
  { id: "Card",         label: "Card",         desc: "Visa, Mastercard",       tone: "blue",  icon: "card"  },
  { id: "USDT (TRC20)", label: "USDT (TRC20)", desc: "Cryptocurrency",         tone: "green", icon: "usdt"  },
];

export default function WalletModal({ open, mode, balance, onClose, onCompleted }) {
  const isDeposit = mode === "deposit";
  const [step, setStep] = useState("method"); // method | amount | paying | done
  const [method, setMethod] = useState(null);
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [trackingId, setTrackingId] = useState(null);
  const [redirectUrl, setRedirectUrl] = useState(null);
  const [status, setStatus] = useState(null);

  const pollRef = useRef(null);
  const { rate, toKes } = useFx();

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
      setRedirectUrl(null);
      setStatus(null);
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    }
  }, [open, mode]);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

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
          celebrateDeposit({ amount: s.amount ?? 0, method: method?.label ?? "" });
          onCompleted?.();
        } else if (s.status === "failed") {
          clearInterval(pollRef.current);
          pollRef.current = null;
          setStep("done");
        }
      } catch {}
    }, 3000);
  };

  const amountNum = Number(amount) || 0;
  const kesAmount = toKes(amountNum);
  const showKes = amountNum >= MIN_USD;

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!amountNum || amountNum < MIN_USD) {
      setError(`Minimum deposit is $${MIN_USD}`);
      return;
    }
    if (!isDeposit && amountNum > balance) {
      setError("Amount exceeds your balance");
      return;
    }
    if (isDeposit && method.id === "M-Pesa" && phone.replace(/\D/g, "").length < 9) {
      setError("Enter a valid phone number");
      return;
    }

    setLoading(true);
    try {
      const res = await paymentsApi.startDeposit({
        amount: amountNum,
        method: method.label,
        phone: phone || undefined,
        email: email || undefined,
      });
      if (!res?.redirectUrl) throw new Error("Payment could not be started. Try again.");

      setTrackingId(res.orderTrackingId);
      setRedirectUrl(res.redirectUrl);
      setStep("paying");
      startPolling(res.orderTrackingId);
    } catch (e) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------- */

  return (
    <div className="modal" onClick={step === "paying" ? undefined : close}>
      <div
        className={`modal__panel ${step === "paying" ? "modal__panel--fullscreen" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        {step !== "paying" && (
          <div className="modal__head">
            {step === "amount" ? (
              <button className="modal__back" onClick={() => setStep("method")} aria-label="Back">
                <LuArrowLeft />
              </button>
            ) : <span className="modal__spacer" />}
            <h3 className="modal__title">{isDeposit ? "Deposit Funds" : "Withdraw Funds"}</h3>
            <button className="modal__close" onClick={close} aria-label="Close"><LuX /></button>
          </div>
        )}

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
                <em>{method.desc}</em>
              </div>
            </div>

            <label className="wallet-form__field">
              <span>Amount (USD)</span>
              <div className="wallet-form__input">
                <span className="wallet-form__cur">$</span>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min={MIN_USD}
                  placeholder="1.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  autoFocus
                  required
                />
              </div>
            </label>

            {showKes && (
              <div className="fx-preview">
                <div className="fx-preview__row">
                  <span>You pay</span>
                  <strong>KSh {kesAmount.toLocaleString()}</strong>
                </div>
                <div className="fx-preview__meta">
                  at 1 USD = {rate.toFixed(2)} KES
                </div>
              </div>
            )}

            {method.id === "M-Pesa" && (
              <label className="wallet-form__field">
                <span>Phone number</span>
                <input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
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
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="wallet-form__input-text"
              />
            </label>

            {error && (
              <div className="auth__error">
                <LuTriangleAlert /> {error}
              </div>
            )}

            <button type="submit" className="btn btn-blue wallet-form__submit" disabled={loading}>
              {loading
                ? "Preparing…"
                : showKes
                  ? `Pay $${amountNum.toFixed(2)} (KSh ${kesAmount.toLocaleString()})`
                  : `Deposit $${amount || 0}`}
            </button>
          </form>
        )}

        {step === "paying" && redirectUrl && (
          <div className="wallet-iframe">
            <div className="wallet-iframe__bar">
              <div className="wallet-iframe__secure">
                <span className="wallet-iframe__dot" />
                Secure payment
              </div>
              <button
                type="button"
                className="wallet-iframe__close"
                onClick={() => setStep("amount")}
              >
                Back
              </button>
            </div>

            <iframe
              title="Payment"
              src={redirectUrl}
              className="wallet-iframe__frame"
              allow="payment"
              referrerPolicy="no-referrer-when-downgrade"
            />

            <div className="wallet-iframe__foot">
              <p>Complete the payment above. Your balance updates automatically.</p>
            </div>
          </div>
        )}

        {step === "done" && (
          <div className="wallet-waiting">
            {status === "completed" ? (
              <>
                <LuCircleCheck className="wallet-waiting__icon wallet-waiting__icon--ok" />
                <h4 className="wallet-waiting__title">Payment received</h4>
                <p className="wallet-waiting__text">Your balance has been updated.</p>
              </>
            ) : (
              <>
                <LuTriangleAlert className="wallet-waiting__icon wallet-waiting__icon--err" />
                <h4 className="wallet-waiting__title">Payment failed</h4>
                <p className="wallet-waiting__text">Nothing was charged. You can try again.</p>
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
