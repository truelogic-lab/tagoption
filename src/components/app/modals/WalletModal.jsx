import React, { useEffect, useMemo, useState } from "react";
import {
  LuX, LuSmartphone, LuCreditCard, LuExternalLink, LuCircleAlert,
} from "react-icons/lu";
import { paymentsApi } from "../../../lib/api";
import { useFx } from "../../../lib/useFx";

const MIN_USD = 1;
const QUICK_AMOUNTS = [5, 10, 25, 50, 100];

const METHODS = [
  { id: "M-Pesa", label: "M-Pesa", desc: "Mobile money",     tone: "green", icon: "phone" },
  { id: "Card",   label: "Card",   desc: "Visa / Mastercard", tone: "blue",  icon: "card"  },
  { id: "USDT",   label: "USDT",   desc: "TRC20 wallet",      tone: "green", icon: "usdt"  },
];

function MethodIcon({ icon }) {
  if (icon === "usdt") return <span className="deposit__usdt">₮</span>;
  if (icon === "card") return <LuCreditCard />;
  return <LuSmartphone />;
}

export default function WalletModal({ open, balance, onClose, onCompleted }) {
  const { rate, toKes } = useFx();

  const [method, setMethod] = useState(METHODS[0]);
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Reset on every open so a second open never carries stale input.
  useEffect(() => {
    if (!open) return;
    setMethod(METHODS[0]);
    setAmount("");
    setPhone("");
    setEmail("");
    setError("");
    setLoading(false);
  }, [open]);

  const amountNum = Number(amount) || 0;
  const kesAmount = useMemo(() => toKes(amountNum), [amountNum, toKes]);
  const showKes = amountNum >= MIN_USD;

  if (!open) return null;

  const close = () => {
    if (loading) return;
    onClose();
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!amountNum || amountNum < MIN_USD) {
      setError(`Minimum deposit is $${MIN_USD}`);
      return;
    }
    if (method.id === "M-Pesa" && phone.replace(/\D/g, "").length < 9) {
      setError("Enter a valid M-Pesa phone number");
      return;
    }

    setLoading(true);
    try {
      const res = await paymentsApi.startDeposit({
        amount: amountNum,
        method: method.label,
        phone: method.id === "M-Pesa" ? phone : undefined,
        email: email || undefined,
        currency: "KES",
      });

      const url = res?.redirectUrl || res?.redirect_url;
      if (!url) throw new Error("Payment provider did not return a redirect URL");

      if (res?.orderTrackingId) {
        sessionStorage.setItem(
          "tagoption.pendingPayment",
          JSON.stringify({
            trackingId: res.orderTrackingId,
            amount: amountNum,
            method: method.label,
          })
        );
      }

      onCompleted?.();
      window.location.href = url;
    } catch (err) {
      setError(err.message || "Could not start the payment");
      setLoading(false);
    }
  };

  return (
    <div className="modal" onClick={close}>
      <div className="modal__panel" onClick={(e) => e.stopPropagation()}>
        <header className="wallet-modal__head">
          <h3 className="wallet-modal__title">Deposit</h3>
          <button
            className="wallet-modal__close"
            onClick={close}
            disabled={loading}
            aria-label="Close"
          >
            <LuX />
          </button>
        </header>

        <p className="wallet-modal__balance">
          Balance <strong>${Number(balance || 0).toFixed(2)}</strong>
        </p>

        <form className="deposit__card deposit__card--modal" onSubmit={submit}>
          <section className="deposit__section">
            <label className="deposit__label">Payment method</label>
            <div className="deposit__methods">
              {METHODS.map((m) => {
                const active = method.id === m.id;
                return (
                  <button
                    type="button"
                    key={m.id}
                    className={`deposit__method deposit__method--${m.tone} ${active ? "is-active" : ""}`}
                    onClick={() => setMethod(m)}
                    aria-pressed={active}
                  >
                    <span className="deposit__method-icon"><MethodIcon icon={m.icon} /></span>
                    <strong>{m.label}</strong>
                    <em>{m.desc}</em>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="deposit__section">
            <label className="deposit__label" htmlFor="wallet-amount">Amount</label>
            <div className="deposit__amount">
              <span className="deposit__amount-cur">$</span>
              <input
                id="wallet-amount"
                type="number"
                inputMode="decimal"
                min={MIN_USD}
                step="0.01"
                placeholder="10.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
                required
              />
            </div>

            <div className="deposit__chips">
              {QUICK_AMOUNTS.map((v) => (
                <button
                  type="button"
                  key={v}
                  className={`deposit__chip ${amountNum === v ? "is-active" : ""}`}
                  onClick={() => setAmount(String(v))}
                >
                  ${v}
                </button>
              ))}
            </div>

            {showKes && (
              <div className="deposit__kes">
                You pay <strong>KSh {kesAmount.toLocaleString()}</strong>
                <span>at 1 USD = {rate.toFixed(2)} KES</span>
              </div>
            )}
          </section>

          {method.id === "M-Pesa" && (
            <section className="deposit__section">
              <label className="deposit__label" htmlFor="wallet-phone">M-Pesa phone number</label>
              <input
                id="wallet-phone"
                className="deposit__input"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="2547XXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </section>
          )}

          <section className="deposit__section">
            <label className="deposit__label" htmlFor="wallet-email">Email for receipt</label>
            <input
              id="wallet-email"
              className="deposit__input"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </section>

          {error && (
            <div className="deposit__error" role="alert">
              <LuCircleAlert />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="deposit__submit"
            disabled={loading || !showKes}
          >
            {loading
              ? "Opening secure checkout…"
              : showKes
                ? <>Pay KSh {kesAmount.toLocaleString()} <LuExternalLink /></>
                : <>Enter an amount <LuExternalLink /></>}
          </button>

          <p className="deposit__note">
            You'll finish the payment on Pesapal's secure page.
          </p>
        </form>
      </div>
    </div>
  );
}
