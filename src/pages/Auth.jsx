import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  LuMail, LuLock, LuEye, LuEyeOff, LuUser, LuArrowRight, LuTriangleAlert, LuCheck,
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
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [touched, setTouched] = useState({});

  const isLogin = mode === "login";
  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const blur = (k) => () => setTouched((t) => ({ ...t, [k]: true }));

  const switchMode = (m) => {
    setMode(m);
    setError("");
    setTouched({});
  };

  const errors = {
    name:
      !isLogin && touched.name && form.name.trim().length < 2
        ? "Enter your full name"
        : "",
    email:
      touched.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)
        ? "Enter a valid email"
        : "",
    password:
      touched.password && form.password.length < 6
        ? "Minimum 6 characters"
        : "",
  };

  const allValid =
    (isLogin || form.name.trim().length >= 2) &&
    /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email) &&
    form.password.length >= 6;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setTouched({ name: true, email: true, password: true });

    if (!allValid) return;

    setLoading(true);
    try {
      if (isLogin) {
        await signIn({ email: form.email, password: form.password });
      } else {
        await signUp({
          name: form.name.trim(),
          email: form.email,
          password: form.password,
        });
      }
      navigate(from, { replace: true });
    } catch (e) {
      setError(e.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth">
      <div className="auth__panel">
        <Link to="/" className="auth__brand">
          <BrandMark variant="auth" />
        </Link>

        <div className="auth__head">
          <h1 className="auth__title">
            {isLogin ? "Sign in" : "Create your account"}
          </h1>
          <p className="auth__subtitle">
            {isLogin
              ? "Welcome back. Pick up where you left off."
              : "Takes less than a minute."}
          </p>
        </div>

        <div className="auth__switch">
          <button
            type="button"
            className={`auth__switch-btn ${isLogin ? "is-active" : ""}`}
            onClick={() => switchMode("login")}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth__switch-btn ${!isLogin ? "is-active" : ""}`}
            onClick={() => switchMode("signup")}
          >
            Sign Up
          </button>
        </div>

        <form className="auth__form" onSubmit={handleSubmit} noValidate>
          {!isLogin && (
            <label className="auth__field">
              <span className="auth__label">Full name</span>
              <div className={`auth__input ${errors.name ? "is-error" : ""}`}>
                <LuUser className="auth__input-icon" />
                <input
                  type="text"
                  placeholder="Jane Doe"
                  value={form.name}
                  onChange={update("name")}
                  onBlur={blur("name")}
                  autoComplete="name"
                  autoFocus
                />
              </div>
              {errors.name && (
                <span className="auth__field-error">{errors.name}</span>
              )}
            </label>
          )}

          <label className="auth__field">
            <span className="auth__label">Email</span>
            <div className={`auth__input ${errors.email ? "is-error" : ""}`}>
              <LuMail className="auth__input-icon" />
              <input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={update("email")}
                onBlur={blur("email")}
                autoComplete="email"
                autoFocus={isLogin}
              />
            </div>
            {errors.email && (
              <span className="auth__field-error">{errors.email}</span>
            )}
          </label>

          <label className="auth__field">
            <span className="auth__label">Password</span>
            <div className={`auth__input ${errors.password ? "is-error" : ""}`}>
              <LuLock className="auth__input-icon" />
              <input
                type={showPass ? "text" : "password"}
                placeholder="At least 6 characters"
                value={form.password}
                onChange={update("password")}
                onBlur={blur("password")}
                autoComplete={isLogin ? "current-password" : "new-password"}
              />
              <button
                type="button"
                className="auth__eye"
                onClick={() => setShowPass((v) => !v)}
                aria-label={showPass ? "Hide password" : "Show password"}
              >
                {showPass ? <LuEyeOff /> : <LuEye />}
              </button>
            </div>
            {errors.password && (
              <span className="auth__field-error">{errors.password}</span>
            )}
          </label>

          {error && (
            <div className="auth__error">
              <LuTriangleAlert />
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
                <span className="auth__spinner" />
                Please wait…
              </>
            ) : (
              <>
                {isLogin ? "Sign In" : "Create Account"}
                <LuArrowRight />
              </>
            )}
          </button>

          <p className="auth__foot">
            {isLogin ? `New to ${site.name}? ` : "Already have an account? "}
            <button
              type="button"
              className="auth__inline-link"
              onClick={() => switchMode(isLogin ? "signup" : "login")}
            >
              {isLogin ? "Create an account" : "Sign in"}
            </button>
          </p>
        </form>

        <p className="auth__legal">
          By continuing you agree to our{" "}
          <Link to="/terms">Terms of Service</Link> and{" "}
          <Link to="/privacy">Privacy Policy</Link>.
        </p>
      </div>

      <aside className="auth__aside">
        <div className="auth__aside-inner">
          <span className="auth__aside-tag">{site.name}</span>
          <h2 className="auth__aside-title">
            Trade volatility indices with clarity.
          </h2>
          <p className="auth__aside-text">
            Real-time charts, fast execution, and payouts you can see happen.
            Fund with M-Pesa, card, or crypto.
          </p>

          <ul className="auth__perks">
            <li><LuCheck /> Start from $1 per trade</li>
            <li><LuCheck /> Deposits credited in seconds</li>
            <li><LuCheck /> Live markets, 24/7</li>
            <li><LuCheck /> Withdraw anytime</li>
          </ul>

          <p className="auth__aside-foot">
            Trading binary options carries risk. Only trade with funds you can
            afford to lose.
          </p>
        </div>
      </aside>
    </div>
  );
}
