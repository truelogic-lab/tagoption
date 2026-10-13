import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  LuMail, LuLock, LuEye, LuEyeOff, LuUser, LuArrowRight,
} from "react-icons/lu";
import { signIn, signUp } from "../lib/auth";

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/trade";

  const [mode, setMode] = useState("login");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const isLogin = mode === "login";
  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const switchMode = (m) => { setMode(m); setError(""); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isLogin) {
        await signIn({ email: form.email, password: form.password });
      } else {
        await signUp({ name: form.name, email: form.email, password: form.password });
      }
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth">
      <div className="auth__panel">
        <Link to="/" className="auth__brand">
          <span className="auth__brand-badge">T</span>
          <span className="auth__brand-text">TAGOPTION</span>
        </Link>

        <div className="auth__head">
          <h1 className="auth__title">
            {isLogin ? "Welcome back." : "Create your account."}
          </h1>
          <p className="auth__subtitle">
            {isLogin
              ? "Sign in to pick up where you left off."
              : "Takes under a minute. No paperwork, no waiting."}
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

        <form className="auth__form" onSubmit={handleSubmit}>
          {!isLogin && (
            <label className="auth__field">
              <span className="auth__label">Full name</span>
              <div className="auth__input">
                <LuUser className="auth__input-icon" />
                <input
                  type="text"
                  placeholder="Warren Musungu"
                  value={form.name}
                  onChange={update("name")}
                  required
                  autoComplete="name"
                />
              </div>
            </label>
          )}

          <label className="auth__field">
            <span className="auth__label">Email address</span>
            <div className="auth__input">
              <LuMail className="auth__input-icon" />
              <input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={update("email")}
                required
                autoComplete="email"
              />
            </div>
          </label>

          <label className="auth__field">
            <span className="auth__label">Password</span>
            <div className="auth__input">
              <LuLock className="auth__input-icon" />
              <input
                type={showPass ? "text" : "password"}
                placeholder="At least 6 characters"
                value={form.password}
                onChange={update("password")}
                required
                minLength={6}
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
          </label>

          {isLogin && (
            <div className="auth__row">
              <label className="auth__check">
                <input type="checkbox" />
                <span>Keep me signed in</span>
              </label>
              <a href="#" className="auth__link">Forgot password?</a>
            </div>
          )}

          {error && <div className="auth__error">{error}</div>}

          <button
            type="submit"
            className="btn btn-primary auth__submit"
            disabled={loading}
          >
            {loading ? "Please wait…" : isLogin ? "Sign In" : "Create Account"}
            {!loading && <LuArrowRight />}
          </button>

          <p className="auth__foot">
            {isLogin ? "New to TagOption? " : "Already have an account? "}
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
          <h2 className="auth__aside-title">
            Trade volatility indices<br />
            without the <span className="accent">learning curve</span>.
          </h2>
          <p className="auth__aside-text">
            Fund with M-Pesa, USDT, or card. Place your first trade in under
            five minutes. Withdraw whenever you want.
          </p>

          <div className="auth__stats">
            <div className="auth__stat"><strong>150+</strong><span>Markets</span></div>
            <div className="auth__stat"><strong>24/7</strong><span>Trading hours</span></div>
            <div className="auth__stat"><strong>$1</strong><span>Minimum trade</span></div>
            <div className="auth__stat"><strong>99.9%</strong><span>Uptime</span></div>
          </div>
        </div>
      </aside>
    </div>
  );
}
