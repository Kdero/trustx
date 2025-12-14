import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import DashboardLayout, { theme, Icon } from "../components/DashboardLayout";

export default function Cabinet() {
  const { token } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"day" | "week" | "month">("week");
  const [chartPeriod, setChartPeriod] = useState<"day" | "week" | "month">("month");
  const [hoveredPoint, setHoveredPoint] = useState<{ index: number; x: number; y: number } | null>(null);
  const [showDepositSidebar, setShowDepositSidebar] = useState(false);
  const [depositMerchant, setDepositMerchant] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Stats
  const [stats, setStats] = useState({
    current_balance: 0,
    frozen_deposit: 0,
    pending: 0,
  });

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetch("/api/v1/payments/stats/", {
      headers: { Authorization: `Token ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setStats(data))
      .catch(() => {});
  }, [token, navigate]);

  // Real data for different time periods (from API)
  const [periodData, setPeriodData] = useState({
    day: { income: 0, expense: 0, net: 0, transactions: 0 },
    week: { income: 0, expense: 0, net: 0, transactions: 0 },
    month: { income: 0, expense: 0, net: 0, transactions: 0 },
  });
  const currentData = periodData[activeTab];

  // Chart data from API
  const [chartData, setChartData] = useState<{date: string; value: number}[]>([]);

  useEffect(() => {
    if (!token) return;
    // Load period analytics from API
    fetch(`/api/v1/payments/analytics/?period=${chartPeriod}`, {
      headers: { Authorization: `Token ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.chart) setChartData(data.chart);
        if (data.periods) setPeriodData(data.periods);
      })
      .catch(() => setChartData([]));
  }, [token, chartPeriod]);

  const maxChartValue = Math.max(...chartData.map((d) => d.value), 1) * 1.1;
  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <DashboardLayout title={t("dashboard")} subtitle={t("analytics")}>
      {/* Balance Cards Row */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", 
        gap: isMobile ? 16 : 20, 
        marginBottom: isMobile ? 20 : 32 
      }}>
        {/* Main Balance */}
        <div style={{
          background: theme.bg.card,
          borderRadius: 16,
          padding: isMobile ? 16 : 24,
          border: `1px solid ${theme.border.subtle}`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: `${theme.accent.primary}20`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: theme.accent.primary,
            }}>
              <Icon name="activity" />
            </div>
            <span style={{ fontSize: 14, color: theme.text.secondary }}>{t("available_balance")}</span>
          </div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: isMobile ? 24 : 32,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            marginBottom: 16,
          }}>
            {fmt(stats.current_balance)} <span style={{ fontSize: isMobile ? 12 : 16, color: theme.text.muted }}>USDT</span>
          </div>
          <div style={{ display: "flex", gap: 10, flexDirection: isMobile ? "column" : "row" }}>
            <button
              onClick={() => navigate("/deposit")}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "12px 16px",
                background: theme.gradient.primary,
                border: "none",
                borderRadius: 10,
                color: "#fff",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
                transition: "transform 0.15s, box-shadow 0.15s",
              }}
              onMouseOver={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(99,102,241,0.3)"; }}
              onMouseOut={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
            >
              <Icon name="plus" size={18} />
              {t("deposit_funds")}
            </button>
            <button
              onClick={() => navigate("/withdrawals")}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "12px 16px",
                background: theme.bg.input,
                border: `1px solid ${theme.border.default}`,
                borderRadius: 10,
                color: theme.text.primary,
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
                textAlign: "center",
              }}
            >
              <Icon name="upload" size={18} />
              {t("withdrawal")}
            </button>
          </div>
        </div>

        {/* Frozen */}
        <div style={{
          background: theme.bg.card,
          borderRadius: 16,
          padding: isMobile ? 16 : 24,
          border: `1px solid ${theme.border.subtle}`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: `${theme.accent.warning}20`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: theme.accent.warning,
            }}>
              <Icon name="clock" />
            </div>
            <span style={{ fontSize: 14, color: theme.text.secondary }}>{t("frozen")}</span>
          </div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: isMobile ? 24 : 32,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            marginBottom: 8,
          }}>
            {fmt(stats.frozen_deposit)} <span style={{ fontSize: isMobile ? 12 : 16, color: theme.text.muted }}>USDT</span>
          </div>
          <span style={{ fontSize: 13, color: theme.text.muted }}>{t("in_processing")}</span>
        </div>

        {/* Net P&L Card */}
        <div style={{
          background: theme.bg.card,
          borderRadius: 16,
          padding: isMobile ? 16 : 24,
          border: `1px solid ${theme.border.subtle}`,
          position: "relative",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: `${theme.accent.success}10`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <Icon name="trending-up" />
            </div>
            <span style={{ color: theme.text.primary, fontWeight: 600, fontSize: isMobile ? 16 : 18 }}>{t("net_pl")}</span>
            <div style={{ flex: 1 }} />
            {/* Period Switcher */}
            <div style={{ display: "flex", gap: 4 }}>
              {(['day', 'week', 'month'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: isMobile ? "4px 8px" : "6px 12px",
                    fontSize: isMobile ? 11 : 12,
                    fontWeight: 500,
                    color: activeTab === tab ? theme.text.primary : theme.text.muted,
                    background: activeTab === tab ? theme.bg.card : "transparent",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                  }}
                >
                  {t(tab)}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <span style={{ color: theme.accent.success, fontWeight: 700, fontSize: isMobile ? 24 : 32 }}>
              +{fmt(currentData.net)}
            </span>
            <span style={{ color: theme.text.muted, fontSize: isMobile ? 14 : 18, fontWeight: 500 }}>USDT</span>
          </div>
          <div style={{ color: theme.text.muted, fontSize: isMobile ? 13 : 15, marginBottom: 18 }}>{t("profit")}</div>
        </div>
      </div>

      {/* Charts & Analytics Row */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr", gap: isMobile ? 16 : 20, marginBottom: isMobile ? 20 : 32 }}>
        {/* Income Chart */}
        <div style={{
          background: theme.bg.card,
          borderRadius: 16,
          padding: isMobile ? 16 : 24,
          border: `1px solid ${theme.border.subtle}`,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: isMobile ? 16 : 24, flexWrap: "wrap", gap: 12 }}>
            <h2 style={{ fontSize: isMobile ? 14 : 16, fontWeight: 600, margin: 0 }}>{t("income")}</h2>
            <div style={{ display: "flex", gap: 4, background: theme.bg.dark, padding: 4, borderRadius: 8 }}>
              {(['month', 'week', 'day'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setChartPeriod(period)}
                  style={{
                    padding: isMobile ? "4px 10px" : "6px 14px",
                    fontSize: isMobile ? 11 : 12,
                    fontWeight: 500,
                    color: chartPeriod === period ? theme.text.primary : theme.text.muted,
                    background: chartPeriod === period ? theme.bg.card : "transparent",
                    border: chartPeriod === period ? `1px solid ${theme.border.default}` : "none",
                    borderRadius: 6,
                    cursor: "pointer",
                  }}
                >
                  {t(period)}
                </button>
              ))}
            </div>
          </div>
          {/* Simple Line Chart */}
          <div style={{ height: 200, position: "relative" }} onMouseLeave={() => setHoveredPoint(null)}>
            {/* Grid lines SVG */}
            <svg width="100%" height="100%" viewBox="0 0 600 200" preserveAspectRatio="none" style={{ position: "absolute", top: 0, left: 0 }}>
              {[0, 1, 2, 3, 4].map(i => (
                <line
                  key={i}
                  x1="0"
                  y1={i * 50}
                  x2="600"
                  y2={i * 50}
                  stroke={theme.border.subtle}
                  strokeWidth="1"
                  strokeDasharray="4"
                />
              ))}
              {/* Line path */}
              {chartData.length > 1 && (
                <path
                  d={chartData.map((d, i) => {
                    const x = (i / Math.max(chartData.length - 1, 1)) * 600;
                    const y = 200 - (d.value / maxChartValue) * 180;
                    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }).join(' ')}
                  fill="none"
                  stroke={theme.accent.primary}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
            </svg>
            {/* Dots as separate layer with proper aspect ratio */}
            {chartData.map((d, i) => {
              const xPercent = chartData.length > 1 ? (i / (chartData.length - 1)) * 100 : 50;
              const yPercent = 100 - (d.value / maxChartValue) * 90;
              return (
                <div
                  key={i}
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.parentElement?.getBoundingClientRect();
                    if (rect) {
                      setHoveredPoint({ index: i, x: e.clientX - rect.left, y: e.clientY - rect.top });
                    }
                  }}
                  style={{
                    position: "absolute",
                    left: `${xPercent}%`,
                    top: `${yPercent}%`,
                    width: 10,
                    height: 10,
                    marginLeft: -5,
                    marginTop: -5,
                    borderRadius: "50%",
                    background: hoveredPoint?.index === i ? theme.accent.secondary : theme.accent.primary,
                    cursor: "pointer",
                    transition: "transform 0.15s, background 0.15s",
                    transform: hoveredPoint?.index === i ? "scale(1.5)" : "scale(1)",
                    zIndex: hoveredPoint?.index === i ? 10 : 1,
                  }}
                />
              );
            })}
            {/* Tooltip */}
            {hoveredPoint !== null && (
              <div style={{
                position: "absolute",
                left: hoveredPoint.x,
                top: hoveredPoint.y - 50,
                transform: "translateX(-50%)",
                background: theme.bg.card,
                border: `1px solid ${theme.border.default}`,
                borderRadius: 8,
                padding: "8px 12px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                zIndex: 100,
                pointerEvents: "none",
                whiteSpace: "nowrap",
              }}>
                <div style={{ fontSize: 11, color: theme.text.muted, marginBottom: 2 }}>
                  {chartData[hoveredPoint.index]?.date}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: theme.accent.success, fontFamily: "monospace" }}>
                  +${fmt(chartData[hoveredPoint.index]?.value || 0)}
                </div>
              </div>
            )}
            {/* X-axis labels */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 12,
              fontSize: 11,
              color: theme.text.muted,
            }}>
              {chartData.filter((_, i) => i % Math.ceil(chartData.length / 6) === 0 || i === chartData.length - 1).map((d, i) => (
                <span key={i}>{d.date}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div style={{
          background: theme.bg.card,
          borderRadius: 16,
          padding: isMobile ? 16 : 24,
          border: `1px solid ${theme.border.subtle}`,
        }}>
          <h2 style={{ fontSize: isMobile ? 14 : 16, fontWeight: 600, margin: isMobile ? "0 0 16px 0" : "0 0 20px 0" }}>{t("analytics")}</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Income */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: theme.text.secondary }}>{t("income")}</span>
                <span style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 600, color: theme.accent.success }}>
                  +{fmt(currentData.income)}
                </span>
              </div>
              <div style={{ height: 6, background: theme.bg.dark, borderRadius: 3, overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  width: `${(currentData.income / Math.max(currentData.income, currentData.expense, 1)) * 100}%`,
                  background: theme.accent.success,
                  borderRadius: 3,
                  transition: "width 0.5s ease",
                }} />
              </div>
            </div>
            {/* Expense */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: theme.text.secondary }}>{t("expenses")}</span>
                <span style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 600, color: theme.accent.danger }}>
                  -{fmt(currentData.expense)}
                </span>
              </div>
              <div style={{ height: 6, background: theme.bg.dark, borderRadius: 3, overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  width: `${(currentData.expense / Math.max(currentData.income, currentData.expense, 1)) * 100}%`,
                  background: theme.accent.danger,
                  borderRadius: 3,
                  transition: "width 0.5s ease",
                }} />
              </div>
            </div>
            {/* Divider */}
            <div style={{ borderTop: `1px solid ${theme.border.subtle}`, margin: "8px 0" }} />
            {/* Activity link */}
            <button
              onClick={() => navigate("/orders")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 16px",
                background: theme.bg.input,
                border: `1px solid ${theme.border.subtle}`,
                borderRadius: 10,
                color: theme.text.secondary,
                fontSize: 13,
                cursor: "pointer",
                width: "100%",
                textAlign: "left",
              }}
            >
              <Icon name="clock" size={16} />
              {t("activity_history")}
            </button>
          </div>
        </div>
      </div>

      {/* Сайдбар справа для депозита */}
      {showDepositSidebar && (
        <div style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: 400,
          height: "100vh",
          background: theme.bg.card,
          boxShadow: "-8px 0 32px rgba(0,0,0,0.25)",
          zIndex: 999,
          display: "flex",
          flexDirection: "column",
          padding: "32px 28px",
          borderLeft: `1px solid ${theme.border.subtle}`,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{t("create_deposit")}</h2>
            <button
              onClick={() => setShowDepositSidebar(false)}
              style={{ background: "none", border: "none", color: theme.text.muted, fontSize: 22, cursor: "pointer" }}
              title={t("close")}
            >
              <Icon name="x" size={22} />
            </button>
          </div>
          <div style={{ marginBottom: 18, color: theme.text.muted, fontSize: 14 }}>
            {"Выберите мерчанта и введите сумму для отправки."}
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={{ color: theme.text.secondary, fontSize: 14, fontWeight: 500, marginBottom: 8, display: "block" }}>Выберите мерчанта</label>
            <select
              value={depositMerchant}
              onChange={e => setDepositMerchant(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 10,
                background: theme.bg.input,
                color: theme.text.primary,
                border: `1px solid ${theme.border.subtle}`,
                fontSize: 15,
                marginBottom: 8,
                outline: "none",
              }}
            >
              <option value="">-- Мерчантов нет --</option>
            </select>
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ color: theme.text.secondary, fontSize: 14, fontWeight: 500, marginBottom: 8, display: "block" }}>Сумма депозита</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={depositAmount}
              onChange={e => setDepositAmount(e.target.value)}
              placeholder="Введите сумму"
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 10,
                background: theme.bg.input,
                color: theme.text.primary,
                border: `1px solid ${theme.border.subtle}`,
                fontSize: 15,
                outline: "none",
              }}
            />
          </div>
          <button
            style={{
              width: "100%",
              padding: "14px",
              background: theme.gradient.primary,
              border: "none",
              borderRadius: "12px",
              color: theme.text.primary,
              fontSize: "15px",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 4px 20px rgba(99,102,241,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
            }}
            onClick={() => {/* TODO: handle deposit send */}}
          >
            <Icon name="dollar" size={20} /> Отправить депозит
          </button>
        </div>
      )}
    </DashboardLayout>
  );
}
