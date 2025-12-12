import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import axios from "axios";
import type { AxiosError } from "axios";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";

const theme = {
  bg: {
    dark: "#0a0a0c",
    card: "#141418",
    input: "#1c1c22",
  },
  accent: {
    primary: "#6366f1",
    secondary: "#8b5cf6",
    success: "#22c55e",
    danger: "#ef4444",
  },
  text: {
    primary: "#f4f4f5",
    secondary: "#a1a1aa",
    muted: "#71717a",
    placeholder: "#52525b",
  },
  border: {
    subtle: "#27272a",
    focus: "#6366f1",
  },
  gradient: {
    primary: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    glow: "0 4px 20px rgba(99, 102, 241, 0.3)",
  },
};

export default function Register() {
  const { setAuthData, username: currentUser } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [telegram, setTelegram] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (currentUser) {
      navigate("/cabinet");
    }
  }, [currentUser, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username || !telegram || !password || !confirmPassword) {
      setError(t("fill_all_fields"));
      return;
    }
    if (!telegram.startsWith('@')) {
      setError('Telegram должен начинаться с @');
      return;
    }

    if (password !== confirmPassword) {
      setError(t("auth.passwordMismatch"));
      return;
    }

    if (password.length < 6) {
      setError(t("auth.passwordTooShort"));
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post("/api/v1/auth/register", {
        username,
        telegram,
        password,
        password_confirm: confirmPassword
      });

      setAuthData(res.data.username, res.data.role || "user", res.data.is_verified, res.data.token, res.data.balance || 0);
      setSuccess(true);
      setTimeout(() => {
        navigate("/cabinet");
      }, 1000);
    } catch (err) {
      const error = err as AxiosError;
      if (error.response?.data) {
        const errors = error.response.data;
        if (typeof errors === "object") {
          const errorMessage = Object.values(errors).flat().join(", ");
          setError(errorMessage as string);
        } else {
          setError(t("auth.registerError"));
        }
      } else {
        setError(t("network_error"));
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "14px 16px",
    backgroundColor: theme.bg.input,
    border: `1px solid ${theme.border.subtle}`,
    borderRadius: "12px",
    color: theme.text.primary,
    fontSize: "15px",
    outline: "none",
    transition: "all 0.2s ease",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    marginBottom: "8px",
    color: theme.text.secondary,
    fontSize: "14px",
    fontWeight: 500,
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: theme.bg.dark,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Background decorative elements */}
      <div
        style={{
          position: "absolute",
          top: "-30%",
          left: "-20%",
          width: "60%",
          height: "60%",
          background: `radial-gradient(ellipse at center, ${theme.accent.primary}12 0%, ${theme.accent.primary}05 40%, transparent 70%)`,
          pointerEvents: "none",
          filter: "blur(40px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-30%",
          right: "-20%",
          width: "60%",
          height: "60%",
          background: `radial-gradient(ellipse at center, ${theme.accent.secondary}12 0%, ${theme.accent.secondary}05 40%, transparent 70%)`,
          pointerEvents: "none",
          filter: "blur(40px)",
        }}
      />

      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          backgroundColor: theme.bg.card,
          borderRadius: "20px",
          padding: "40px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          border: `1px solid ${theme.border.subtle}`,
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Logo */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                background: theme.gradient.primary,
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: theme.gradient.glow,
              }}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <span
              style={{
                fontSize: "28px",
                fontWeight: 700,
                background: theme.gradient.primary,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                letterSpacing: "-0.5px",
              }}
            >
              TrustX
            </span>
          </div>
        </div>

        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <h1
            style={{
              color: theme.text.primary,
              fontSize: "24px",
              fontWeight: 600,
              margin: 0,
              marginBottom: "8px",
            }}
          >
            {t("auth.createAccount")}
          </h1>
          <p
            style={{
              color: theme.text.muted,
              fontSize: "14px",
              margin: 0,
            }}
          >
            {t("auth.registerSubtitle")}
          </p>
        </div>

        {/* Success message */}
        {success && (
          <div
            style={{
              padding: "12px 16px",
              backgroundColor: `${theme.accent.success}15`,
              border: `1px solid ${theme.accent.success}30`,
              borderRadius: "10px",
              marginBottom: "20px",
              color: theme.accent.success,
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M9 12l2 2 4-4" />
            </svg>
            {t("success")}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div
            style={{
              padding: "12px 16px",
              backgroundColor: `${theme.accent.danger}15`,
              border: `1px solid ${theme.accent.danger}30`,
              borderRadius: "10px",
              marginBottom: "20px",
              color: theme.accent.danger,
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Username */}
          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>{t("username")}</label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                required
                autoComplete="off"
                style={inputStyle}
                onFocus={(e) => {
                  e.target.style.borderColor = theme.border.focus;
                  e.target.style.boxShadow = `0 0 0 3px ${theme.accent.primary}20`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = theme.border.subtle;
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>
          </div>

          {/* Telegram */}
          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Telegram <span style={{ color: theme.text.muted, fontWeight: 400 }}>({t("for_contact")})</span></label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                value={telegram}
                onChange={(e) => setTelegram(e.target.value)}
                placeholder="@username"
                required
                autoComplete="off"
                style={inputStyle}
                onFocus={(e) => {
                  e.target.style.borderColor = theme.border.focus;
                  e.target.style.boxShadow = `0 0 0 3px ${theme.accent.primary}20`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = theme.border.subtle;
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>{t("auth.password")}</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="off"
                style={{
                  ...inputStyle,
                  paddingRight: "48px",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = theme.border.focus;
                  e.target.style.boxShadow = `0 0 0 3px ${theme.accent.primary}20`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = theme.border.subtle;
                  e.target.style.boxShadow = "none";
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: theme.text.muted,
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {showPassword ? (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            <p
              style={{
                fontSize: "12px",
                color: theme.text.muted,
                marginTop: "6px",
              }}
            >
              {t("auth.passwordHint")}
            </p>
          </div>

          {/* Confirm Password */}
          <div style={{ marginBottom: "24px" }}>
            <label style={labelStyle}>{t("auth.confirmPassword")}</label>
            <div style={{ position: "relative" }}>
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="off"
                style={{
                  ...inputStyle,
                  paddingRight: "48px",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = theme.border.focus;
                  e.target.style.boxShadow = `0 0 0 3px ${theme.accent.primary}20`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = theme.border.subtle;
                  e.target.style.boxShadow = "none";
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: "absolute",
                  right: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: theme.text.muted,
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {showConfirmPassword ? (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              background: loading ? theme.bg.input : theme.gradient.primary,
              border: "none",
              borderRadius: "12px",
              color: theme.text.primary,
              fontSize: "15px",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.2s ease",
              boxShadow: loading ? "none" : theme.gradient.glow,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
            }}
          >
            {loading ? (
              <>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{
                    animation: "spin 1s linear infinite",
                  }}
                >
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                {t("common.loading")}
              </>
            ) : (
              <>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                  <line x1="20" y1="8" x2="20" y2="14" />
                  <line x1="23" y1="11" x2="17" y2="11" />
                </svg>
                {t("auth.register")}
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            margin: "28px 0",
            gap: "16px",
          }}
        >
          <div
            style={{
              flex: 1,
              height: "1px",
              backgroundColor: theme.border.subtle,
            }}
          />
          <span style={{ color: theme.text.muted, fontSize: "13px" }}>
            {t("auth.or")}
          </span>
          <div
            style={{
              flex: 1,
              height: "1px",
              backgroundColor: theme.border.subtle,
            }}
          />
        </div>

        {/* Login Link */}
        <div style={{ textAlign: "center" }}>
          <span style={{ color: theme.text.muted, fontSize: "14px" }}>
            {t("auth.alreadyHaveAccount")}{" "}
          </span>
          <Link
            to="/login"
            style={{
              color: theme.accent.primary,
              textDecoration: "none",
              fontWeight: 500,
              fontSize: "14px",
              transition: "color 0.2s ease",
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.color = theme.accent.secondary)
            }
            onMouseOut={(e) =>
              (e.currentTarget.style.color = theme.accent.primary)
            }
          >
            {t("auth.login")}
          </Link>
        </div>
      </div>

      {/* Keyframes for spinner animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
