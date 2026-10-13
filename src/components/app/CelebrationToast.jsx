import React, { useEffect, useState } from "react";
import { LuPartyPopper, LuX } from "react-icons/lu";

let idCounter = 0;

export default function CelebrationToast() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const handler = (payload) => {
      const id = ++idCounter;
      const toast = {
        id,
        tone: payload.tone || "win",
        title: payload.title || "Nice!",
        subtitle: payload.subtitle || "",
        emoji: payload.emoji || "🎉",
        ttl: payload.ttl || 4200,
      };
      setItems((list) => [toast, ...list].slice(0, 3));
      setTimeout(() => {
        setItems((list) => list.filter((t) => t.id !== id));
      }, toast.ttl);
    };

    // Lazy import to avoid circular deps
    let unsubscribe = () => {};
    import("../../lib/toast").then(({ onToast }) => {
      unsubscribe = onToast(handler);
    });

    return () => unsubscribe();
  }, []);

  const dismiss = (id) => setItems((list) => list.filter((t) => t.id !== id));

  if (!items.length) return null;

  return (
    <div className="toast-stack" role="status" aria-live="polite">
      {items.map((t) => (
        <div className={`toast toast--${t.tone}`} key={t.id}>
          <span className="toast__emoji" aria-hidden="true">{t.emoji}</span>
          <div className="toast__body">
            <strong className="toast__title">{t.title}</strong>
            {t.subtitle && <span className="toast__subtitle">{t.subtitle}</span>}
          </div>
          <button className="toast__close" onClick={() => dismiss(t.id)} aria-label="Dismiss">
            <LuX />
          </button>
          <span className="toast__progress" style={{ animationDuration: `${t.ttl}ms` }} />
        </div>
      ))}
    </div>
  );
}
