import React, { useEffect, useState } from "react";
import {
  LuX, LuArrowLeft, LuSmartphone, LuCreditCard, LuArrowUpRight,
  LuTriangleAlert, LuExternalLink,
} from "react-icons/lu";
import { paymentsApi } from "../../../lib/api";

const METHODS = [
  { id: "M-Pesa",       label: "M-Pesa",       desc: "Instant mobile money",   tone: "blue",  icon: "phone" },
  { id: "Card",         label: "Card",         desc: "Visa, Mastercard",       tone: "blue",  icon: "card" },
  { id: "USDT (TRC20)", label: "USDT (TRC20)", desc: "Cryptocurrency",         tone: "green", icon: "usdt" },
];

export default function WalletModal({ open, mode, balance, onClose }) {
  const isDeposit = mode === "deposit";
  const [step, setStep] = useState("method");
  const [method, setMethod] = useState(null);
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Reset whenever the modal opens
  useEffect(() => {
    if (open) {
      setStep("method");
      setMethod(null);
      setAmount("");
      setPhone("");
      setEmail("");
      setError("");
      setLoading(false);
    }
  }, [open, mode]);

  if (!open) return null;

  const close = () => onClose();

  const pick = (m) => {
    setMethod(m);
    setStep("amount");
    setError("");
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
    try {
      if (isDeposit) {
        // Hand off to Pesapal — opens the hosted page in the same tab
        const res = await paymentsApi.startDeposit({
          amount: value,
          method: method.label,
          phone: phone || undefined,
          email: email || undefined,
        });
        if (!res?.redirectUrl) throw new Error("Pesapal did not return a redirect URL");
        window.location.href = res.redirectUrl;
        return;
      }

      // Withdrawals are not yet wired to Pesapal B2C — leave a placeholder
      throw new Error("Withdrawals are processed manually. Contact support.");
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
                <em>{isDeposit ? "via Pesapal" : "Manual review"}</em>
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
                  min={10}
                  placeholder="10.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  autoFocus
                  required
                />
              </div>
            </label>

            {isDeposit && method.id === "M-Pesa" && (
              <label className="wallet-form__field">
                <span>M-Pesa phone number</span>
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

            {isDeposit && (
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
            )}

            {error && (
              <div className="auth__error">
                <LuTriangleAlert /> {error}
              </div>
            )}

            <button type="submit" className="btn btn-blue wallet-form__submit" disabled={loading}>
              {loading
                ? "Redirecting to Pesapal…"
                : isDeposit
                  ? <>Deposit ${amount || 0} <LuExternalLink /></>
                  : `Withdraw $${amount || 0}`}
            </button>

            {isDeposit && (
              <p className="wallet-form__note">
                You'll be redirected to Pesapal to complete the payment securely.
                Your balance updates automatically once confirmed.
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
