import React from "react";
import {
  LuX, LuArrowDown, LuArrowUp, LuRefreshCw, LuBell, LuCheck,
} from "react-icons/lu";

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function iconFor(type) {
  switch (type) {
    case "deposit":  return <LuArrowDown />;
    case "withdraw": return <LuArrowUp />;
    case "trade":    return <LuRefreshCw />;
    default:         return <LuBell />;
  }
}

export default function NotificationsPanel({
  open, onClose, items, unreadCount, onMarkAllRead, onMarkRead, onClear,
}) {
  if (!open) return null;

  return (
    <div className="notif" onClick={onClose}>
      <div className="notif__panel" onClick={(e) => e.stopPropagation()}>
        <div className="notif__head">
          <div>
            <h3 className="notif__title">Notifications</h3>
            {unreadCount > 0 && (
              <span className="notif__sub">{unreadCount} unread</span>
            )}
          </div>
          <div className="notif__actions">
            {unreadCount > 0 && (
              <button className="notif__action" onClick={onMarkAllRead}>
                <LuCheck /> Mark all read
              </button>
            )}
            <button className="notif__close" onClick={onClose} aria-label="Close">
              <LuX />
            </button>
          </div>
        </div>

        <div className="notif__body">
          {items.length === 0 ? (
            <div className="notif__empty">
              <div className="notif__empty-icon"><LuBell /></div>
              <h4>All caught up</h4>
              <p>Deposits, trades, and payouts will appear here.</p>
            </div>
          ) : (
            items.map((n) => (
              <button
                key={n.id}
                className={`notif__row ${n.read ? "" : "is-unread"}`}
                onClick={() => onMarkRead(n.id)}
              >
                <span className={`notif__icon notif__icon--${n.type}`}>
                  {iconFor(n.type)}
                </span>
                <div className="notif__body-text">
                  <strong>{n.title}</strong>
                  {n.body && <em>{n.body}</em>}
                  <span className="notif__time">{timeAgo(n.at)}</span>
                </div>
                {!n.read && <span className="notif__dot" />}
              </button>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="notif__foot">
            <button className="notif__clear" onClick={onClear}>Clear all</button>
          </div>
        )}
      </div>
    </div>
  );
}
