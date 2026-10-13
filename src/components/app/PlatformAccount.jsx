import React from "react";
import { LuWallet, LuTrendingUp, LuLock } from "react-icons/lu";

export default function PlatformAccount({ balance, escrow, volume }) {
  const edgePct = volume > 0 ? (balance / volume) * 100 : 0;

  return (
    <div className="platform-acct">
      <div className="platform-acct__head">
        <span className="platform-acct__title">Platform</span>
        <span className="platform-acct__edge">
          {volume > 0 ? `${edgePct.toFixed(2)}% edge` : "—"}
        </span>
      </div>

      <div className="platform-acct__row">
        <span className="platform-acct__label"><LuWallet /> Balance</span>
        <strong className={balance >= 0 ? "" : "platform-acct__neg"}>
          ${balance.toFixed(2)}
        </strong>
      </div>

      <div className="platform-acct__row platform-acct__row--sub">
        <span className="platform-acct__label"><LuLock /> Escrow</span>
        <strong>${escrow.toFixed(2)}</strong>
      </div>

      <div className="platform-acct__row platform-acct__row--sub">
        <span className="platform-acct__label"><LuTrendingUp /> Volume</span>
        <strong>${volume.toFixed(2)}</strong>
      </div>
    </div>
  );
}
