import type { Route } from "./+types/transactions";
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useNavigate } from "react-router";
import DashboardLayout, { theme, Icon } from "../components/DashboardLayout";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Transactions | TrustX" },
    { name: "description", content: "Transaction History" },
  ];
}

interface Transaction {
  id: number;
  transaction_type: string;
  transaction_type_display: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  description: string;
  created_at: string;
}

type FilterType = 'all' | 'deposit' | 'withdrawal' | 'charge' | 'refund';
type PeriodType = 'all' | 'today' | 'week' | 'month';

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [period, setPeriod] = useState<PeriodType>('all');
  const [searchAmount, setSearchAmount] = useState('');
  const { token, username } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const baseURL = "http://localhost:8000";

  useEffect(() => {
    if (!username) {
      navigate("/login");
      return;
    }
    loadTransactions();
  }, [username, token, navigate]);

  async function loadTransactions() {
    if (!token) return;
    try {
      const res = await axios.get(`${baseURL}/api/v1/auth/balance/stats`, {
        headers: { "Authorization": `Token ${token}` }
      });
      setTransactions(res.data.transactions || []);
    } catch (e) {
      console.error("Error loading transactions:", e);
    } finally {
      setLoading(false);
    }
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

  // Filter transactions
  const filteredTransactions = transactions.filter(tx => {
    // Type filter
    if (filter !== 'all' && tx.transaction_type !== filter) return false;
    
    // Amount filter
    if (searchAmount) {
      const amount = parseFloat(searchAmount);
      if (!isNaN(amount) && parseFloat(tx.amount as any) !== amount) return false;
    }
    
    // Period filter
    if (period !== 'all') {
      const txDate = new Date(tx.created_at);
      const now = new Date();
      
      if (period === 'today') {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (txDate < today) return false;
      } else if (period === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (txDate < weekAgo) return false;
      } else if (period === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        if (txDate < monthAgo) return false;
      }
    }
    
    return true;
  });

  // Calculate stats
  const totalIncome = filteredTransactions
    .filter(tx => ['deposit', 'refund'].includes(tx.transaction_type))
    .reduce((sum, tx) => sum + parseFloat(tx.amount as any), 0);
    
  const totalExpense = filteredTransactions
    .filter(tx => ['withdrawal', 'charge'].includes(tx.transaction_type))
    .reduce((sum, tx) => sum + parseFloat(tx.amount as any), 0);

  const filterOptions: { id: FilterType; label: string; color: string }[] = [
    { id: 'all', label: t('all'), color: theme.text.secondary },
    { id: 'deposit', label: t('deposit'), color: theme.accent.success },
    { id: 'withdrawal', label: t('withdrawal'), color: theme.accent.danger },
    { id: 'charge', label: t('charge'), color: theme.accent.warning },
    { id: 'refund', label: t('refund'), color: theme.accent.info },
  ];

  const periodOptions: { id: PeriodType; label: string }[] = [
    { id: 'all', label: t('all_time') },
    { id: 'today', label: t('today') },
    { id: 'week', label: t('week') },
    { id: 'month', label: t('month') },
  ];

  if (!username) return null;

  return (
    <DashboardLayout title={t("transactions")} subtitle={t("transaction_history")}>
      {/* Stats Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 16,
        marginBottom: 24,
      }}>
        <div style={{
          background: theme.bg.card,
          borderRadius: 14,
          padding: 20,
          border: `1px solid ${theme.border.subtle}`,
        }}>
          <div style={{ fontSize: 13, color: theme.text.muted, marginBottom: 8 }}>{t("total_transactions")}</div>
          <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "monospace" }}>
            {filteredTransactions.length}
          </div>
        </div>
        
        <div style={{
          background: theme.bg.card,
          borderRadius: 14,
          padding: 20,
          border: `1px solid ${theme.border.subtle}`,
        }}>
          <div style={{ fontSize: 13, color: theme.text.muted, marginBottom: 8 }}>{t("total_income")}</div>
          <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "monospace", color: theme.accent.success }}>
            +${fmt(totalIncome)}
          </div>
        </div>
        
        <div style={{
          background: theme.bg.card,
          borderRadius: 14,
          padding: 20,
          border: `1px solid ${theme.border.subtle}`,
        }}>
          <div style={{ fontSize: 13, color: theme.text.muted, marginBottom: 8 }}>{t("total_expense")}</div>
          <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "monospace", color: theme.accent.danger }}>
            -${fmt(totalExpense)}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        display: "flex",
        gap: 16,
        marginBottom: 24,
        flexWrap: "wrap",
        alignItems: "center",
      }}>
        {/* Type Filter */}
        <div style={{
          display: "flex",
          gap: 6,
          background: theme.bg.card,
          padding: 6,
          borderRadius: 12,
          border: `1px solid ${theme.border.subtle}`,
        }}>
          {filterOptions.map(opt => (
            <button
              key={opt.id}
              onClick={() => setFilter(opt.id)}
              style={{
                padding: "8px 14px",
                background: filter === opt.id ? `${opt.color}20` : "transparent",
                color: filter === opt.id ? opt.color : theme.text.muted,
                border: "none",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Period Filter */}
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as PeriodType)}
          style={{
            padding: "10px 14px",
            background: theme.bg.card,
            color: theme.text.primary,
            border: `1px solid ${theme.border.subtle}`,
            borderRadius: 10,
            fontSize: 13,
            cursor: "pointer",
            outline: "none",
          }}
        >
          {periodOptions.map(opt => (
            <option key={opt.id} value={opt.id}>{opt.label}</option>
          ))}
        </select>

        {/* Amount Search */}
        <div style={{ position: "relative" }}>
          <input
            type="text"
            placeholder={`${t("amount")}...`}
            value={searchAmount}
            onChange={(e) => setSearchAmount(e.target.value)}
            autoComplete="off"
            style={{
              padding: "10px 14px 10px 38px",
              background: theme.bg.card,
              color: theme.text.primary,
              border: `1px solid ${theme.border.subtle}`,
              borderRadius: 10,
              fontSize: 13,
              width: 150,
              outline: "none",
            }}
          />
          <div style={{
            position: "absolute",
            left: 12,
            top: "50%",
            transform: "translateY(-50%)",
            color: theme.text.muted,
          }}>
            <Icon name="search" size={16} />
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div style={{
        background: theme.bg.card,
        borderRadius: 16,
        border: `1px solid ${theme.border.subtle}`,
        overflow: "hidden",
      }}>
        <div style={{
          padding: "16px 24px",
          borderBottom: `1px solid ${theme.border.subtle}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
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
              <Icon name="activity" size={20} />
            </div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
              {t("transaction_history")}
            </h3>
          </div>
          <span style={{
            fontSize: 12,
            padding: "4px 12px",
            background: theme.bg.input,
            borderRadius: 20,
            color: theme.text.muted,
          }}>
            {filteredTransactions.length} {t("records")}
          </span>
        </div>

        {loading ? (
          <div style={{ padding: 48, textAlign: "center", color: theme.text.muted }}>
            {t("loading")}...
          </div>
        ) : filteredTransactions.length > 0 ? (
          <>
            {/* Table Header */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr 1fr 1.2fr",
              padding: "12px 24px",
              background: theme.bg.input,
              borderBottom: `1px solid ${theme.border.subtle}`,
              fontSize: 11,
              fontWeight: 600,
              color: theme.text.muted,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}>
              <div>{t("type")}</div>
              <div style={{ textAlign: "right" }}>{t("amount")}</div>
              <div style={{ textAlign: "right" }}>{t("before")}</div>
              <div style={{ textAlign: "right" }}>{t("after")}</div>
              <div style={{ textAlign: "right" }}>{t("date")}</div>
            </div>

            {/* Table Body */}
            {filteredTransactions.map((tx, index) => {
              const isPositive = ['deposit', 'refund'].includes(tx.transaction_type);
              return (
                <div
                  key={tx.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr 1fr 1fr 1.2fr",
                    padding: "16px 24px",
                    borderBottom: index < filteredTransactions.length - 1 ? `1px solid ${theme.border.subtle}` : "none",
                    alignItems: "center",
                    transition: "background 0.15s",
                  }}
                  onMouseOver={e => e.currentTarget.style.background = theme.bg.cardHover}
                  onMouseOut={e => e.currentTarget.style.background = "transparent"}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      background: isPositive ? `${theme.accent.success}15` : `${theme.accent.danger}15`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: isPositive ? theme.accent.success : theme.accent.danger,
                    }}>
                      <Icon name={isPositive ? "download" : "upload"} size={18} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 14 }}>{tx.transaction_type_display}</div>
                      <div style={{ fontSize: 12, color: theme.text.muted }}>
                        {tx.description || `#${tx.id}`}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{
                    textAlign: "right",
                    fontFamily: "monospace",
                    fontWeight: 600,
                    fontSize: 14,
                    color: isPositive ? theme.accent.success : theme.accent.danger,
                  }}>
                    {isPositive ? "+" : "-"}${fmt(parseFloat(tx.amount as any))}
                  </div>
                  
                  <div style={{
                    textAlign: "right",
                    fontFamily: "monospace",
                    fontSize: 13,
                    color: theme.text.muted,
                  }}>
                    ${fmt(parseFloat(tx.balance_before as any))}
                  </div>
                  
                  <div style={{
                    textAlign: "right",
                    fontFamily: "monospace",
                    fontSize: 13,
                    color: theme.text.secondary,
                  }}>
                    ${fmt(parseFloat(tx.balance_after as any))}
                  </div>
                  
                  <div style={{
                    textAlign: "right",
                    fontSize: 13,
                    color: theme.text.muted,
                  }}>
                    {fmtDate(tx.created_at)}
                  </div>
                </div>
              );
            })}
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "60px 20px", color: theme.text.muted }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: theme.bg.input,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              color: theme.text.muted,
            }}>
              <Icon name="activity" size={28} />
            </div>
            <div style={{ fontSize: 16, marginBottom: 4 }}>{t("no_transactions")}</div>
            <div style={{ fontSize: 13 }}>{t("start_depositing")}</div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
