import React, { type JSX } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useState, useEffect } from "react";

// === TRUSTX DESIGN SYSTEM ===
export const theme = {
  bg: {
    dark: "#0a0a0c",
    sidebar: "#0f0f12",
    card: "#141418",
    cardHover: "#1a1a1f",
    input: "#1c1c22",
  },
  accent: {
    primary: "#6366f1",
    secondary: "#8b5cf6",
    success: "#10b981",
    warning: "#f59e0b",
    danger: "#ef4444",
    info: "#06b6d4",
  },
  text: {
    primary: "#f4f4f5",
    secondary: "#a1a1aa",
    muted: "#71717a",
    accent: "#6366f1",
  },
  border: {
    subtle: "#27272a",
    default: "#3f3f46",
  },
  gradient: {
    primary: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    success: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    danger: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
    // CSS box-shadow used for subtle glow around cards/buttons
    glow: "0 12px 40px rgba(99,102,241,0.08)",
  }
};

// Icon component
export function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const icons: Record<string, JSX.Element> = {
    "grid": <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    "credit-card": <><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></>,
    "download": <><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
    "upload": <><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>,
    "smartphone": <><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></>,
    "user": <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    "users": <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></>,
    "settings": <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></>,
    "logout": <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
    "globe": <><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></>,
    "check": <><polyline points="20 6 9 17 4 12"/></>,
    "x": <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    "trash": <><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></>,
    "plus": <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    "shield": <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>,
    "dollar": <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></>,
    "activity": <><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></>,
    "home": <><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>,
    "arrow-left": <><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></>,
    "copy": <><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></>,
    "clock": <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    "alert-circle": <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>,
    "search": <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    "mail": <><rect x="3" y="5" width="18" height="14" rx="2"/><polyline points="3 7 12 13 21 7"/></>,
    "telegram": <><circle cx="12" cy="12" r="10"/><polygon points="8 12 12 14 16 10 12 12 8 10"/></>,
    "trending-up": <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>,
  };
  
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {icons[name] || null}
    </svg>
  );
}

// Navigation items for different roles
const getNavItems = (role: string) => {
  const baseItems = [
    { id: "dashboard", icon: "grid", label: "dashboard", path: "/cabinet" },
    { id: "requisites", icon: "credit-card", label: "requisites", path: "/requisites" },
    { id: "orders", icon: "activity", label: "orders", path: "/orders" },
    { id: "arbitration", icon: "shield", label: "arbitration", path: "/arbitration" },
    { id: "devices", icon: "smartphone", label: "devices", path: "/devices" },
    { id: "deposits", icon: "download", label: "deposits", path: "/deposit" },
    { id: "withdrawals", icon: "upload", label: "withdrawals", path: "/withdrawals" },
    { id: "messages", icon: "activity", label: "messages", path: "/messages" },
    { id: "profile", icon: "user", label: "profile", path: "/profile" },
  ];
  
  if (role === "admin") {
    baseItems.push({ id: "admin", icon: "shield", label: "admin_panel", path: "/admin" });
  }
  
  return baseItems;
};

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  headerExtra?: React.ReactNode;
}

