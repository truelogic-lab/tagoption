import React, { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  LuSmartphone, LuChevronRight, LuTriangleAlert,
} from "react-icons/lu";
import { celebrateWithdraw } from "../../lib/celebrate";

const MIN_WITHDRAW = 1;
const CREDIT_TEXT = "Developed by Warren";

/**
 * Type, hold, erase, repeat. Falls back to static text under
 * prefers-reduced-motion so the credit is never animated for users who
 * opted out at the OS level.
 */
function Typewriter({ text, speed = 90, holdMs = 1800, eraseMs = 55, gapMs = 500 }) {
  const [visible, setVisible] = useState(text);
  const [phase, setPhase] = useState("hold");

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setVisible(text);
      return;
    }

    let timer;
    if (phase === "hold") {
      timer = setTimeout(() => setPhase("erase"), holdMs);
    } else if (phase === "erase") {
      timer = setTimeout(
        () => (visible.length ? setVisible(visible.slice(0, -1)) : setPhase("type")),
        visible.length ? eraseMs : gapMs
      );
    } else if (phase === "type") {
      timer = setTimeout(
        () => (visible.length < text.length
          ? setVisible(text.slice(0, visible.length + 1))
          : setPhase("hold")),
        speed
      );
    }
    return () => clearTimeout(timer);
  }, [visible, phase, text, speed, holdMs, eraseMs, gapMs]);

  return (
    <span aria-hidden="true">
      {visible}
      <span className="deposit__credit-caret">|</span>
    </span>
  );
}

export default function Withdraw() {
  const { store } = useOutletContext();
  const navigate = useNavigate();

  const [step, setStep] = useState("form"); // form | submitting
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  const balance = Number(store.balance || 0);
  const amountNum = Number(amount) || 0;
  const tooSmall = amountNum < MIN_WITHDRAW;
  const tooMuch = amountNum > balance;
  const phoneValid = /^\+?[0-9\s-]{9,}$/.test(phone.trim());

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!amount || tooSmall) { setError(`Minimum withdrawal is $${MIN_WITHDRAW}`); return; }
    if (tooMuch) { setError("Amount exceeds your available balance"); return; }
    if (!phoneValid) { setError("Enter a valid M-Pesa phone number"); return; }

    setStep("submitting");
    try {
      await store.withdraw({
        amount: amountNum,
        method: "M-Pesa",
        details: { phone: phone.trim() },
      });
      celebrateWithdraw({ amount: amountNum, method: "M-Pesa" });
      navigate("/positions");
    } catch (err) {
      setError(err?.message || "Could not submit the withdrawal");
      setStep("form");
    }
  };

  return (
    <div className="withdraw">
      <header className="withdraw__head">
        <h1 className="withdraw__title">Withdraw</h1>
        <p className="withdraw__sub">Send funds to your M-Pesa number</p>
      </header>

      <div className="withdraw__balance">
        <span className="withdraw__balance-label">Available balance</span>
        <strong className="withdraw__balance-amount">
          ${balance.toFixed(2)}
        </strong>
        <span className="withdraw__balance-note">Available to withdraw</span>
      </div>

      <section className="withdraw__section">
        <h2 className="withdraw__section-title">Withdrawal method</h2>

        <div className="withdraw__method is-active">
          <span className="withdraw__method-icon">
            <LuSmartphone size={20} strokeWidth={2} />
          </span>
          <div className="withdraw__method-body">
            <strong>M-Pesa</strong>
            <span>Withdraw to your mobile money account</span>
          </div>
          <LuChevronRight size={18} strokeWidth={2} className="withdraw__method-caret" />
        </div>
      </section>

      <form className="withdraw__form" onSubmit={submit}>
        <label className="withdraw__field">
          <span className="withdraw__label">Amount (USD)</span>
          <div className="withdraw__input">
            <span className="withdraw__cur">$</span>
            <input
              type="number"
              inputMode="decimal"
              min={MIN_WITHDRAW}
              step="0.01"
              placeholder="10.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
              required
            />
          </div>
        </label>

        <label className="withdraw__field">
          <span className="withdraw__label">M-Pesa phone number</span>
          <input
            className="withdraw__text"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+254 7XX XXX XXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </label>

        {error && (
          <div className="withdraw__error" role="alert">
            <LuTriangleAlert size={16} strokeWidth={2} />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          className="withdraw__submit"
          disabled={step === "submitting" || tooSmall || tooMuch || !phoneValid || amount === ""}
        >
          {step === "submitting"
            ? "Submitting…"
            : tooMuch
              ? "Amount exceeds balance"
              : `Withdraw $${amountNum.toFixed(2)}`}
        </button>
      </form>

      <p className="deposit__credit" aria-label={CREDIT_TEXT}>
        <Typewriter text={CREDIT_TEXT} />
      </p>
    </div>
  );
}
