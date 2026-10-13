import React, { useMemo, useState } from "react";
import {
  LuUser, LuLock, LuSmartphone, LuIdCard, LuChevronRight,
} from "react-icons/lu";
import NameForm from "../../components/app/account/NameForm";
import PasswordForm from "../../components/app/account/PasswordForm";
import TwoFactorForm from "../../components/app/account/TwoFactorForm";
import VerifyForm from "../../components/app/account/VerifyForm";
import { getSession } from "../../lib/auth";

const SECTIONS = [
  { id: "name",     Icon: LuUser,       title: "Change Name",           desc: "Update your display name and email" },
  { id: "password", Icon: LuLock,       title: "Change Password",       desc: "Set a new password for your account" },
  { id: "2fa",      Icon: LuSmartphone, title: "Two-Factor Auth (2FA)", desc: "Add an extra layer of security" },
  { id: "verify",   Icon: LuIdCard,     title: "Verify Identity",       desc: "Unlock higher limits and faster payouts" },
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

  return (
    <div className="account">
      <div className="page-form__head">
        <h1 className="page-form__title">Account settings</h1>
        <p className="page-form__lead">Manage your profile, security, and verification.</p>
      </div>

      <div className="account__list">
        {SECTIONS.map(({ id, Icon, title, desc }) => {
          const isOpen = open === id;
          return (
            <div key={id} className={`account__section ${isOpen ? "is-open" : ""}`}>
              <button className="account__trigger" onClick={() => setOpen(isOpen ? null : id)}>
                <span className="account__icon"><Icon /></span>
                <span className="account__text">
                  <strong>{title}</strong>
                  <em>{desc}</em>
                </span>
                <LuChevronRight className={`account__caret ${isOpen ? "is-open" : ""}`} />
              </button>

              {isOpen && (
                <div className="account__body">
                  {id === "name" && <NameForm initialName={user.name} initialEmail={user.email} />}
                  {id === "password" && <PasswordForm />}
                  {id === "2fa" && <TwoFactorForm />}
                  {id === "verify" && <VerifyForm />}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
