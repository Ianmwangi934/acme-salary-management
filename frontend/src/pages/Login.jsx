
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  UserRound,
  ShieldCheck,
  BarChart3,
  UsersRound,
  Wallet,
  CheckCircle2,
  LoaderCircle,
} from "lucide-react";

import api from "../api/client";
import "../styles/login.css";

export default function Login({ onLogin }) {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.get("auth/csrf/");

      const response = await api.post("auth/login/", {
        username,
        password,
      });

      onLogin(response.data);
      navigate("/");
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to sign in. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="acme-login">
      {/* Branding panel */}
      <section className="login-brand-panel">
        <div className="brand-glow brand-glow-one" />
        <div className="brand-glow brand-glow-two" />

        <div className="brand-content">
          <div className="brand-logo">
            <div className="brand-logo-icon">
              <Wallet size={23} strokeWidth={2.2} />
            </div>

            <div className="brand-logo-text">
              <span>ACME</span>
              <small>PEOPLE & PAYROLL</small>
            </div>
          </div>

          <div className="brand-hero">
            <div className="brand-eyebrow">
              <span className="eyebrow-dot" />
              WORKFORCE INTELLIGENCE
            </div>

            <h1>
              People first.
              <br />
              <span>Progress always.</span>
            </h1>

            <p>
              A smarter way to manage your workforce,
              simplify compensation, and make confident
              people decisions.
            </p>

            <div className="brand-feature-list">
              <div className="brand-feature">
                <span className="brand-feature-icon">
                  <UsersRound size={19} />
                </span>
                <div>
                  <strong>Employee Management</strong>
                  <small>
                    Your entire workforce, one place.
                  </small>
                </div>
              </div>

              <div className="brand-feature">
                <span className="brand-feature-icon">
                  <BarChart3 size={19} />
                </span>
                <div>
                  <strong>Workforce Analytics</strong>
                  <small>
                    Insights that drive better decisions.
                  </small>
                </div>
              </div>

              <div className="brand-feature">
                <span className="brand-feature-icon">
                  <ShieldCheck size={19} />
                </span>
                <div>
                  <strong>Controlled Access</strong>
                  <small>
                    Role-based access to sensitive data.
                  </small>
                </div>
              </div>
            </div>
          </div>

          <div className="brand-footer">
            <div className="brand-footer-line" />
            <p>
              Built for modern teams.
              <span> Designed for clarity.</span>
            </p>
          </div>
        </div>
      </section>

      {/* Authentication panel */}
      <section className="login-form-panel">
        <div className="login-form-wrapper">
          <div className="mobile-brand">
            <div className="brand-logo-icon">
              <Wallet size={21} />
            </div>
            <strong>ACME HR</strong>
          </div>

          <div className="login-heading">
            <div className="login-welcome-badge">
              <CheckCircle2 size={14} />
              HR MANAGEMENT PORTAL
            </div>

            <h2>Welcome back<span>.</span></h2>

            <p>
              Enter your credentials to access your
              workspace.
            </p>
          </div>

          <form
            className="acme-login-form"
            onSubmit={handleSubmit}
          >
            {error && (
              <div className="login-error" role="alert">
                <span className="error-symbol">!</span>
                <span>{error}</span>
              </div>
            )}

            <div className="login-field">
              <label htmlFor="username">Username</label>

              <div className="login-input-wrapper">
                <UserRound
                  size={19}
                  className="login-input-icon"
                />

                <input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  autoComplete="username"
                  value={username}
                  onChange={(e) =>
                    setUsername(e.target.value)
                  }
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="password">Password</label>

              <div className="login-input-wrapper">
                <LockKeyhole
                  size={19}
                  className="login-input-icon"
                />

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  disabled={loading}
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  aria-pressed={showPassword}
                >
                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="login-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <LoaderCircle
                    size={19}
                    className="login-spinner"
                  />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in to dashboard
                  <ArrowRight size={19} />
                </>
              )}
            </button>
          </form>

          <div className="login-security-note">
            <ShieldCheck size={17} />
            <span>
              Authorized HR personnel only.
            </span>
          </div>

          <div className="login-bottom">
            <p>
              Need access? Contact your HR administrator.
            </p>
          </div>
        </div>

        <div className="login-copyright">
          © {new Date().getFullYear()} ACME.
          All rights reserved.
        </div>
      </section>
    </div>
  );
}
