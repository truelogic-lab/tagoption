import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  LuMail,
  LuLock,
  LuEye,
  LuEyeOff,
  LuUser,
  LuArrowRight,
  LuTriangleAlert,
  LuCheck,
} from "react-icons/lu";

import { signIn, signUp } from "../lib/auth";
import { useSite } from "../lib/SiteContext";
import BrandMark from "../components/ui/BrandMark";

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const site = useSite();
  const from = location.state?.from || "/trade";

  const [mode, setMode] = useState("login");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [touched, setTouched] = useState({});

  const isLogin = mode === "login";

  const update = (key) => (event) =>
    setForm((current) => ({
      ...current,
      [key]: event.target.value,
    }));

  const blur = (key) => () =>
    setTouched((current) => ({
      ...current,
      [key]: true,
    }));

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError("");
    setTouched({});
    setShowPass(false);
  };

  const errors = {
    name:
      !isLogin && touched.name && form.name.trim().length < 2
        ? "Enter your full name."
        : "",
    email:
      touched.email &&
      !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())
        ? "Enter a valid email address."
        : "",
    password:
      touched.password && form.password.length < 6
        ? "Your password must contain at least 6 characters."
        : "",
  };

  const allValid =
    (isLogin || form.name.trim().length >= 2) &&
    /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim()) &&
    form.password.length >= 6;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setTouched({
      name: true,
      email: true,
      password: true,
    });

    if (!allValid) return;

    setLoading(true);

    try {
      if (isLogin) {
        await signIn({
          email: form.email.trim(),
          password: form.password,
        });
      } else {
        await signUp({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
        });
      }

      navigate(from, { replace: true });
    } catch (err) {
      setError(
        err.message || "Unable to complete your request. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth">
      <section className="auth__panel">
        <Link to="/" className="auth__brand" aria-label={`${site.name} home`}>
          <BrandMark variant="auth" />
        </Link>

        <header className="auth__head">
          <h1 className="auth__title">
            {isLogin ? "Welcome back" : "Create your account"}
          </h1>

          <p className="auth__subtitle">
            {isLogin
              ? "Sign in to access your trading account."
              : "Set up your account to get started."}
          </p>
        </header>

        <div className="auth__switch" role="group" aria-label="Account access">
          <button
            type="button"
            className={`auth__switch-btn ${isLogin ? "is-active" : ""}`}
            onClick={() => switchMode("login")}
            aria-pressed={isLogin}
          >
            Sign In
          </button>

          <button
            type="button"
            className={`auth__switch-btn ${!isLogin ? "is-active" : ""}`}
            onClick={() => switchMode("signup")}
            aria-pressed={!isLogin}
          >
            Create Account
          </button>
        </div>

        <form className="auth__form" onSubmit={handleSubmit} noValidate>
          {!isLogin && (
            <label className="auth__field">
              <span className="auth__label">Full name</span>

              <span className={`auth__input ${errors.name ? "is-error" : ""}`}>
                <LuUser className="auth__input-icon" aria-hidden="true" />

                <input
                  type="text"
                  name="name"
                  placeholder="Enter your full name"
                  value={form.name}
                  onChange={update("name")}
                  onBlur={blur("name")}
                  autoComplete="name"
                  autoFocus
                  aria-invalid={Boolean(errors.name)}
                />
              </span>

              {errors.name && (
                <span className="auth__field-error">{errors.name}</span>
              )}
            </label>
          )}

          <label className="auth__field">
            <span className="auth__label">Email address</span>

            <span className={`auth__input ${errors.email ? "is-error" : ""}`}>
              <LuMail className="auth__input-icon" aria-hidden="true" />

              <input
                type="email"
                name="email"
                placeholder="Enter your email address"
                value={form.email}
                onChange={update("email")}
                onBlur={blur("email")}
                autoComplete="email"
                autoFocus={isLogin}
                aria-invalid={Boolean(errors.email)}
              />
            </span>

            {errors.email && (
              <span className="auth__field-error">{errors.email}</span>
            )}
          </label>

          <label className="auth__field">
            <span className="auth__label">Password</span>

            <span
              className={`auth__input ${errors.password ? "is-error" : ""}`}
            >
              <LuLock className="auth__input-icon" aria-hidden="true" />

              <input
                type={showPass ? "text" : "password"}
                name="password"
                placeholder={
                  isLogin
                    ? "Enter your password"
                    : "Create a password (6+ characters)"
                }
                value={form.password}
                onChange={update("password")}
                onBlur={blur("password")}
                autoComplete={isLogin ? "current-password" : "new-password"}
                aria-invalid={Boolean(errors.password)}
              />

              <button
                type="button"
                className="auth__eye"
                onClick={() => setShowPass((visible) => !visible)}
                aria-label={showPass ? "Hide password" : "Show password"}
              >
                {showPass ? <LuEyeOff /> : <LuEye />}
              </button>
            </span>

            {errors.password ? (
              <span className="auth__field-error">{errors.password}</span>
            ) : (
              !isLogin && (
                <span className="auth__field-hint">
                  Use at least 6 characters.
                </span>
              )
            )}
          </label>

          {error && (
            <div className="auth__error" role="alert">
              <LuTriangleAlert aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="auth__submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="auth__spinner" aria-hidden="true" />
                {isLogin ? "Signing you in..." : "Creating your account..."}
              </>
            ) : (
              <>
                {isLogin ? "Sign In to Your Account" : "Create My Account"}
                <LuArrowRight aria-hidden="true" />
              </>
            )}
          </button>

          <p className="auth__foot">
            {isLogin
              ? `New to ${site.name}? `
              : "Already registered? "}

            <button
              type="button"
              className="auth__inline-link"
              onClick={() => switchMode(isLogin ? "signup" : "login")}
            >
              {isLogin ? "Create an account" : "Sign in instead"}
            </button>
          </p>
        </form>

        <p className="auth__legal">
          By continuing, you agree to our{" "}
          <Link to="/terms">Terms of Service</Link> and{" "}
          <Link to="/privacy">Privacy Policy</Link>.
        </p>
      </section>

      <aside className="auth__aside">
        <div className="auth__aside-inner">
          <span className="auth__aside-tag">{site.name}</span>

          <h2 className="auth__aside-title">
            Trade volatility indices with clarity.
          </h2>

          <p className="auth__aside-text">
            Explore real-time charts and trading tools designed to help
            you make informed decisions. Check available funding methods
            and transaction terms before depositing.
          </p>

          <ul className="auth__perks">
            <li><LuCheck aria-hidden="true" /> Intuitive trading interface</li>
            <li><LuCheck aria-hidden="true" /> Live market information</li>
            <li><LuCheck aria-hidden="true" /> Account and trade activity</li>
            <li><LuCheck aria-hidden="true" /> Secure account access</li>
          </ul>

          <p className="auth__aside-foot">
            Trading binary options carries significant risk. You may lose
            your entire stake. Only trade with money you can afford to lose.
          </p>
        </div>
      </aside>
    </main>
  );
}