export default function DashboardLayout({ children, title, subtitle, headerExtra }: DashboardLayoutProps) {
  const { username, role, isVerified, logout, balance } = useAuth();
  const { t, lang, setLang } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Close sidebar when navigating on mobile
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [location.pathname, isMobile]);
  
  const navItems = getNavItems(role || "user");
  const activeNav = navItems.find(item => item.path === location.pathname)?.id || "dashboard";
  
  // Format number
  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (!username) {
    return null;
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: theme.bg.dark,
      color: theme.text.primary,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      display: "flex",
    }}>
      {/* Mobile Header */}
      {isMobile && (
        <header style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: 60,
          background: theme.bg.sidebar,
          borderBottom: `1px solid ${theme.border.subtle}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          zIndex: 200,
        }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: "none",
              border: "none",
              color: theme.text.primary,
              padding: 8,
              cursor: "pointer",
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="28" height="28" viewBox="0 0 48 48" fill="none">
              <defs>
                <linearGradient id="mobileLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: "#6366f1" }}/>
                  <stop offset="100%" style={{ stopColor: "#8b5cf6" }}/>
                </linearGradient>
              </defs>
              <rect x="4" y="4" width="40" height="40" rx="10" fill="url(#mobileLogoGradient)"/>
              <path d="M14 14H34V20H27V36H21V20H14V14Z" fill="white"/>
            </svg>
            <span style={{ fontWeight: 700, fontSize: 16 }}>Trust<span style={{ color: theme.accent.primary }}>X</span></span>
          </div>
          <div style={{ 
            fontSize: 12, 
            color: theme.accent.success,
            fontFamily: "monospace",
            fontWeight: 600,
          }}>
            {fmt(balance || 0)}
          </div>
        </header>
      )}

      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 150,
          }}
        />
      )}

      {/* Sidebar */}
      <aside style={{
        width: 240,
        background: theme.bg.sidebar,
        borderRight: `1px solid ${theme.border.subtle}`,
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        height: "100vh",
        zIndex: 200,
        transform: isMobile ? (sidebarOpen ? "translateX(0)" : "translateX(-100%)") : "none",
        transition: "transform 0.3s ease",
      }}>
        {/* Logo */}
        <div style={{ padding: "20px 16px", borderBottom: `1px solid ${theme.border.subtle}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
              <defs>
                <linearGradient id="sidebarLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: "#6366f1" }}/>
                  <stop offset="100%" style={{ stopColor: "#8b5cf6" }}/>
                </linearGradient>
              </defs>
              <rect x="4" y="4" width="40" height="40" rx="10" fill="url(#sidebarLogoGradient)"/>
              <path d="M14 14H34V20H27V36H21V20H14V14Z" fill="white"/>
            </svg>
            <div>
              <div style={{ fontWeight: 700, fontSize: 18, letterSpacing: "-0.02em", display: "flex", alignItems: "center" }}>
                <span style={{ color: theme.text.primary }}>Trust</span>
                <span style={{ background: "linear-gradient(135deg, #8b5cf6, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>X</span>
              </div>
              <div style={{ fontSize: 11, color: theme.text.muted, letterSpacing: "0.05em" }}>PROCESSING</div>
            </div>
          </div>
        </div>

        {/* User Profile Section */}
        <div style={{ 
          padding: "16px 12px", 
          borderBottom: `1px solid ${theme.border.subtle}`,
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 14px",
            background: theme.bg.card,
            borderRadius: 12,
            border: `1px solid ${theme.border.subtle}`,
          }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: theme.gradient.primary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 600,
              fontSize: 16,
            }}>
              {username.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ 
                fontWeight: 600, 
                fontSize: 14, 
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}>
                {username}
              </div>
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: 4,
                fontSize: 11,
                color: isVerified ? theme.accent.success : theme.accent.warning,
              }}>
                <Icon name="check" size={12} />
                {isVerified ? t("verified") : t("pending")}
              </div>
            </div>
          </div>
          
          {/* Balance */}
          <div style={{
            marginTop: 12,
            padding: "12px 14px",
            background: `${theme.accent.success}10`,
            borderRadius: 10,
            border: `1px solid ${theme.accent.success}30`,
          }}>
            <div style={{ fontSize: 11, color: theme.text.muted, marginBottom: 4 }}>{t("available_balance")}</div>
            <div style={{ 
              fontFamily: "monospace", 
              fontWeight: 700, 
              fontSize: 18,
              color: theme.accent.success,
            }}>
              {fmt(balance || 0)} <span style={{ fontSize: 12, opacity: 0.7 }}>USDT</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: "16px 12px", overflowY: "auto" }}>
          {navItems.map(item => (
            <Link
              key={item.id}
              to={item.path}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 14px",
                marginBottom: 4,
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 500,
                color: activeNav === item.id ? theme.text.primary : theme.text.secondary,
                background: activeNav === item.id ? theme.bg.card : "transparent",
                textDecoration: "none",
                transition: "all 0.15s ease",
              }}
            >
              <span style={{ opacity: activeNav === item.id ? 1 : 0.6 }}>
                <Icon name={item.icon} size={20} />
              </span>
              {t(item.label)}
              {activeNav === item.id && (
                <div style={{
                  marginLeft: "auto",
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: theme.accent.primary,
                }} />
              )}
            </Link>
          ))}
        </nav>

        {/* User & Settings */}
        <div style={{ padding: "16px 12px", borderTop: `1px solid ${theme.border.subtle}` }}>
          <button
            onClick={() => setLang(lang === "en" ? "ru" : "en")}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 14px",
              marginBottom: 4,
              borderRadius: 10,
              fontSize: 14,
              color: theme.text.secondary,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <Icon name="globe" size={20} />
            {lang === "en" ? "English" : "Русский"}
          </button>
          <button
            onClick={logout}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 14px",
              borderRadius: 10,
              fontSize: 14,
              color: theme.accent.danger,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <Icon name="logout" size={20} />
            {t("logout")}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ 
        flex: 1, 
        marginLeft: isMobile ? 0 : 240, 
        marginTop: isMobile ? 60 : 0,
        position: "relative", 
        overflow: "hidden",
        minHeight: isMobile ? "calc(100vh - 60px)" : "100vh",
      }}>
        {/* Background decorative elements */}
        <div
          style={{
            position: "absolute",
            top: "-20%",
            right: "-10%",
            width: "50%",
            height: "50%",
            background: `radial-gradient(ellipse at center, ${theme.accent.primary}08 0%, ${theme.accent.primary}03 40%, transparent 70%)`,
            pointerEvents: "none",
            filter: "blur(60px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-20%",
            left: "-10%",
            width: "50%",
            height: "50%",
            background: `radial-gradient(ellipse at center, ${theme.accent.secondary}08 0%, ${theme.accent.secondary}03 40%, transparent 70%)`,
            pointerEvents: "none",
            filter: "blur(60px)",
          }}
        />
        <div style={{ padding: isMobile ? 16 : 32, position: "relative", zIndex: 1 }}>
          {/* Page Title + Extra */}
          <div style={{ 
            marginBottom: isMobile ? 16 : 24, 
            display: "flex", 
            alignItems: isMobile ? "flex-start" : "center", 
            justifyContent: "space-between", 
            gap: 16,
            flexDirection: isMobile ? "column" : "row",
          }}>
            <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>
              {title}
            </h1>
            {headerExtra && (
              <div style={{ width: isMobile ? "100%" : "auto" }}>{headerExtra}</div>
            )}
          </div>
          {subtitle && (
            <p style={{ fontSize: 14, color: theme.text.muted, marginTop: 4 }}>
              {subtitle}
            </p>
          )}
          {/* Content */}
          {children}
        </div>
      </main>
    </div>
  );
}
