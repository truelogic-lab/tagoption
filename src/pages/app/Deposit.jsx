import React, { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  LuSmartphone, LuCreditCard, LuCoins, LuExternalLink,
  LuShieldCheck, LuTriangleAlert,
} from "react-icons/lu";
import { paymentsApi } from "../../lib/api";
import { useFx } from "../../lib/useFx";

const MIN_USD = 1;
const QUICK_AMOUNTS = [5, 10, 25, 50, 100];

/**
 * Card deposits go through Pesapal's hosted page — raw card details never
 * touch this app. USDT is disabled until a TRC20 deposit flow exists.
 */
const METHODS = [
  { id: "mpesa", label: "M-Pesa", desc: "Mobile money",     tone: "green", Icon: LuSmartphone, enabled: true  },
  { id: "card",  label: "Card",   desc: "Visa / Mastercard", tone: "blue",  Icon: LuCreditCard, enabled: true  },
  { id: "usdt",  label: "USDT",   desc: "TRC20 wallet",      tone: "green", Icon: LuCoins,      enabled: false },
];

export default function Deposit() {
  const { store } = useOutletContext();
  const { rate, toKes } = useFx();

  const [methodId, setMethodId] = useState("mpesa");
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const method = METHODS.find((m) => m.id === methodId);
  const amountNum = Number(amount) || 0;
  const kesAmount = useMemo(() => toKes(amountNum), [amountNum, toKes]);
  const showKes = amountNum >= MIN_USD;

  const phoneValid = method.id !== "mpesa" || /^\+?[0-9\s-]{9,}$/.test(phone.trim());
  const canSubmit = !loading && showKes && phoneValid && method.enabled;

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!amountNum || amountNum < MIN_USD) { setError(`Minimum deposit is $${MIN_USD}`); return; }
    if (!phoneValid) { setError("Enter a valid M-Pesa phone number"); return; }

    setLoading(true);
    try {
      const res = await paymentsApi.startDeposit({
        amount: amountNum,
        method: method.label,
        phone: method.id === "mpesa" ? phone.trim() : undefined,
        currency: "KES",
      });
      const url = res?.redirectUrl || res?.redirect_url;
      if (!url) throw new Error("Payment provider did not return a redirect URL");
      window.location.href = url;
    } catch (err) {
      setError(err?.message || "Could not start the payment");
      setLoading(false);
    }
  };

  return (
    <div className="deposit">
      <header className="deposit__head">
        <h1 className="deposit__title">Deposit</h1>
        <p className="deposit__balance">
          Balance <strong>${Number(store.balance || 0).toFixed(2)}</strong>
        </p>
      </header>

      <form className="deposit__card" onSubmit={submit}>
        <section className="deposit__section">
          <label className="deposit__label">Payment method</label>
          <div className="deposit__methods">
            {METHODS.map(({ id, label, desc, tone, Icon, enabled }) => {
              const active = methodId === id;
              return (
                <button
                  type="button"
                  key={id}
                  className={`deposit__method deposit__method--${tone} ${active ? "is-active" : ""} ${!enabled ? "is-disabled" : ""}`}
                  onClick={() => enabled && setMethodId(id)}
                  aria-pressed={active}
                  disabled={!enabled}
                >
                  <span className="deposit__method-icon"><Icon size={20} strokeWidth={2} /></span>
                  <strong>{label}</strong>
                  <em>{enabled ? desc : "Coming soon"}</em>
                </button>
              );
            })}
          </div>
        </section>

        <section className="deposit__section">
          <label className="deposit__label" htmlFor="deposit-amount">Amount (USD)</label>

          <div className="deposit__amount">
            <span className="deposit__amount-cur">$</span>
            <input
              id="deposit-amount"
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

        {method.id === "mpesa" && (
          <section className="deposit__section">
            <label className="deposit__label" htmlFor="deposit-phone">M-Pesa phone number</label>
            <input
              id="deposit-phone"
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

        {error && (
          <div className="deposit__error" role="alert">
            <LuTriangleAlert size={16} strokeWidth={2} />
            <span>{error}</span>
          </div>
        )}

        <button type="submit" className="deposit__submit" disabled={!canSubmit}>
          {loading
            ? "Preparing payment…"
            : showKes
              ? <>Continue to secure payment <LuExternalLink size={16} strokeWidth={2} /></>
              : <>Enter an amount <LuExternalLink size={16} strokeWidth={2} /></>}
        </button>

        <div className="deposit__secure">
          <LuShieldCheck size={18} strokeWidth={2} />
          <div>
            <strong>Secure payment</strong>
            <p>
              You'll finish the deposit on Pesapal's hosted checkout. Card details
              never touch this app, and your balance updates only after payment is
              confirmed.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
