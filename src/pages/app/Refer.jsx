import React from "react";
import { useOutletContext } from "react-router-dom";
import CodeCard from "../../components/app/refer/CodeCard";
import ReferralList from "../../components/app/refer/ReferralList";

const SAMPLE_REFERRALS = [];

export default function Refer() {
  const { store } = useOutletContext();
  const code = `TAG-${(store.balance * 1000 | 0).toString(36).toUpperCase().slice(0, 6) || "WARREN"}`;

  return (
    <div className="refer">
      <div className="page-form__head">
        <h1 className="page-form__title">Refer &amp; Earn</h1>
        <p className="page-form__lead">
          Share your code. Earn a bonus every time someone you referred places
          their first trade.
        </p>
      </div>

      <CodeCard code={code} />

      <div className="refer__stats">
        <div className="refer__stat">
          <strong>{SAMPLE_REFERRALS.length}</strong>
          <span>Referrals</span>
        </div>
        <div className="refer__stat">
          <strong>$0.00</strong>
          <span>Earned</span>
        </div>
      </div>

      <h2 className="refer__subtitle">Your referrals</h2>
      <ReferralList referrals={SAMPLE_REFERRALS} />
    </div>
  );
}
