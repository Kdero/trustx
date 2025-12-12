import type { Route } from "./+types/arbitration";
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useNavigate } from "react-router";
import DashboardLayout, { theme, Icon } from "../components/DashboardLayout";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Arbitration | TrustX" },
    { name: "description", content: "Dispute Resolution" },
  ];
}

interface Arbitration {
  id: number;
  order_id: string;
  amount: number;
  status: 'pending' | 'in_review' | 'resolved' | 'rejected';
  resolution_status: 'none' | 'refund' | 'completed' | 'partial';
  resolution_target: string;
  comments: string;
  payment_details: string;
  order_status: string;
  created_at: string;
}

type StatusFilter = 'all' | 'pending' | 'in_review' | 'resolved' | 'rejected';
type ResolutionFilter = 'all' | 'none' | 'refund' | 'completed' | 'partial';

export default function Arbitration() {
  const [arbitrations, setArbitrations] = useState<Arbitration[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [resolutionFilter, setResolutionFilter] = useState<ResolutionFilter>('all');
  const [searchOrderId, setSearchOrderId] = useState('');
  const [searchAmount, setSearchAmount] = useState('');
  const { token, username } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    if (!username) {
      navigate("/login");
      return;
    }
    loadArbitrations();
  }, [username, token, navigate]);

  async function loadArbitrations() {
    setTimeout(() => {
      setArbitrations([]);
      setLoading(false);
    }, 500);
  }

  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const fmtDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit", 
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return theme.accent.warning;
      case 'in_review': return theme.accent.info;
      case 'resolved': return theme.accent.success;
      case 'rejected': return theme.accent.danger;
      default: return theme.text.muted;
    }
  };

  const getResolutionColor = (resolution: string) => {
    switch (resolution) {
      case 'refund': return theme.accent.warning;
      case 'completed': return theme.accent.success;
      case 'partial': return theme.accent.info;
      default: return theme.text.muted;
    }
  };

  const filteredArbitrations = arbitrations.filter(arb => {
    if (statusFilter !== 'all' && arb.status !== statusFilter) return false;
    if (resolutionFilter !== 'all' && arb.resolution_status !== resolutionFilter) return false;
    if (searchOrderId && !arb.order_id.toLowerCase().includes(searchOrderId.toLowerCase())) return false;
    if (searchAmount && !arb.amount.toString().includes(searchAmount)) return false;
    return true;
  });

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

  const selectStyle: React.CSSProperties = {
    padding: "10px 14px",
    background: theme.bg.input,
    border: `1px solid ${theme.border.subtle}`,
    borderRadius: 8,
    color: theme.text.primary,
    fontSize: 13,
    outline: "none",
    cursor: "pointer",
  };

  const inputStyle: React.CSSProperties = {
    padding: "10px 14px",
    background: theme.bg.input,
    border: `1px solid ${theme.border.subtle}`,
    borderRadius: 8,
    color: theme.text.primary,
    fontSize: 13,
    outline: "none",
    width: 100,
  };

  return (
    <DashboardLayout title={t("arbitration")}>
      <div style={{
        background: theme.bg.card,
        borderRadius: 12,
        border: `1px solid ${theme.border.subtle}`,
        overflow: "hidden",
      }}>
        {/* Filters Row */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          padding: "16px 20px",
          background: `linear-gradient(135deg, ${theme.accent.primary}12 0%, ${theme.accent.secondary}08 100%)`,
        }}>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as StatusFilter)}
            style={selectStyle}
          >
            <option value="all">{t("all")}</option>
            <option value="pending">{t("arb_pending")}</option>
            <option value="in_review">{t("arb_in_review")}</option>
            <option value="resolved">{t("arb_resolved")}</option>
            <option value="rejected">{t("arb_rejected")}</option>
          </select>
          <select
            value={resolutionFilter}
            onChange={e => setResolutionFilter(e.target.value as ResolutionFilter)}
            style={selectStyle}
          >
            <option value="all">{t("all")}</option>
            <option value="none">{t("res_none")}</option>
            <option value="refund">{t("res_refund")}</option>
            <option value="completed">{t("res_completed")}</option>
            <option value="partial">{t("res_partial")}</option>
          </select>
          <input
            placeholder="ID"
            value={searchOrderId}
            onChange={e => setSearchOrderId(e.target.value)}
            autoComplete="off"
            style={inputStyle}
          />
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>{t("arb_status")}</th>
                <th style={thStyle}>{t("resolution_status")}</th>
                <th style={thStyle}>{t("order_id")}</th>
                <th style={thStyle}>{t("amount")}</th>
                <th style={thStyle}>{t("comments")}</th>
                <th style={thStyle}>{t("created_at")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ ...tdStyle, textAlign: "center", padding: 40, color: theme.text.muted }}>
                    {t("loading")}...
                  </td>
                </tr>
              ) : filteredArbitrations.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ ...tdStyle, textAlign: "center", padding: 40, color: theme.text.muted, borderBottom: "none" }}>
                    <div style={{
                      width: 56,
                      height: 56,
                      borderRadius: 14,
                      background: `${theme.accent.primary}15`,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 12,
                      color: theme.accent.primary,
                    }}>
                      <Icon name="shield" size={24} />
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: theme.text.primary, marginBottom: 6 }}>
                      {t("no_arbitrations")}
                    </div>
                    <div style={{ fontSize: 13, color: theme.text.muted }}>
                      {t("no_arbitrations_hint")}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredArbitrations.map((arb) => (
                  <tr 
                    key={arb.id}
                    style={{ 
                      background: "transparent",
                      transition: "background 0.15s",
                      cursor: "pointer",
                    }}
                    onMouseOver={e => e.currentTarget.style.background = theme.bg.cardHover}
                    onMouseOut={e => e.currentTarget.style.background = "transparent"}
                  >
                    <td style={tdStyle}>
                      <span style={{ fontWeight: 500 }}>#{arb.id}</span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ color: getStatusColor(arb.status), fontWeight: 600, fontSize: 12 }}>
                        {t(`arb_${arb.status}`).toUpperCase()}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ color: getResolutionColor(arb.resolution_status), fontWeight: 600, fontSize: 12 }}>
                        {t(`res_${arb.resolution_status}`).toUpperCase()}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, color: theme.accent.primary, fontWeight: 500 }}>{arb.order_id}</td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>${fmt(arb.amount)}</td>
                    <td style={{ ...tdStyle, color: theme.text.muted, fontSize: 13, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {arb.comments || '-'}
                    </td>
                    <td style={{ ...tdStyle, color: theme.text.secondary, whiteSpace: "nowrap" }}>
                      {fmtDate(arb.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
