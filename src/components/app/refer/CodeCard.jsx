import React, { useState } from "react";
import { LuCopy, LuCheck, LuGift } from "react-icons/lu";

export default function CodeCard({ code }) {
  const [copied, setCopied] = useState(false);

  const shareLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth?ref=${code}`
      : `https://tagoption.ke/auth?ref=${code}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
    } catch {
      // fallback for older browsers
      const el = document.createElement("textarea");
      el.value = shareLink;
      document.body.appendChild(el);
      el.select();
      try { document.execCommand("copy"); } catch {}
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="refer-card">
      <div className="refer-card__icon"><LuGift /></div>

      <div className="refer-card__body">
        <span className="refer-card__label">Your referral link</span>
        <span className="refer-card__code refer-card__code--link">{shareLink}</span>
      </div>

      <button className="refer-card__copy" onClick={copy} type="button">
        {copied ? <><LuCheck /> Copied</> : <><LuCopy /> Copy link</>}
      </button>
    </div>
  );
}
