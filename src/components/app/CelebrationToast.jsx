import React, { useEffect, useState } from "react";
import { LuCheck, LuX, LuTrendingUp, LuTrendingDown, LuInfo } from "react-icons/lu";
import { onToast } from "../../lib/toast";

let idCounter = 0;

const TONES = {
  win:      { Icon: LuTrendingUp,   className: "toast--positive" },
  deposit:  { Icon: LuCheck,        className: "toast--positive" },
  withdraw: { Icon: LuCheck,        className: "toast--info" },
  loss:     { Icon: LuTrendingDown, className: "toast--neutral" },
  info:     { Icon: LuInfo,         className: "toast--neutral" },
};

export default function CelebrationToast() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const unsubscribe = onToast((payload) => {
      const id = ++idCounter;
      const toast = {
        id,
        tone: payload.tone || "info",
        title: payload.title || "",
        subtitle: payload.subtitle || "",
        label: payload.label || "",
        ttl: payload.ttl || 4200,
      };
      setItems((list) => [toast, ...list].slice(0, 3));
      setTimeout(() => {
        setItems((list) => list.filter((t) => t.id !== id));
      }, toast.ttl);
    });
    return unsubscribe;
  }, []);

  const dismiss = (id) => setItems((list) => list.filter((t) => t.id !== id));

  if (!items.length) return null;

  return (
    <div className="toast-stack" role="status" aria-live="polite">
      {items.map((t) => {
        const meta = TONES[t.tone] || TONES.info;
        const Icon = meta.Icon;
        return (
          <div className={`toast ${meta.className}`} key={t.id}>
            <span className="toast__icon"><Icon /></span>
            <div className="toast__body">
              {t.label && <span className="toast__label">{t.label}</span>}
              <strong className="toast__title">{t.title}</strong>
              {t.subtitle && <span className="toast__subtitle">{t.subtitle}</span>}
            </div>
            <button className="toast__close" onClick={() => dismiss(t.id)} aria-label="Dismiss">
              <LuX />
            </button>
            <span className="toast__progress" style={{ animationDuration: `${t.ttl}ms` }} />
          </div>
        );
      })}
    </div>
  );
}
