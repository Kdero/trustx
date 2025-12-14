import type { Route } from "./+types/orders";
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useNavigate } from "react-router";
import DashboardLayout, { theme, Icon } from "../components/DashboardLayout";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Orders | TrustX" },
    { name: "description", content: "Orders Management" },
  ];
}

interface Order {
  id: string;
  amount: string;
  currency: string;
  payment_requisites: string;
  requisite_id: string;
  method: string;
  status: 'pending' | 'completed' | 'suspended' | 'cancelled';
  completed_at: string;
}

type OrderDirection = 'in' | 'out';
type OrderStatus = 'all' | 'pending' | 'completed' | 'suspended' | 'cancelled';

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [direction, setDirection] = useState<OrderDirection>('in');
  const [statusFilter, setStatusFilter] = useState<OrderStatus>('all');
  const [createdBefore, setCreatedBefore] = useState('');
  const [createdAfter, setCreatedAfter] = useState('');
  const [showDepositSidebar, setShowDepositSidebar] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { token, username } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (!username) {
      navigate("/login");
      return;
    }
    loadOrders();
  }, [username, token, navigate, direction]);

  async function loadOrders() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ direction });
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (createdAfter) params.append('created_after', createdAfter);
      if (createdBefore) params.append('created_before', createdBefore);
      
      const response = await fetch(`/api/v1/orders/?${params}`, {
        headers: { Authorization: `Token ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setOrders(data.results || data || []);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  // Filter orders
  const filteredOrders = orders.filter(order => {
    if (statusFilter !== 'all' && order.status !== statusFilter) return false;
    return true;
  });

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: "10px 20px",
    background: "transparent",
    border: "none",
    color: active ? theme.text.primary : theme.text.muted,
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 6,
    transition: "color 0.2s",
  });

  const dateInputStyle: React.CSSProperties = {
    padding: "10px 14px",
    background: theme.bg.input,
    border: `1px solid ${theme.border.subtle}`,
    borderRadius: 8,
    color: theme.text.primary,
    fontSize: 13,
    outline: "none",
    minWidth: 140,
  };

  const thStyle: React.CSSProperties = {
    padding: "14px 16px",
    textAlign: "left",
    fontWeight: 500,
    fontSize: 13,
    color: theme.text.muted,
    borderBottom: `1px solid ${theme.border.subtle}`,
    whiteSpace: "nowrap",
  };

  const tdStyle: React.CSSProperties = {
    padding: "14px 16px",
    fontSize: 14,
    color: theme.text.primary,
    borderBottom: `1px solid ${theme.border.subtle}`,
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { color: string; text: string }> = {
      pending: { color: theme.accent.warning, text: t("pending") },
      completed: { color: theme.accent.success, text: t("completed") },
      suspended: { color: theme.accent.danger, text: "SUSPENDED" },
      cancelled: { color: theme.text.muted, text: t("cancelled") },
    };
    const s = styles[status] || styles.pending;
    return (
      <span style={{
        fontSize: 12,
        fontWeight: 600,
        color: s.color,
        letterSpacing: "0.5px",
      }}>
        {s.text}
      </span>
    );
  };

  return (
    <DashboardLayout title={t("orders")}
      headerExtra={
        <button
          onClick={() => setShowDepositSidebar(true)}
          style={{
            background: theme.bg.card,
            color: theme.text.primary,
            border: `1px solid ${theme.border.subtle}`,
            borderRadius: 8,
            padding: "8px 18px",
            fontWeight: 500,
            fontSize: 15,
            boxShadow: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            transition: "background 0.2s, color 0.2s",
          }}
        >
          <Icon name="dollar" size={18} /> {t("create_deposit")}
        </button>
      }
    >
      {/* Сайдбар депозита */}
      {showDepositSidebar && (
        <div style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: isMobile ? "100%" : 400,
          height: "100vh",
          background: theme.bg.card,
          boxShadow: "-8px 0 32px #0008",
          zIndex: 999,
          display: "flex",
          flexDirection: "column",
          padding: isMobile ? 20 : 32,
          borderLeft: isMobile ? "none" : `1px solid ${theme.border.subtle}`,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <span style={{ fontSize: 20, fontWeight: 700 }}>{t("create_deposit")}</span>
            <button
              onClick={() => setShowDepositSidebar(false)}
              style={{
                background: "none",
                border: "none",
                color: theme.text.muted,
                fontSize: 22,
                cursor: "pointer",
                padding: 4,
              }}
            >
              <Icon name="x" size={22} />
            </button>
          </div>
          {/* Форма депозита */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <label style={{ color: theme.text.muted, fontSize: 14, marginBottom: 4 }}>
              {t("merchant")}
            </label>
            <select style={{
              background: theme.bg.input,
              color: theme.text.primary,
              border: `1px solid ${theme.border.subtle}`,
              borderRadius: 8,
              padding: "10px 14px",
              fontSize: 15,
            }}>
              <option value="">{t("merchant_empty")}</option>
            </select>
            <label style={{ color: theme.text.muted, fontSize: 14, marginBottom: 4 }}>
              {t("amount")}
            </label>
            <input
              type="number"
              placeholder={t("amount_placeholder")}
              style={{
                background: theme.bg.input,
                color: theme.text.primary,
                border: `1px solid ${theme.border.subtle}`,
                borderRadius: 8,
                padding: "10px 14px",
                fontSize: 15,
              }}
            />
            <div style={{ color: theme.text.muted, fontSize: 14 }}>
              {t("deposit_explanation")}
            </div>
            <button
              style={{
                background: theme.gradient.primary,
                color: theme.text.primary,
                border: "none",
                borderRadius: 10,
                padding: "12px 0",
                fontWeight: 600,
                fontSize: 16,
                boxShadow: theme.gradient.glow,
                cursor: "pointer",
                marginTop: 12,
              }}
            >
              {t("send_deposit")}
            </button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        
        {/* Tabs and Filters Header */}
        <div style={{
          background: theme.bg.card,
          borderRadius: 12,
          border: `1px solid ${theme.border.subtle}`,
          overflow: "hidden",
        }}>
          {/* Tabs */}
          <div style={{
            display: "flex",
            alignItems: "center",
            padding: "0 16px",
            borderBottom: `1px solid ${theme.border.subtle}`,
          }}>
            <button
              onClick={() => setDirection('in')}
              style={tabStyle(direction === 'in')}
            >
              <span style={{ fontSize: 16 }}>↓</span> In
            </button>
            <button
              onClick={() => setDirection('out')}
              style={tabStyle(direction === 'out')}
            >
              <span style={{ fontSize: 16 }}>↑</span> Out
            </button>
          </div>

          {/* Filters Row */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: isMobile ? 12 : 16,
            padding: isMobile ? "12px 16px" : "16px 20px",
            background: `linear-gradient(135deg, ${theme.accent.primary}12 0%, ${theme.accent.secondary}08 100%)`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="text"
                value={createdBefore}
                onChange={e => setCreatedBefore(e.target.value)}
                placeholder="дд.мм.гггг"
                autoComplete="off"
                style={dateInputStyle}
                onFocus={e => e.currentTarget.type = 'date'}
                onBlur={e => { if (!e.currentTarget.value) e.currentTarget.type = 'text'; }}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="text"
                value={createdAfter}
                onChange={e => setCreatedAfter(e.target.value)}
                placeholder="дд.мм.гггг"
                autoComplete="off"
                style={dateInputStyle}
                onFocus={e => e.currentTarget.type = 'date'}
                onBlur={e => { if (!e.currentTarget.value) e.currentTarget.type = 'text'; }}
              />
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thStyle}>ID</th>
                  <th style={thStyle}>{t("amount")}</th>
                  <th style={thStyle}>{t("currency")}</th>
                  <th style={thStyle}>{t("requisites")}</th>
                  <th style={thStyle}>{t("requisite_id")}</th>
                  <th style={thStyle}>{t("method")}</th>
                  <th style={thStyle}>{t("status")}</th>
                  <th style={thStyle}>{t("completed_at")}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} style={{ ...tdStyle, textAlign: "center", padding: 40, color: theme.text.muted }}>
                      {t("loading")}...
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ ...tdStyle, textAlign: "center", padding: 40, color: theme.text.muted }}>
                      {t("no_orders")}
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order, idx) => (
                    <tr 
                      key={order.id}
                      style={{ 
                        background: "transparent",
                        transition: "background 0.15s",
                      }}
                      onMouseOver={e => e.currentTarget.style.background = theme.bg.cardHover}
                      onMouseOut={e => e.currentTarget.style.background = "transparent"}
                    >
                      <td style={tdStyle}>
                        <span style={{ 
                          color: theme.accent.danger, 
                          fontWeight: 500,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}>
                          <span style={{ 
                            width: 6, 
                            height: 6, 
                            background: theme.accent.danger, 
                            borderRadius: 1 
                          }}></span>
                          {order.id}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, fontWeight: 500 }}>{order.amount}</td>
                      <td style={tdStyle}>{order.currency || '-'}</td>
                      <td style={tdStyle}>{order.payment_requisites}</td>
                      <td style={{ ...tdStyle, color: theme.text.muted, fontSize: 13 }}>
                        {order.requisite_id || '-'}
                      </td>
                      <td style={tdStyle}>{order.method || '-'}</td>
                      <td style={tdStyle}>{getStatusBadge(order.status)}</td>
                      <td style={{ ...tdStyle, color: theme.accent.danger, whiteSpace: "nowrap" }}>
                        {order.completed_at}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
