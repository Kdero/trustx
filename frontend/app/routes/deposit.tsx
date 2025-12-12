import type { Route } from "./+types/deposit";
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useNavigate } from "react-router";
import DashboardLayout, { theme, Icon } from "../components/DashboardLayout";
import { QRCodeSVG } from "qrcode.react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Deposits | TrustX" },
    { name: "description", content: "Deposit USDT to your TrustX account" },
  ];
}

interface CryptoPayment {
  payment_id: string;
  address: string;
  amount: string;
  currency: string;
  expires_at: string;
  status: string;
  amount_received?: string;
  confirmations?: number;
  tx_hash?: string;
  created_at?: string;
}

interface DepositHistory {
  id: number;
  payment_id: string;
  address: string;
  amount: string;
  status: string;
  created_at: string;
}

export default function Deposit() {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payment, setPayment] = useState<CryptoPayment | null>(null);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [deposits, setDeposits] = useState<DepositHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [frozenDeposit, setFrozenDeposit] = useState(0);
  
  const { token, username, balance } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const baseURL = "";

  useEffect(() => {
    if (!username) {
      navigate("/login");
      return;
    }
    loadDepositHistory();
    // Load frozen deposit
    if (token) {
      fetch(`${baseURL}/api/v1/payments/stats/`, {
        headers: { Authorization: `Token ${token}` },
      })
        .then((r) => r.json())
        .then((data) => setFrozenDeposit(data.frozen_deposit || 0))
        .catch(() => {});
    }
  }, [username, navigate, token]);

  // Таймер обратного отсчёта
  useEffect(() => {
    if (!payment || payment.status === 'completed' || payment.status === 'expired') {
      return;
    }

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expires = new Date(payment.expires_at).getTime();
      const diff = expires - now;

      if (diff <= 0) {
        setTimeLeft("00:00");
        clearInterval(interval);
        checkPaymentStatus();
      } else {
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [payment]);

  // Автоматическая проверка статуса каждые 10 секунд
  useEffect(() => {
    if (!payment || payment.status === 'completed' || payment.status === 'expired') {
      return;
    }

    const interval = setInterval(() => {
      checkPaymentStatus();
    }, 10000);

    return () => clearInterval(interval);
  }, [payment]);

  async function loadDepositHistory() {
    if (!token) return;
    try {
      const response = await axios.get(
        `${baseURL}/api/v1/crypto/payments/my`,
        {
          headers: { "Authorization": `Token ${token}` }
        }
      );
      if (response.data.success && response.data.payments) {
        const history = response.data.payments.map((p: any, index: number) => ({
          id: index,
          payment_id: p.payment_id,
          address: p.address || '',
          amount: p.amount_expected,
          status: p.status,
          created_at: p.created_at,
        }));
        setDeposits(history);
      }
    } catch (e) {
      console.error("Error loading deposits:", e);
    } finally {
      setLoadingHistory(false);
    }
  }

  const createPayment = async () => {
    if (!amount || parseFloat(amount) < 1) {
      setError("Минимальная сумма: 1 USDT");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `${baseURL}/api/v1/crypto/payment/create`,
        {
          amount: parseFloat(amount).toFixed(2),
          currency: "USDT",
          metadata: { type: "deposit", username }
        },
        {
          headers: {
            "Authorization": `Token ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      if (response.data.success) {
        setPayment(response.data.payment);
      } else {
        setError(response.data.error || "Ошибка создания платежа");
      }
    } catch (e: any) {
      setError(e.response?.data?.error || "Ошибка соединения с сервером");
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async () => {
    if (!payment) return;

    setCheckingStatus(true);
    try {
      const response = await axios.get(
        `${baseURL}/api/v1/crypto/payment/${payment.payment_id}/status`,
        {
          headers: { "Authorization": `Token ${token}` }
        }
      );

      if (response.data.success) {
        setPayment(prev => ({
          ...prev!,
          ...response.data.payment
        }));
      }
    } catch (e) {
      console.error("Error checking payment status:", e);
    } finally {
      setCheckingStatus(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Failed to copy:", e);
    }
  };

  const resetPayment = () => {
    setPayment(null);
    setAmount("");
    setError(null);
  };

  const closePanel = () => {
    if (payment?.status === 'pending') {
      // Можно добавить предупреждение
    }
    setShowPanel(false);
    resetPayment();
  };

  const openNewDeposit = () => {
    resetPayment();
    setShowPanel(true);
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return { text: t('awaiting_payment'), color: theme.accent.warning, icon: 'clock' };
      case 'confirming':
        return { text: t('confirming'), color: theme.accent.info, icon: 'activity' };
      case 'completed':
        return { text: t('payment_completed'), color: theme.accent.success, icon: 'check' };
      case 'expired':
        return { text: t('payment_expired'), color: theme.accent.danger, icon: 'x' };
      default:
        return { text: status, color: theme.text.muted, icon: 'alert-circle' };
    }
  };

  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (!username) return null;

  return (
    <DashboardLayout title={t("deposits")} subtitle={t("deposit_crypto")}>
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
          <div style={{ fontSize: 13, color: theme.text.muted, marginBottom: 8 }}>{t("available_balance")}</div>
          <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "monospace", color: theme.accent.success }}>
            ${fmt(balance || 0)}
          </div>
        </div>

        <div style={{
          background: theme.bg.card,
          borderRadius: 14,
          padding: 20,
          border: `1px solid ${theme.border.subtle}`,
        }}>
          <div style={{ fontSize: 13, color: theme.text.muted, marginBottom: 8 }}>{t("frozen")}</div>
          <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "monospace", color: theme.accent.warning }}>
            ${fmt(frozenDeposit)}
          </div>
        </div>
        
        <div style={{
          background: theme.gradient.primary,
          borderRadius: 14,
          padding: 20,
          cursor: "pointer",
          transition: "transform 0.2s, box-shadow 0.2s",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
        }}
        onClick={openNewDeposit}
        onMouseOver={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(99, 102, 241, 0.4)"; }}
        onMouseOut={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
        >
          <Icon name="plus" size={24} />
          <span style={{ fontSize: 16, fontWeight: 600 }}>{t("create_deposit")}</span>
        </div>
      </div>

      {/* Deposit Info */}
      <div style={{
        background: `${theme.accent.info}10`,
        border: `1px solid ${theme.accent.info}30`,
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: `${theme.accent.info}20`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: theme.accent.info,
        }}>
          <Icon name="alert-circle" size={20} />
        </div>
        <div>
          <div style={{ fontWeight: 500, marginBottom: 2 }}>USDT TRC20</div>
          <div style={{ fontSize: 13, color: theme.text.muted }}>
            {t("deposits_processed")}
          </div>
        </div>
      </div>

      {/* Deposit History Table */}
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
              background: `${theme.accent.success}20`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: theme.accent.success,
            }}>
              <Icon name="download" size={20} />
            </div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
              {t("deposit_history")}
            </h3>
          </div>
        </div>

        {loadingHistory ? (
          <div style={{ padding: 48, textAlign: "center", color: theme.text.muted }}>
            {t("loading")}...
          </div>
        ) : deposits.length > 0 ? (
          <>
            <div style={{
              display: "grid",
              gridTemplateColumns: "90px 1fr 110px 100px 110px",
              padding: "12px 24px",
              background: theme.bg.input,
              borderBottom: `1px solid ${theme.border.subtle}`,
              fontSize: 11,
              fontWeight: 600,
              color: theme.text.muted,
              textTransform: "uppercase",
              gap: 12,
            }}>
              <div>ID</div>
              <div>{t("address")}</div>
              <div style={{ textAlign: "right" }}>{t("amount")}</div>
              <div style={{ textAlign: "right" }}>{t("date")}</div>
              <div style={{ textAlign: "right" }}>{t("status")}</div>
            </div>

            {deposits.map((dep, index) => {
              const statusInfo = getStatusInfo(dep.status);
              return (
                <div
                  key={dep.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "90px 1fr 110px 100px 110px",
                    padding: "16px 24px",
                    borderBottom: index < deposits.length - 1 ? `1px solid ${theme.border.subtle}` : "none",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <div style={{
                    fontFamily: "monospace",
                    fontSize: 11,
                    padding: "4px 8px",
                    background: `${theme.accent.secondary}15`,
                    color: theme.accent.secondary,
                    borderRadius: 6,
                    textAlign: "center",
                  }}>
                    {dep.payment_id}
                  </div>
                  <div style={{ 
                    color: theme.text.muted, 
                    fontSize: 12, 
                    fontFamily: "monospace",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>
                    {dep.address ? `${dep.address.slice(0, 8)}...${dep.address.slice(-6)}` : '-'}
                  </div>
                  <div style={{
                    textAlign: "right",
                    fontFamily: "monospace",
                    fontWeight: 600,
                    color: theme.accent.success,
                    fontSize: 13,
                  }}>
                    +${fmt(parseFloat(dep.amount) || 0)}
                  </div>
                  <div style={{ textAlign: "right", fontSize: 12, color: theme.text.muted }}>
                    {dep.created_at ? new Date(dep.created_at).toLocaleDateString() : '-'}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 600,
                      padding: "4px 8px",
                      borderRadius: 20,
                      background: `${statusInfo.color}20`,
                      color: statusInfo.color,
                      whiteSpace: "nowrap",
                    }}>
                      {statusInfo.text}
                    </span>
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
              <Icon name="download" size={28} />
            </div>
            <div style={{ fontSize: 16, marginBottom: 4 }}>{t("no_deposits")}</div>
            <div style={{ fontSize: 13, marginBottom: 20 }}>{t("first_deposit_hint")}</div>
            <button
              onClick={openNewDeposit}
              style={{
                padding: "12px 24px",
                background: theme.gradient.primary,
                color: "white",
                border: "none",
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Icon name="plus" size={18} />
              {t("create_deposit")}
            </button>
          </div>
        )}
      </div>

      {/* Slide-out Panel */}
      {showPanel && (
        <>
          {/* Backdrop */}
          <div
            onClick={closePanel}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(4px)",
              zIndex: 100,
            }}
          />

          {/* Panel */}
          <div style={{
            position: "fixed",
            top: 0,
            right: 0,
            width: 440,
            height: "100vh",
            background: theme.bg.sidebar,
            borderLeft: `1px solid ${theme.border.subtle}`,
            zIndex: 101,
            display: "flex",
            flexDirection: "column",
            animation: "slideIn 0.3s ease",
          }}>
            <style>{`
              @keyframes slideIn {
                from { transform: translateX(100%); }
                to { transform: translateX(0); }
              }
              /* Hide number input spinners */
              input[type="number"]::-webkit-outer-spin-button,
              input[type="number"]::-webkit-inner-spin-button {
                -webkit-appearance: none;
                margin: 0;
              }
              input[type="number"] {
                -moz-appearance: textfield;
              }
            `}</style>

            {/* Panel Header */}
            <div style={{
              padding: "20px 24px",
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
                  background: `${theme.accent.success}20`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: theme.accent.success,
                }}>
                  <Icon name="download" size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
                    {payment ? t("payment_details") : t("create_deposit")}
                  </h3>
                  <div style={{ fontSize: 12, color: theme.text.muted }}>USDT TRC20</div>
                </div>
              </div>
              <button
                onClick={closePanel}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: theme.bg.card,
                  border: `1px solid ${theme.border.subtle}`,
                  color: theme.text.muted,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            {/* Panel Content */}
            <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
              {error && (
                <div style={{
                  background: `${theme.accent.danger}15`,
                  border: `1px solid ${theme.accent.danger}30`,
                  color: theme.accent.danger,
                  padding: 12,
                  borderRadius: 10,
                  marginBottom: 20,
                  fontSize: 13,
                }}>
                  {error}
                </div>
              )}

              {!payment ? (
                <>
                  {/* Amount Input */}
                  <div style={{ marginBottom: 24 }}>
                    <label style={{ display: "block", marginBottom: 8, fontSize: 13, color: theme.text.secondary, fontWeight: 500 }}>
                      {t("amount")}
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        min="1"
                        step="0.01"
                        autoComplete="off"
                        style={{
                          width: "100%",
                          padding: "16px 80px 16px 16px",
                          background: theme.bg.card,
                          border: `1px solid ${theme.border.subtle}`,
                          borderRadius: 12,
                          color: theme.text.primary,
                          fontSize: 20,
                          fontFamily: "monospace",
                          fontWeight: 600,
                          outline: "none",
                          boxSizing: "border-box",
                        }}
                      />
                      <div style={{
                        position: "absolute",
                        right: 16,
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: `${theme.accent.success}20`,
                        color: theme.accent.success,
                        padding: "6px 12px",
                        borderRadius: 6,
                        fontSize: 13,
                        fontWeight: 600,
                      }}>
                        USDT
                      </div>
                    </div>
                  </div>

                  {/* Quick Amounts */}
                  <div style={{ marginBottom: 24 }}>
                    <label style={{ display: "block", marginBottom: 10, fontSize: 13, color: theme.text.muted }}>
                      {t("quick_select")}
                    </label>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                      {[10, 25, 50, 100, 250, 500].map((val) => (
                        <button
                          key={val}
                          onClick={() => setAmount(val.toString())}
                          style={{
                            padding: "12px",
                            background: amount === val.toString() ? `${theme.accent.primary}20` : theme.bg.card,
                            border: `1px solid ${amount === val.toString() ? theme.accent.primary : theme.border.subtle}`,
                            borderRadius: 10,
                            color: amount === val.toString() ? theme.accent.primary : theme.text.secondary,
                            fontSize: 14,
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 0.2s",
                          }}
                        >
                          ${val}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Info */}
                  <div style={{
                    background: theme.bg.card,
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 24,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                      <span style={{ color: theme.text.muted, fontSize: 13 }}>{t("network")}</span>
                      <span style={{ fontWeight: 500 }}>TRC20 (Tron)</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                      <span style={{ color: theme.text.muted, fontSize: 13 }}>{t("min_amount")}</span>
                      <span style={{ fontWeight: 500 }}>1 USDT</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: theme.text.muted, fontSize: 13 }}>{t("confirmations")}</span>
                      <span style={{ fontWeight: 500 }}>19</span>
                    </div>
                  </div>
                </>
              ) : payment.status === 'completed' ? (
                /* Success State */
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <div style={{
                    width: 80,
                    height: 80,
                    borderRadius: 20,
                    background: `${theme.accent.success}20`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 20px",
                    color: theme.accent.success,
                  }}>
                    <Icon name="check" size={40} />
                  </div>
                  <h3 style={{ margin: "0 0 8px", fontSize: 20 }}>{t("payment_completed")}</h3>
                  <div style={{
                    fontSize: 32,
                    fontWeight: 700,
                    fontFamily: "monospace",
                    color: theme.accent.success,
                    marginBottom: 24,
                  }}>
                    +{payment.amount_received || payment.amount} USDT
                  </div>
                  <button
                    onClick={closePanel}
                    style={{
                      width: "100%",
                      padding: 16,
                      background: theme.gradient.primary,
                      color: "white",
                      border: "none",
                      borderRadius: 12,
                      fontSize: 15,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {t("close")}
                  </button>
                </div>
              ) : (
                /* Payment Pending/Confirming */
                <>
                  {/* Status */}
                  <div style={{
                    background: `${getStatusInfo(payment.status).color}15`,
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 20,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                  }}>
                    <Icon name={getStatusInfo(payment.status).icon} size={20} />
                    <span style={{ fontWeight: 600, color: getStatusInfo(payment.status).color }}>
                      {getStatusInfo(payment.status).text}
                    </span>
                  </div>

                  {/* Timer */}
                  {payment.status === 'pending' && (
                    <div style={{ textAlign: "center", marginBottom: 24 }}>
                      <div style={{
                        fontSize: 48,
                        fontWeight: 700,
                        fontFamily: "monospace",
                        color: theme.accent.warning,
                      }}>
                        {timeLeft}
                      </div>
                      <div style={{ fontSize: 13, color: theme.text.muted }}>{t("time_remaining")}</div>
                    </div>
                  )}

                  {/* QR Code */}
                  <div style={{
                    background: "white",
                    borderRadius: 16,
                    padding: 16,
                    display: "flex",
                    justifyContent: "center",
                    marginBottom: 20,
                  }}>
                    <QRCodeSVG
                      value={payment.address}
                      size={180}
                      level="H"
                      includeMargin={false}
                      bgColor="#ffffff"
                      fgColor="#1f2937"
                    />
                  </div>

                  {/* Address */}
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: "block", marginBottom: 8, fontSize: 12, color: theme.text.muted }}>
                      {t("payment_address")}
                    </label>
                    <div style={{
                      background: theme.bg.card,
                      border: `1px solid ${theme.border.subtle}`,
                      borderRadius: 10,
                      padding: 14,
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}>
                      <div style={{
                        flex: 1,
                        fontFamily: "monospace",
                        fontSize: 12,
                        wordBreak: "break-all",
                        color: theme.text.secondary,
                      }}>
                        {payment.address}
                      </div>
                      <button
                        onClick={() => copyToClipboard(payment.address)}
                        style={{
                          padding: "8px 12px",
                          background: copied ? `${theme.accent.success}20` : `${theme.accent.primary}20`,
                          color: copied ? theme.accent.success : theme.accent.primary,
                          border: "none",
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 500,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          whiteSpace: "nowrap",
                        }}
                      >
                        <Icon name={copied ? "check" : "copy"} size={14} />
                        {copied ? t("copied") : t("copy")}
                      </button>
                    </div>
                  </div>

                  {/* Payment Details */}
                  <div style={{
                    background: theme.bg.card,
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 20,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                      <span style={{ color: theme.text.muted, fontSize: 13 }}>{t("amount")}</span>
                      <span style={{ fontWeight: 600, fontFamily: "monospace" }}>{payment.amount} USDT</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                      <span style={{ color: theme.text.muted, fontSize: 13 }}>ID</span>
                      <span style={{
                        fontFamily: "monospace",
                        fontSize: 12,
                        padding: "2px 8px",
                        background: `${theme.accent.secondary}15`,
                        color: theme.accent.secondary,
                        borderRadius: 4,
                      }}>
                        {payment.payment_id}
                      </span>
                    </div>
                    {payment.confirmations !== undefined && payment.confirmations > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: theme.text.muted, fontSize: 13 }}>{t("confirmations")}</span>
                        <span style={{ fontWeight: 500 }}>{payment.confirmations}/19</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      onClick={checkPaymentStatus}
                      disabled={checkingStatus}
                      style={{
                        flex: 1,
                        padding: 14,
                        background: `${theme.accent.info}15`,
                        color: theme.accent.info,
                        border: `1px solid ${theme.accent.info}30`,
                        borderRadius: 10,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: checkingStatus ? "not-allowed" : "pointer",
                        opacity: checkingStatus ? 0.6 : 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                      }}
                    >
                      <Icon name="activity" size={16} />
                      {checkingStatus ? t("checking") : t("check_status")}
                    </button>
                    <button
                      onClick={resetPayment}
                      style={{
                        padding: "14px 20px",
                        background: theme.bg.card,
                        color: theme.text.secondary,
                        border: `1px solid ${theme.border.subtle}`,
                        borderRadius: 10,
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: "pointer",
                      }}
                    >
                      {t("new_payment")}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Panel Footer - Create Button */}
            {!payment && (
              <div style={{
                padding: 24,
                borderTop: `1px solid ${theme.border.subtle}`,
              }}>
                <button
                  onClick={createPayment}
                  disabled={loading || !amount || parseFloat(amount) < 1}
                  style={{
                    width: "100%",
                    padding: 16,
                    background: loading || !amount || parseFloat(amount) < 1 ? theme.bg.input : theme.gradient.primary,
                    color: loading || !amount || parseFloat(amount) < 1 ? theme.text.muted : "white",
                    border: "none",
                    borderRadius: 12,
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: loading || !amount || parseFloat(amount) < 1 ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  {loading ? (
                    <>
                      <Icon name="activity" size={18} />
                      {t("creating")}
                    </>
                  ) : (
                    <>
                      <Icon name="download" size={18} />
                      {t("create_deposit")}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
