import React, { useEffect, useState } from "react";
import {
  LuX, LuArrowLeft, LuSmartphone, LuCreditCard, LuArrowUpRight, LuTriangleAlert,
} from "react-icons/lu";
import { METHODS } from "../wallet/methods";

export default function WalletModal({
  open, mode, balance, onClose, onDeposit, onWithdraw,
}) {
  const isDeposit = mode === "deposit";
  const [step, setStep] = useState("method");
  const [method, setMethod] = useState(null);
  const [amount, setAmount] = useState("");
  const [details, setDetails] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Reset whenever the modal opens
  useEffect(() => {
    if (open) {
      setStep("method");
      setMethod(null);
      setAmount("");
      setDetails({});
      setError("");
      setLoading(false);
    }
  }, [open, mode]);

  if (!open) return null;

  const close = () => { onClose(); };

  const pick = (m) => {
    setMethod(m);
    const init = {};
    m.fields.forEach((f) => { init[f.name] = ""; });
    setDetails(init);
    setStep("amount");
    setError("");
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    const value = Number(amount);
    if (!value || value < 1) { setError("Minimum is $1"); return; }
    if (!isDeposit && value > balance) { setError("Amount exceeds your balance"); return; }

    for (const f of method.fields) {
      if (!f.validate(details[f.name])) {
        setError(f.error);
        return;
      }
    }

    setLoading(true);
    try {
      const payload = { amount: value, method: method.label, details: { ...details } };
      if (isDeposit) await onDeposit?.(payload);
      else await onWithdraw?.(payload);
      // Parent will close us
    } catch (e) {
      setError(e.message || "Something went wrong");
      setLoading(false);
    }
  };

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
                <em>{method.detail}</em>
              </div>
            </div>

            {method.fields.map((f) => (
              <label key={f.name} className="wallet-form__field">
                <span>{f.label}</span>
                <input
                  type={f.type || "text"}
                  inputMode={f.inputMode}
                  autoComplete={f.autoComplete}
                  placeholder={f.placeholder}
                  maxLength={f.maxLength}
                  value={details[f.name] || ""}
                  onChange={(e) => setDetails((s) => ({ ...s, [f.name]: e.target.value }))}
                  className="wallet-form__input-text"
                />
              </label>
            ))}

            <label className="wallet-form__field">
              <span>Amount</span>
              <div className="wallet-form__input">
                <span className="wallet-form__cur">$</span>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min={1}
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  autoFocus
                />
              </div>
            </label>

            {error && (
              <div className="auth__error">
                <LuTriangleAlert /> {error}
              </div>
            )}

            <button type="submit" className="btn btn-blue wallet-form__submit" disabled={loading}>
              {loading
                ? "Processing…"
                : isDeposit
                  ? `Deposit $${amount || 0}`
                  : `Withdraw $${amount || 0}`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
