import React, { useMemo, useState } from "react";
import {
  LuUserRound, LuLockKeyhole, LuBadgeCheck, LuChevronRight,
} from "react-icons/lu";
import NameForm from "../../components/app/account/NameForm";
import PasswordForm from "../../components/app/account/PasswordForm";
import VerifyForm from "../../components/app/account/VerifyForm";
import { getSession } from "../../lib/auth";

const ICON_SIZE = 21;
const ICON_STROKE = 2;

/**
 * Account settings page. Sections are labelled groups of rows; each row
 * expands inline to a form. No sub-routes — mobile-first, single surface.
 *
 * Two-factor authentication is deliberately absent: the backend has no TOTP
 * implementation, and a toggle that only flips local state would mislead
 * users into thinking they were protected. Add it when the server supports it.
 */
const SECTIONS = [
  {
    label: "Personal information",
    items: [
      {
        id: "name",
        Icon: LuUserRound,
        title: "Personal details",
        desc: "Update your display name and email address",
        tone: "blue",
      },
    ],
  },
  {
    label: "Security",
    items: [
      {
        id: "password",
        Icon: LuLockKeyhole,
        title: "Change password",
        desc: "Keep your account protected with a strong password",
        tone: "blue",
      },
    ],
  },
  {
    label: "Verification",
    items: [
      {
        id: "verify",
        Icon: LuBadgeCheck,
        title: "Verify identity",
        desc: "Complete identity verification to access eligible features",
        tone: "teal",
      },
    ],
  },
];

export default function Account() {
  const [open, setOpen] = useState(null);

  const user = useMemo(() => {
    const s = getSession();
    return {
      name: s?.user?.name ?? "Trader",
      email: s?.user?.email ?? "—",
    };
  }, []);

  const initial = (user.name?.trim()?.[0] || user.email?.trim()?.[0] || "").toUpperCase();

  return (
    <div className="account">
      <header className="account__head">
        <h1 className="account__title">Account settings</h1>
        <p className="account__lead">
          Manage your personal information, account security, and verification.
        </p>
      </header>

      <div className="account__summary">
        <div className="account__avatar" aria-hidden="true">
          {initial || <span className="account__avatar-dot" />}
        </div>
        <div className="account__summary-body">
          <strong>{user.name}</strong>
          <span>{user.email}</span>
        </div>
      </div>

      {SECTIONS.map((section) => (
        <section key={section.label} className="account__group">
          <h2 className="account__group-label">{section.label}</h2>

          <div className="account__group-body">
            {section.items.map(({ id, Icon, title, desc, tone }) => {
              const isOpen = open === id;
              return (
                <div key={id} className={`account__section ${isOpen ? "is-open" : ""}`}>
                  <button
                    type="button"
                    className="account__trigger"
                    onClick={() => setOpen(isOpen ? null : id)}
                    aria-expanded={isOpen}
                  >
                    <span className={`account__icon account__icon--${tone}`}>
                      <Icon size={ICON_SIZE} strokeWidth={ICON_STROKE} />
                    </span>
                    <span className="account__text">
                      <strong>{title}</strong>
                      <em>{desc}</em>
                    </span>
                    <LuChevronRight
                      size={18}
                      strokeWidth={2}
                      className={`account__caret ${isOpen ? "is-open" : ""}`}
                    />
                  </button>

                  {isOpen && (
                    <div className="account__body">
                      {id === "name" && (
                        <NameForm initialName={user.name} initialEmail={user.email} />
                      )}
                      {id === "password" && <PasswordForm />}
                      {id === "verify" && <VerifyForm />}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
