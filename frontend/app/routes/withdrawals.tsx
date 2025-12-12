import type { Route } from "./+types/withdrawals";
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useNavigate } from "react-router";
import DashboardLayout, { theme, Icon } from "../components/DashboardLayout";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Withdrawals | TrustX" },
    { name: "description", content: "Withdraw USDT TRC20 from your TrustX account" },
  ];
}

interface Withdrawal {
  id: string;
  amount: string;
  wallet_address: string;
  network: string;
  currency: string;
  status: string;
  tx_hash: string | null;
  created_at: string;
}

export default function Withdrawals() {
  const [amount, setAmount] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const { token, username, balance, refreshUser } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const baseURL = "";

  useEffect(() => {
    if (!username) {
      navigate("/login");
      return;
    }
    loadWithdrawals();
  }, [username, navigate]);

  const loadWithdrawals = async () => {
    if (!token) return;
    setLoadingHistory(true);
    try {
      const res = await fetch(`${baseURL}/api/v1/withdrawals`, {
        headers: { Authorization: `Token ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setWithdrawals(data);
      }
    } catch (err) {
      console.error("Failed to load withdrawals:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSubmit = async () => {
    if (!amount || !walletAddress) {
      setError(t("fill_all_fields"));
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum < 1) {
      setError(t("min_withdrawal_amount"));
      return;
    }

    if (amountNum > (balance || 0)) {
      setError(t("insufficient_balance"));
      return;
    }

    // Basic TRC20 address validation
    if (!walletAddress.startsWith("T") || walletAddress.length !== 34) {
      setError(t("invalid_trc20_address"));
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`${baseURL}/api/v1/withdrawals/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({
          amount: amountNum,
          wallet_address: walletAddress,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(t("withdrawal_request_created"));
        setAmount("");
        setWalletAddress("");
        loadWithdrawals();
        if (refreshUser) refreshUser();
      } else {
        setError(data.error || t("withdrawal_failed"));
      }
    } catch (err) {
      setError(t("network_error"));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (withdrawalId: string) => {
    if (!confirm(t("confirm_cancel_withdrawal"))) return;

    try {
      const res = await fetch(`${baseURL}/api/v1/withdrawals/${withdrawalId}/cancel`, {
        method: "POST",
        headers: { Authorization: `Token ${token}` },
      });

      if (res.ok) {
        loadWithdrawals();
        if (refreshUser) refreshUser();
      }
    } catch (err) {
      console.error("Failed to cancel withdrawal:", err);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "completed":
        return { background: `${theme.accent.success}20`, color: theme.accent.success };
      case "pending":
        return { background: `${theme.accent.warning}20`, color: theme.accent.warning };
      case "processing":
        return { background: `${theme.accent.primary}20`, color: theme.accent.primary };
      case "rejected":
        return { background: `${theme.accent.danger}20`, color: theme.accent.danger };
      default:
        return { background: `${theme.text.muted}20`, color: theme.text.muted };
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatAddress = (addr: string) => {
    if (addr.length > 16) {
      return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
    }
    return addr;
  };

  return (
    <DashboardLayout title={t("withdrawal")} subtitle={t("withdraw_usdt_trc20")}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Left: Withdrawal Form */}
        <div
          style={{
            background: theme.bg.card,
            borderRadius: 16,
            padding: 24,
            border: `1px solid ${theme.border.subtle}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: theme.gradient.primary,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="upload" size={24} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{t("create_withdrawal")}</h2>
              <p style={{ margin: 0, fontSize: 13, color: theme.text.muted }}>USDT TRC20</p>
            </div>
          </div>

          {/* Balance Info */}
          <div
            style={{
              background: theme.bg.dark,
              borderRadius: 12,
              padding: 16,
              marginBottom: 20,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ color: theme.text.secondary, fontSize: 14 }}>{t("available_balance")}</span>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 18,
                fontWeight: 600,
                color: theme.accent.success,
              }}
            >
              {(balance || 0).toFixed(2)} USDT
            </span>
          </div>

          {/* Amount Input */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, color: theme.text.secondary, marginBottom: 8 }}>
              {t("amount")} (USDT)
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="1"
                step="0.01"
                autoComplete="off"
                style={{
                  width: "100%",
                  padding: "14px 80px 14px 16px",
                  background: theme.bg.input,
                  border: `1px solid ${theme.border.default}`,
                  borderRadius: 10,
                  color: theme.text.primary,
                  fontSize: 16,
                  fontFamily: "'JetBrains Mono', monospace",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              <button
                onClick={() => setAmount(String(balance || 0))}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  padding: "6px 12px",
                  background: `${theme.accent.primary}20`,
                  border: "none",
                  borderRadius: 6,
                  color: theme.accent.primary,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                MAX
              </button>
            </div>
          </div>

          {/* Wallet Address Input */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 13, color: theme.text.secondary, marginBottom: 8 }}>
              {t("wallet_address")} (TRC20)
            </label>
            <input
              type="text"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="TXxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              autoComplete="off"
              style={{
                width: "100%",
                padding: "14px 16px",
                background: theme.bg.input,
                border: `1px solid ${theme.border.default}`,
                borderRadius: 10,
                color: theme.text.primary,
                fontSize: 14,
                fontFamily: "'JetBrains Mono', monospace",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Network Info */}
          <div
            style={{
              background: `${theme.accent.warning}10`,
              borderRadius: 10,
              padding: 14,
              marginBottom: 20,
              border: `1px solid ${theme.accent.warning}30`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Icon name="alert-triangle" size={16} />
              <span style={{ fontSize: 13, fontWeight: 600, color: theme.accent.warning }}>{t("important")}</span>
            </div>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 12, color: theme.text.secondary, lineHeight: 1.6 }}>
              <li>{t("only_trc20_network")}</li>
              <li>{t("min_withdrawal")}: 1000 USDT</li>
              <li>{t("processing_time")}: 1-24h</li>
            </ul>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div
              style={{
                background: `${theme.accent.danger}20`,
                borderRadius: 10,
                padding: 14,
                marginBottom: 16,
                color: theme.accent.danger,
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}

          {success && (
            <div
              style={{
                background: `${theme.accent.success}20`,
                borderRadius: 10,
                padding: 14,
                marginBottom: 16,
                color: theme.accent.success,
                fontSize: 13,
              }}
            >
              {success}
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={loading || !amount || !walletAddress}
            style={{
              width: "100%",
              padding: "16px",
              background: loading || !amount || !walletAddress ? theme.bg.input : theme.gradient.primary,
              border: "none",
              borderRadius: 10,
              color: loading || !amount || !walletAddress ? theme.text.muted : "#fff",
              fontSize: 15,
              fontWeight: 600,
              cursor: loading || !amount || !walletAddress ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {loading ? (
              <span>{t("processing")}...</span>
            ) : (
              <>
                <Icon name="upload" size={18} />
                {t("create_withdrawal_request")}
              </>
            )}
          </button>
        </div>

        {/* Right: Withdrawal History */}
        <div
          style={{
            background: theme.bg.card,
            borderRadius: 16,
            padding: 24,
            border: `1px solid ${theme.border.subtle}`,
          }}
        >
          <h2 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 600 }}>{t("withdrawal_history")}</h2>

          {loadingHistory ? (
            <div style={{ textAlign: "center", padding: 40, color: theme.text.muted }}>{t("loading")}...</div>
          ) : withdrawals.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: 40,
                color: theme.text.muted,
                background: theme.bg.dark,
                borderRadius: 12,
              }}
            >
              <Icon name="upload" size={40} />
              <p style={{ marginTop: 12 }}>{t("no_withdrawals")}</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: 500, overflowY: "auto" }}>
              {withdrawals.map((w) => (
                <div
                  key={w.id}
                  style={{
                    background: theme.bg.dark,
                    borderRadius: 12,
                    padding: 16,
                    border: `1px solid ${theme.border.subtle}`,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div>
                      <div
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 18,
                          fontWeight: 600,
                          marginBottom: 4,
                        }}
                      >
                        -{parseFloat(w.amount).toFixed(2)} USDT
                      </div>
                      <div style={{ fontSize: 12, color: theme.text.muted }}>{formatDate(w.created_at)}</div>
                    </div>
                    <div
                      style={{
                        padding: "4px 10px",
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 500,
                        ...getStatusStyle(w.status),
                      }}
                    >
                      {t(w.status)}
                    </div>
                  </div>

                  <div style={{ fontSize: 12, color: theme.text.secondary, marginBottom: 8 }}>
                    <span style={{ color: theme.text.muted }}>{t("wallet")}:</span>{" "}
                    <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{formatAddress(w.wallet_address)}</span>
                  </div>

                  {w.tx_hash && (
                    <div style={{ fontSize: 12, color: theme.text.secondary }}>
                      <span style={{ color: theme.text.muted }}>TX:</span>{" "}
                      <a
                        href={`https://tronscan.org/#/transaction/${w.tx_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: theme.accent.primary, fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        {formatAddress(w.tx_hash)}
                      </a>
                    </div>
                  )}

                  {w.status === "pending" && (
                    <button
                      onClick={() => handleCancel(w.id)}
                      style={{
                        marginTop: 12,
                        padding: "8px 16px",
                        background: `${theme.accent.danger}20`,
                        border: `1px solid ${theme.accent.danger}40`,
                        borderRadius: 8,
                        color: theme.accent.danger,
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: "pointer",
                      }}
                    >
                      {t("cancel")}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
