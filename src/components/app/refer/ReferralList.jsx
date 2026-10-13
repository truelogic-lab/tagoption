import React from "react";
import { LuUsers } from "react-icons/lu";

export default function ReferralList({ referrals }) {
  if (!referrals.length) {
    return (
      <div className="positions__empty">
        <div className="positions__empty-icon"><LuUsers /></div>
        <h3>No referrals yet</h3>
        <p>Share your code to start earning.</p>
      </div>
    );
  }

  return (
    <div className="refer-list">
      {referrals.map((r) => (
        <div className="refer-row" key={r.id}>
          <span className="refer-row__avatar">{r.initial}</span>
          <div className="refer-row__body">
            <strong>{r.name}</strong>
            <span>Joined {r.joined}</span>
          </div>
          <span className={`refer-row__status refer-row__status--${r.status}`}>
            {r.status}
          </span>
        </div>
      ))}
    </div>
  );
}
