import React, { useEffect, useState } from "react";
import { accountApi } from "../../../lib/api";

export default function TwoFactorForm() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Placeholder — the server doesn't return 2FA state yet
    setEnabled(false);
  }, []);

  const toggle = async () => {
    setLoading(true);
    try {
      if (enabled) await accountApi.disable2FA();
      else await accountApi.enable2FA();
      setEnabled((v) => !v);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="account-form">
      <p className="account-form__note">
        Add a second step to every sign-in. Use an authenticator app like Google
        Authenticator, Authy, or 1Password.
      </p>

      <div className="account-form__qr" aria-hidden="true" />

      {enabled ? (
        <div className="account-form__status account-form__status--ok">
          Two-factor authentication is enabled.
        </div>
      ) : null}

      <button className="btn btn-blue account-form__submit" onClick={toggle} disabled={loading}>
        {loading ? "Please wait…" : enabled ? "Disable 2FA" : "Enable 2FA"}
      </button>
    </div>
  );
}
