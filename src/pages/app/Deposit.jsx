import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { LuSmartphone, LuCreditCard, LuArrowUpRight, LuExternalLink } from "react-icons/lu";
import { paymentsApi } from "../../lib/api";
import { celebrateDeposit } from "../../lib/celebrate";
import { useFx } from "../../lib/useFx";

const METHODS = [
  { id: "M-Pesa",       label: "M-Pesa",       desc: "Instant mobile money",       icon: "phone",  tone: "blue" },
  { id: "Card",         label: "Card",         desc: "Visa, Mastercard",           icon: "card",   tone: "blue" },
  { id: "USDT (TRC20)", label: "USDT (TRC20)", desc: "Cryptocurrency",             icon: "usdt",   tone: "green" },
];

export default function Deposit() {
  const { store } = useOutletContext();
  const [method, setMethod] = useState(null);
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [redirectUrl, setRedirectUrl] = useState(null);
  const { rate, toKes } = useFx();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const value = Number(amount);
    if (!value || value < 1) { setError("Minimum is $1"); return; }
    if (method.id === "M-Pesa" && phone.replace(/\D/g, "").length < 9) {
      setError("Enter a valid phone number"); return;
    }

    setLoading(true);
    try {
      const res = await paymentsApi.startDeposit({
        amount: value,
        method: method.label,
        phone,
        email: email || undefined,
      });
      setRedirectUrl(res.redirectUrl);
      // Open Pesapal's hosted page
      window.location.href = res.redirectUrl;
    } catch (e) {
      setError(e.message || "Could not start the payment");
      setLoading(false);
    }
  };

  const amountNum = Number(amount) || 0;
  const kesAmount = toKes(amountNum);
  const showKes = amountNum >= 1;

  if (!method) {
    return (
      <div className="page-form">
        <div className="page-form__head">
          <h1 className="page-form__title">Deposit Funds</h1>
          <p className="page-form__lead">Balance: <strong>${store.balance.toFixed(2)}</strong></p>
        </div>

        <div className="paylist">
          {METHODS.map((m) => {
            const Icon = m.icon === "usdt"
              ? () => <span className="paylist__usdt">₮</span>
              : m.icon === "card" ? LuCreditCard : LuSmartphone;
            return (
              <button key={m.id} className="paylist__row" onClick={() => setMethod(m)}>
                <span className={`paylist__icon paylist__icon--${m.tone}`}><Icon /></span>
                <div>
                  <strong>{m.label}</strong>
                  <em>{m.desc}</em>
                </div>
                <LuArrowUpRight className="paylist__arrow" />
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="page-form">
      <div className="page-form__head">
        <h1 className="page-form__title">Deposit Funds</h1>
        <p className="page-form__lead">Balance: <strong>${store.balance.toFixed(2)}</strong></p>
      </div>

      <button className="page-form__back" onClick={() => setMethod(null)}>← Change method</button>

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
              type="number" inputMode="decimal" min={1} step="0.01"
              placeholder="10.00"
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
            <div className="fx-preview__meta">at 1 USD = {rate.toFixed(2)} KES</div>
          </div>
        )}

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

        {error && <div className="auth__error">{error}</div>}

        <button type="submit" className="btn btn-blue wallet-form__submit" disabled={loading}>
          {loading
            ? "Preparing…"
            : showKes
              ? <>Pay ${amountNum.toFixed(2)} (KSh {kesAmount.toLocaleString()}) <LuExternalLink /></>
              : <>Continue <LuExternalLink /></>}
        </button>

        <p className="wallet-form__note">
          Complete the payment in the secure window. Your balance updates automatically once confirmed.
        </p>
      </form>
    </div>
  );
}
