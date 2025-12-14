import type { Route } from "./+types/login";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import axios from "axios";
import type { AxiosError } from "axios";
import { useAuth } from "../contexts/AuthContext";

const theme = {
  bg: { dark: "#0a0a0c", card: "#141418", input: "#1c1c22" },
  accent: { primary: "#6366f1", secondary: "#8b5cf6", success: "#10b981", danger: "#ef4444" },
  text: { primary: "#f4f4f5", secondary: "#a1a1aa", muted: "#71717a" },
  border: { subtle: "#27272a", default: "#3f3f46" },
  gradient: { primary: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" }
};

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Вход | TrustX" },
    { name: "description", content: "Войдите в свой аккаунт TrustX" },
  ];
}

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  const { setAuthData } = useAuth();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  async function handleLogin() {
    if (!username || !password) {
      setMessage("Заполните все поля");
      setIsSuccess(false);
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const res = await axios.post("/api/v1/auth/login", {
        username,
        password
      });

      setAuthData(res.data.username, res.data.role || "user", res.data.is_verified, res.data.token, res.data.balance || 0);

      setMessage("Добро пожаловать!");
      setIsSuccess(true);
      setTimeout(() => {
        navigate("/");
      }, 1000);
    } catch (e) {
      const error = e as AxiosError;
      setIsSuccess(false);
      if (error.response?.data) {
        const errors = error.response.data;
        if (typeof errors === "object") {
          const errorMessage = Object.values(errors).flat().join(", ");
          setMessage(errorMessage as string);
        } else {
          setMessage("Неверный логин или пароль");
        }
      } else {
        setMessage("Ошибка подключения к серверу");
      }
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "14px 16px",
    background: theme.bg.input,
    border: `1px solid ${theme.border.subtle}`,
    borderRadius: 12,
    color: theme.text.primary,
    fontSize: 15,
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
    boxSizing: "border-box",
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: theme.bg.dark,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
      position: "relative",
      overflow: "hidden",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
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
      {/* Login Card */}
      <div style={{
        width: "100%",
        maxWidth: 420,
        background: theme.bg.card,
        borderRadius: isMobile ? 16 : 20,
        padding: isMobile ? 24 : 40,
        border: `1px solid ${theme.border.subtle}`,
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: isMobile ? 24 : 32, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <svg width={isMobile ? 48 : 56} height={isMobile ? 48 : 56} viewBox="0 0 48 48" fill="none" style={{ marginBottom: isMobile ? 12 : 16, filter: "drop-shadow(0 8px 24px rgba(99, 102, 241, 0.3))" }}>
            <defs>
              <linearGradient id="loginLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: "#6366f1" }}/>
                <stop offset="100%" style={{ stopColor: "#8b5cf6" }}/>
              </linearGradient>
            </defs>
            <rect x="4" y="4" width="40" height="40" rx="10" fill="url(#loginLogoGradient)"/>
            <path d="M14 14H34V20H27V36H21V20H14V14Z" fill="white"/>
          </svg>
          <h1 style={{
            margin: 0,
            fontSize: isMobile ? 24 : 28,
            fontWeight: 700,
            color: theme.text.primary,
            marginBottom: 8,
          }}>
            Добро пожаловать
          </h1>
          <p style={{
            margin: 0,
            fontSize: 15,
            color: theme.text.muted,
          }}>
            Войдите в свой аккаунт <span style={{ fontWeight: 600, color: theme.text.primary }}>Trust</span><span style={{ fontWeight: 700, color: theme.accent.secondary }}>X</span>
          </p>
        </div>

        {/* Form */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Username */}
          <div>
            <label style={{
              display: "block",
              fontSize: 13,
              fontWeight: 500,
              color: theme.text.secondary,
              marginBottom: 8,
            }}>
              Имя пользователя
            </label>
            <input
              type="text"
              placeholder="Введите логин"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoComplete="off"
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              style={inputStyle}
              onFocus={e => {
                e.currentTarget.style.borderColor = theme.accent.primary;
                e.currentTarget.style.boxShadow = `0 0 0 3px rgba(99, 102, 241, 0.15)`;
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = theme.border.subtle;
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          {/* Password */}
          <div>
            <label style={{
              display: "block",
              fontSize: 13,
              fontWeight: 500,
              color: theme.text.secondary,
              marginBottom: 8,
            }}>
              Пароль
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Введите пароль"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="off"
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                style={{ ...inputStyle, paddingRight: 48 }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = theme.accent.primary;
                  e.currentTarget.style.boxShadow = `0 0 0 3px rgba(99, 102, 241, 0.15)`;
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = theme.border.subtle;
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: theme.text.muted,
                  cursor: "pointer",
                  padding: 4,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Error/Success Message */}
          {message && (
            <div style={{
              padding: "12px 16px",
              background: isSuccess ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
              border: `1px solid ${isSuccess ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
              borderRadius: 10,
              color: isSuccess ? theme.accent.success : theme.accent.danger,
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {isSuccess ? (
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3"/>
                ) : (
                  <>
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </>
                )}
              </svg>
              {message}
            </div>
          )}

          {/* Login Button */}
          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px 20px",
              background: loading ? theme.border.default : theme.gradient.primary,
              color: "white",
              border: "none",
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "transform 0.2s, box-shadow 0.2s, opacity 0.2s",
              opacity: loading ? 0.7 : 1,
              marginTop: 8,
            }}
            onMouseOver={e => {
              if (!loading) {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(99, 102, 241, 0.4)";
              }
            }}
            onMouseOut={e => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" style={{ animation: "spin 1s linear infinite" }}>
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="32" strokeLinecap="round"/>
                </svg>
                Вход...
              </span>
            ) : (
              "Войти"
            )}
          </button>
        </div>

        {/* Register Link */}
        <div style={{
          marginTop: 24,
          paddingTop: 24,
          borderTop: `1px solid ${theme.border.subtle}`,
          textAlign: "center",
        }}>
          <p style={{
            margin: 0,
            fontSize: 14,
            color: theme.text.muted,
          }}>
            Нет аккаунта?{" "}
            <Link
              to="/register"
              style={{
                color: theme.accent.primary,
                textDecoration: "none",
                fontWeight: 500,
                transition: "color 0.2s",
              }}
              onMouseOver={e => e.currentTarget.style.color = theme.accent.secondary}
              onMouseOut={e => e.currentTarget.style.color = theme.accent.primary}
            >
              Зарегистрироваться
            </Link>
          </p>
        </div>
      </div>

      {/* Spinner animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
