import type { Route } from "./+types/admin";
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useNavigate } from "react-router";
import DashboardLayout, { theme, Icon } from "../components/DashboardLayout";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Admin Panel | TrustX" },
    { name: "description", content: "TrustX Administration" },
  ];
}

interface User {
  id: number;
  public_id: string;
  username: string;
  role: 'admin' | 'user';
  is_verified: boolean;
  created_at: string;
  verified_at: string | null;
  balance?: number;
}

interface Merchant {
  id: string | number;
  name: string;
  api_key: string;
  webhook_url: string;
}

interface Payment {
  id: string | number;
  merchant: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
}

interface CryptoDeposit {
  payment_id: string;
  user: {
    id: number;
    username: string;
    email: string;
  } | null;
  currency: string;
  amount_expected: number;
  amount_received: number;
  status: 'pending' | 'confirming' | 'completed' | 'expired' | 'failed';
  wallet_address: string;
  tx_hash: string | null;
  created_at: string;
  expires_at: string;
}

interface BalanceModal {
  isOpen: boolean;
  userId: number | null;
  username: string;
  currentBalance: number;
  amount: string;
  type: 'deposit' | 'withdrawal' | 'charge' | 'refund';
  description: string;
}

type TabType = 'users' | 'merchants' | 'payments' | 'deposits';

export default function Admin() {
  const [users, setUsers] = useState<User[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [deposits, setDeposits] = useState<CryptoDeposit[]>([]);
  const [depositLoading, setDepositLoading] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [isMobile, setIsMobile] = useState(false);
  const [balanceModal, setBalanceModal] = useState<BalanceModal>({
    isOpen: false,
    userId: null,
    username: '',
    currentBalance: 0,
    amount: '',
    type: 'deposit',
    description: ''
  });
  const { role, token, username } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const baseURL = "";

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  function showMessage(msg: string, type: "success" | "error") {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(""), 4000);
  }

  async function loadUsers(authToken: string | null) {
    if (!authToken) return;
    try {
      const res = await axios.get(`${baseURL}/api/v1/auth/users`, {
        headers: { "Authorization": `Token ${authToken}` }
      });
      setUsers(res.data);
    } catch (e) {
      console.error("Error loading users:", e);
    }
  }

  async function loadMerchants() {
    try {
      const res = await axios.get(`${baseURL}/api/v1/merchants/all`);
      setMerchants(res.data);
    } catch (e) {
      console.error("Error loading merchants:", e);
    }
  }

  async function loadPayments() {
    try {
      const res = await axios.get(`${baseURL}/api/v1/payments/all`);
      setPayments(res.data);
    } catch (e) {
      console.error("Error loading payments:", e);
    }
  }

  async function loadDeposits() {
    if (!token) return;
    try {
      const res = await axios.get(`${baseURL}/api/v1/crypto/admin/deposits`, {
        headers: { "Authorization": `Token ${token}` }
      });
      setDeposits(res.data);
    } catch (e) {
      console.error("Error loading deposits:", e);
    }
  }

  async function approveDeposit(paymentId: string) {
    if (!token) return;
    setDepositLoading(paymentId);
    try {
      await axios.post(
        `${baseURL}/api/v1/crypto/admin/deposits/${paymentId}/approve`,
        {},
        { headers: { "Authorization": `Token ${token}` } }
      );
      showMessage("Депозит подтверждён, баланс начислен", "success");
      loadDeposits();
      loadUsers(token);
    } catch (e: any) {
      showMessage(e.response?.data?.error || "Ошибка подтверждения", "error");
    } finally {
      setDepositLoading(null);
    }
  }

  async function rejectDeposit(paymentId: string) {
    if (!token) return;
    setDepositLoading(paymentId);
    try {
      await axios.post(
        `${baseURL}/api/v1/crypto/admin/deposits/${paymentId}/reject`,
        {},
        { headers: { "Authorization": `Token ${token}` } }
      );
      showMessage("Депозит отклонён", "success");
      loadDeposits();
    } catch (e: any) {
      showMessage(e.response?.data?.error || "Ошибка отклонения", "error");
    } finally {
      setDepositLoading(null);
    }
  }

  async function verifyUser(userId: number) {
    if (!token) return;
    try {
      await axios.post(
        `${baseURL}/api/v1/auth/users/${userId}/verify`,
        {},
        { headers: { "Authorization": `Token ${token}` } }
      );
      showMessage(t("success"), "success");
      loadUsers(token);
    } catch (e) {
      showMessage(t("error"), "error");
    }
  }

  function openBalanceModal(user: User) {
    setBalanceModal({
      isOpen: true,
      userId: user.id,
      username: user.username,
      currentBalance: user.balance || 0,
      amount: '',
      type: 'deposit',
      description: ''
    });
  }

  function closeBalanceModal() {
    setBalanceModal({
      isOpen: false,
      userId: null,
      username: '',
      currentBalance: 0,
      amount: '',
      type: 'deposit',
      description: ''
    });
  }

  async function adjustBalance() {
    if (!token || !balanceModal.userId) return;
    
    const amount = parseFloat(balanceModal.amount);
    if (isNaN(amount) || amount <= 0) {
      showMessage(t("error") + ": Invalid amount", "error");
      return;
    }

    try {
      await axios.post(
        `${baseURL}/api/v1/auth/users/${balanceModal.userId}/balance`,
        {
          amount: amount,
          type: balanceModal.type,
          description: balanceModal.description
        },
        { headers: { "Authorization": `Token ${token}` } }
      );
      
      showMessage(t("success"), "success");
      closeBalanceModal();
      loadUsers(token);
    } catch (e: any) {
      const errorMsg = e.response?.data?.error || t("error");
      showMessage(errorMsg, "error");
    }
  }

  useEffect(() => {
    if (!username) {
      navigate("/login");
      return;
    }
    
    if (role !== "admin") {
      setLoading(false);
      return;
    }
    
    setIsAdmin(true);
    
    if (token) {
      loadUsers(token);
      loadMerchants();
      loadPayments();
      loadDeposits();
    }
    
    setLoading(false);
  }, [role, token, username, navigate]);

  const tabs = [
    { id: 'users' as TabType, label: t("users"), icon: 'users', count: users.length },
    { id: 'merchants' as TabType, label: t("merchants"), icon: 'credit-card', count: merchants.length },
    { id: 'payments' as TabType, label: t("payments"), icon: 'activity', count: payments.length },
    { id: 'deposits' as TabType, label: 'Депозиты', icon: 'download', count: deposits.length },
  ];

  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (!username) return null;

  if (!isAdmin && !loading) {
    return (
      <DashboardLayout title={t("admin_panel")} subtitle="Access Denied">
        <div style={{
          background: `${theme.accent.danger}15`,
          border: `1px solid ${theme.accent.danger}30`,
          borderRadius: 16,
          padding: 48,
          textAlign: "center",
        }}>
          <div style={{
            width: 80,
            height: 80,
            background: `${theme.accent.danger}20`,
            borderRadius: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
            color: theme.accent.danger,
          }}>
            <Icon name="shield" size={40} />
          </div>
          <h2 style={{ margin: "0 0 8px", color: theme.accent.danger }}>Access Denied</h2>
          <p style={{ margin: 0, color: theme.text.muted }}>
            You don't have administrator privileges to access this page.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={t("admin_panel")} subtitle={t("user_management")}>
      {/* Toast Message */}
      {message && (
        <div style={{
          position: "fixed",
          top: 24,
          right: 24,
          padding: "14px 20px",
          background: messageType === "success" ? theme.accent.success : theme.accent.danger,
          borderRadius: 12,
          color: "white",
          fontSize: 14,
          fontWeight: 500,
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          gap: 10,
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          animation: "slideIn 0.3s ease",
        }}>
          <Icon name={messageType === "success" ? "check" : "x"} size={18} />
          {message}
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>

      {/* Tabs */}
      <div style={{
        display: "flex",
        gap: 8,
        marginBottom: isMobile ? 16 : 24,
        background: theme.bg.card,
        padding: 6,
        borderRadius: 14,
        border: `1px solid ${theme.border.subtle}`,
        width: isMobile ? "100%" : "fit-content",
        overflowX: "auto",
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: isMobile ? 4 : 8,
              padding: isMobile ? "8px 12px" : "10px 20px",
              background: activeTab === tab.id ? theme.gradient.primary : "transparent",
              border: "none",
              borderRadius: 10,
              color: activeTab === tab.id ? "white" : theme.text.secondary,
              fontSize: isMobile ? 12 : 14,
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s",
              whiteSpace: "nowrap",
            }}
          >
            <Icon name={tab.icon} size={isMobile ? 14 : 18} />
            {isMobile ? '' : tab.label}
            <span style={{
              background: activeTab === tab.id ? "rgba(255,255,255,0.2)" : theme.bg.input,
              padding: "2px 8px",
              borderRadius: 20,
              fontSize: isMobile ? 10 : 12,
            }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div style={{
          background: theme.bg.card,
          borderRadius: 16,
          border: `1px solid ${theme.border.subtle}`,
          overflow: "hidden",
        }}>
          <div style={{ 
            padding: isMobile ? "12px 16px" : "16px 24px", 
            borderBottom: `1px solid ${theme.border.subtle}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
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
                <Icon name="users" size={20} />
              </div>
              <h3 style={{ margin: 0, fontSize: isMobile ? 14 : 16, fontWeight: 600 }}>
                {t("users")}
              </h3>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
          {/* Table Header */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "80px 1.5fr 1fr 70px 1.1fr 90px 1.3fr",
            padding: "12px 20px",
            background: theme.bg.input,
            borderBottom: `1px solid ${theme.border.subtle}`,
            fontSize: 11,
            fontWeight: 600,
            color: theme.text.muted,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            gap: 8,
            minWidth: 800,
          }}>
            <div>ID</div>
            <div>{t("username")}</div>
            <div>{t("available_balance")}</div>
            <div>Role</div>
            <div>{t("status")}</div>
            <div>{t("date")}</div>
            <div>{t("actions")}</div>
          </div>

          {/* Table Body */}
          {users.map((user, index) => (
            <div
              key={user.id}
              style={{
                display: "grid",
                gridTemplateColumns: "80px 1.5fr 1fr 70px 1.1fr 90px 1.3fr",
                padding: "14px 20px",
                borderBottom: index < users.length - 1 ? `1px solid ${theme.border.subtle}` : "none",
                alignItems: "center",
                transition: "background 0.15s",
                gap: 8,
                minWidth: 800,
              }}
              onMouseOver={e => e.currentTarget.style.background = theme.bg.cardHover}
              onMouseOut={e => e.currentTarget.style.background = "transparent"}
            >
              <div style={{ 
                fontFamily: "monospace", 
                fontSize: 11,
                padding: "4px 8px",
                background: `${theme.accent.secondary}15`,
                color: theme.accent.secondary,
                borderRadius: 6,
                fontWeight: 600,
                textAlign: "center",
              }}>
                {user.public_id}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <div style={{
                  width: 32,
                  height: 32,
                  minWidth: 32,
                  borderRadius: 8,
                  background: user.role === 'admin' ? theme.gradient.primary : `${theme.accent.info}20`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: user.role === 'admin' ? "white" : theme.accent.info,
                  fontWeight: 600,
                  fontSize: 13,
                }}>
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <span style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.username}</span>
              </div>
              <div style={{ 
                fontFamily: "monospace", 
                fontWeight: 600,
                fontSize: 13,
                color: theme.accent.success,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}>
                ${fmt(user.balance || 0)}
              </div>
              <div>
                <span style={{
                  fontSize: 10,
                  fontWeight: 600,
                  padding: "3px 8px",
                  borderRadius: 20,
                  background: user.role === 'admin' ? `${theme.accent.primary}20` : `${theme.text.muted}20`,
                  color: user.role === 'admin' ? theme.accent.primary : theme.text.muted,
                }}>
                  {user.role === 'admin' ? 'Admin' : 'User'}
                </span>
              </div>
              <div>
                <span style={{
                  fontSize: 10,
                  fontWeight: 600,
                  padding: "3px 8px",
                  borderRadius: 20,
                  background: user.is_verified ? `${theme.accent.success}20` : `${theme.accent.warning}20`,
                  color: user.is_verified ? theme.accent.success : theme.accent.warning,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                  whiteSpace: "nowrap",
                }}>
                  <Icon name={user.is_verified ? "check" : "clock"} size={10} />
                  {user.is_verified ? t("verified") : t("pending")}
                </span>
              </div>
              <div style={{ fontSize: 12, color: theme.text.muted, whiteSpace: "nowrap" }}>
                {new Date(user.created_at).toLocaleDateString()}
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <button
                  onClick={() => openBalanceModal(user)}
                  style={{
                    padding: "5px 10px",
                    background: `${theme.accent.primary}15`,
                    color: theme.accent.primary,
                    border: `1px solid ${theme.accent.primary}30`,
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: 11,
                    fontWeight: 500,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    whiteSpace: "nowrap",
                  }}
                >
                  <Icon name="dollar" size={12} />
                  Balance
                </button>
                {!user.is_verified && (
                  <button
                    onClick={() => verifyUser(user.id)}
                    style={{
                      padding: "5px 10px",
                      background: `${theme.accent.success}15`,
                      color: theme.accent.success,
                      border: `1px solid ${theme.accent.success}30`,
                      borderRadius: 6,
                      cursor: "pointer",
                      fontSize: 11,
                      fontWeight: 500,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      whiteSpace: "nowrap",
                    }}
                  >
                    <Icon name="check" size={12} />
                    {t("verify")}
                  </button>
                )}
              </div>
            </div>
          ))}
          </div>
        </div>
      )}

      {/* Merchants Tab */}
      {activeTab === 'merchants' && (
        <div style={{
          background: theme.bg.card,
          borderRadius: 16,
          border: `1px solid ${theme.border.subtle}`,
          overflow: "hidden",
        }}>
          <div style={{ 
            padding: isMobile ? "12px 16px" : "16px 24px", 
            borderBottom: `1px solid ${theme.border.subtle}`,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: `${theme.accent.secondary}20`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: theme.accent.secondary,
            }}>
              <Icon name="credit-card" size={20} />
            </div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
              {t("merchants")}
            </h3>
          </div>

          {merchants.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center", color: theme.text.muted }}>
              No merchants registered
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <div style={{
                display: "grid",
                gridTemplateColumns: "80px 1fr 250px 1fr",
                padding: "12px 24px",
                background: theme.bg.input,
                borderBottom: `1px solid ${theme.border.subtle}`,
                fontSize: 12,
                fontWeight: 600,
                color: theme.text.muted,
                textTransform: "uppercase",
                minWidth: 600,
              }}>
                <div>ID</div>
                <div>Name</div>
                <div>API Key</div>
                <div>Webhook URL</div>
              </div>

              {merchants.map((merchant, index) => (
                <div
                  key={merchant.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "80px 1fr 250px 1fr",
                    padding: "16px 24px",
                    borderBottom: index < merchants.length - 1 ? `1px solid ${theme.border.subtle}` : "none",
                    alignItems: "center",
                    minWidth: 600,
                  }}
                >
                  <div style={{ fontFamily: "monospace", color: theme.text.muted }}>#{merchant.id}</div>
                  <div style={{ fontWeight: 500 }}>{merchant.name}</div>
                  <div style={{
                    fontFamily: "monospace",
                    fontSize: 12,
                    background: theme.bg.input,
                    padding: "6px 10px",
                    borderRadius: 6,
                    color: theme.text.secondary,
                  }}>
                    {merchant.api_key}
                  </div>
                  <div style={{ fontSize: 13, color: theme.text.muted }}>
                    {merchant.webhook_url || "-"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <div style={{
          background: theme.bg.card,
          borderRadius: 16,
          border: `1px solid ${theme.border.subtle}`,
          overflow: "hidden",
        }}>
          <div style={{ 
            padding: isMobile ? "12px 16px" : "16px 24px", 
            borderBottom: `1px solid ${theme.border.subtle}`,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}>
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
              <Icon name="activity" size={20} />
            </div>
            <h3 style={{ margin: 0, fontSize: isMobile ? 14 : 16, fontWeight: 600 }}>
              {t("payments")}
            </h3>
          </div>

          {payments.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center", color: theme.text.muted }}>
              No payments yet
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <div style={{
                display: "grid",
                gridTemplateColumns: "80px 1fr 120px 80px 120px 150px",
                padding: "12px 24px",
                background: theme.bg.input,
                borderBottom: `1px solid ${theme.border.subtle}`,
                fontSize: 12,
                fontWeight: 600,
                color: theme.text.muted,
                textTransform: "uppercase",
                minWidth: 700,
              }}>
                <div>ID</div>
                <div>Merchant</div>
                <div>{t("amount")}</div>
                <div>Currency</div>
                <div>{t("status")}</div>
                <div>{t("date")}</div>
              </div>

              {payments.map((payment, index) => (
                <div
                  key={payment.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "80px 1fr 120px 80px 120px 150px",
                    padding: "16px 24px",
                    borderBottom: index < payments.length - 1 ? `1px solid ${theme.border.subtle}` : "none",
                    alignItems: "center",
                  }}
                >
                  <div style={{ fontFamily: "monospace", color: theme.text.muted }}>#{payment.id}</div>
                  <div style={{ fontWeight: 500 }}>{payment.merchant}</div>
                  <div style={{ fontFamily: "monospace", fontWeight: 600, color: theme.accent.success }}>
                    ${fmt(payment.amount)}
                  </div>
                  <div style={{ color: theme.text.secondary }}>{payment.currency}</div>
                  <div>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "4px 10px",
                      borderRadius: 20,
                      background: payment.status === 'completed' ? `${theme.accent.success}20` : 
                                  payment.status === 'pending' ? `${theme.accent.warning}20` : `${theme.accent.danger}20`,
                      color: payment.status === 'completed' ? theme.accent.success : 
                             payment.status === 'pending' ? theme.accent.warning : theme.accent.danger,
                    }}>
                      {payment.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: theme.text.muted }}>
                    {new Date(payment.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Deposits Tab */}
      {activeTab === 'deposits' && (
        <div style={{
          background: theme.bg.card,
          borderRadius: 16,
          border: `1px solid ${theme.border.subtle}`,
          overflow: "hidden",
        }}>
          <div style={{ 
            padding: isMobile ? "12px 16px" : "16px 24px", 
            borderBottom: `1px solid ${theme.border.subtle}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
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
                <Icon name="download" size={20} />
              </div>
              <h3 style={{ margin: 0, fontSize: isMobile ? 14 : 16, fontWeight: 600 }}>
                Крипто депозиты
              </h3>
            </div>
            <button
              onClick={() => loadDeposits()}
              style={{
                padding: "8px 16px",
                background: theme.bg.input,
                border: `1px solid ${theme.border.subtle}`,
                borderRadius: 8,
                color: theme.text.secondary,
                cursor: "pointer",
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Icon name="refresh" size={14} />
              Обновить
            </button>
          </div>

          {deposits.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center", color: theme.text.muted }}>
              Нет заявок на депозит
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <div style={{
                display: "grid",
                gridTemplateColumns: "90px 1fr 100px 100px 100px 100px 140px",
                padding: "12px 20px",
                background: theme.bg.input,
                borderBottom: `1px solid ${theme.border.subtle}`,
                fontSize: 11,
                fontWeight: 600,
                color: theme.text.muted,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                gap: 8,
                minWidth: 800,
              }}>
                <div>ID</div>
                <div>Пользователь</div>
                <div>Сумма</div>
                <div>Валюта</div>
                <div>Статус</div>
                <div>Дата</div>
                <div>Действия</div>
              </div>

              {deposits.map((deposit, index) => (
                <div
                  key={deposit.payment_id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "90px 1fr 100px 100px 100px 100px 140px",
                    padding: "14px 20px",
                    borderBottom: index < deposits.length - 1 ? `1px solid ${theme.border.subtle}` : "none",
                    alignItems: "center",
                    transition: "background 0.15s",
                    gap: 8,
                    minWidth: 800,
                  }}
                  onMouseOver={e => e.currentTarget.style.background = theme.bg.cardHover}
                  onMouseOut={e => e.currentTarget.style.background = "transparent"}
                >
                  <div style={{ 
                    fontFamily: "monospace", 
                    fontSize: 11,
                    padding: "4px 8px",
                    background: `${theme.accent.warning}15`,
                    color: theme.accent.warning,
                    borderRadius: 6,
                    fontWeight: 600,
                    textAlign: "center",
                  }}>
                    {deposit.payment_id}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                    <span style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {deposit.user?.username || "—"}
                    </span>
                    <span style={{ fontSize: 11, color: theme.text.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {deposit.user?.email || ""}
                    </span>
                  </div>
                  <div style={{ 
                    fontFamily: "monospace", 
                    fontWeight: 600,
                    fontSize: 13,
                    color: theme.accent.success,
                  }}>
                    ${fmt(deposit.amount_expected)}
                  </div>
                  <div style={{ 
                    fontSize: 12,
                    color: theme.text.secondary,
                  }}>
                    {deposit.currency}
                  </div>
                  <div>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 600,
                      padding: "4px 8px",
                      borderRadius: 20,
                      background: deposit.status === 'completed' ? `${theme.accent.success}20` :
                                  deposit.status === 'pending' ? `${theme.accent.warning}20` :
                                  deposit.status === 'confirming' ? `${theme.accent.info}20` :
                                  `${theme.accent.danger}20`,
                      color: deposit.status === 'completed' ? theme.accent.success :
                             deposit.status === 'pending' ? theme.accent.warning :
                             deposit.status === 'confirming' ? theme.accent.info :
                             theme.accent.danger,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 3,
                      whiteSpace: "nowrap",
                    }}>
                      <Icon 
                        name={deposit.status === 'completed' ? 'check' : 
                              deposit.status === 'pending' ? 'clock' :
                              deposit.status === 'confirming' ? 'refresh' : 'x'} 
                        size={10} 
                      />
                      {deposit.status === 'completed' ? 'Завершён' :
                       deposit.status === 'pending' ? 'Ожидает' :
                       deposit.status === 'confirming' ? 'Проверка' :
                       deposit.status === 'expired' ? 'Истёк' : 'Ошибка'}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: theme.text.muted, whiteSpace: "nowrap" }}>
                    {new Date(deposit.created_at).toLocaleDateString()}
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {deposit.status === 'pending' && (
                      <>
                        <button
                          onClick={() => approveDeposit(deposit.payment_id)}
                          disabled={depositLoading === deposit.payment_id}
                          style={{
                            padding: "5px 10px",
                            background: `${theme.accent.success}15`,
                            color: theme.accent.success,
                            border: `1px solid ${theme.accent.success}30`,
                            borderRadius: 6,
                            cursor: depositLoading === deposit.payment_id ? "not-allowed" : "pointer",
                            fontSize: 11,
                            fontWeight: 500,
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            opacity: depositLoading === deposit.payment_id ? 0.6 : 1,
                          }}
                        >
                          <Icon name="check" size={12} />
                        </button>
                        <button
                          onClick={() => rejectDeposit(deposit.payment_id)}
                          disabled={depositLoading === deposit.payment_id}
                          style={{
                            padding: "5px 10px",
                            background: `${theme.accent.danger}15`,
                            color: theme.accent.danger,
                            border: `1px solid ${theme.accent.danger}30`,
                            borderRadius: 6,
                            cursor: depositLoading === deposit.payment_id ? "not-allowed" : "pointer",
                            fontSize: 11,
                            fontWeight: 500,
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            opacity: depositLoading === deposit.payment_id ? 0.6 : 1,
                          }}
                        >
                          <Icon name="x" size={12} />
                        </button>
                      </>
                    )}
                    {deposit.status !== 'pending' && (
                      <span style={{ fontSize: 11, color: theme.text.muted }}>—</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Balance Modal */}
      {balanceModal.isOpen && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          backdropFilter: "blur(4px)",
        }}>
          <div style={{
            background: theme.bg.card,
            padding: 28,
            borderRadius: 20,
            minWidth: 420,
            border: `1px solid ${theme.border.subtle}`,
            boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: `${theme.accent.primary}20`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: theme.accent.primary,
              }}>
                <Icon name="dollar" size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{t("balance_management")}</h3>
                <p style={{ margin: 0, fontSize: 13, color: theme.text.muted }}>{balanceModal.username}</p>
              </div>
            </div>

            <div style={{
              background: theme.bg.input,
              padding: 16,
              borderRadius: 12,
              marginBottom: 20,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <span style={{ color: theme.text.muted, fontSize: 13 }}>Current Balance</span>
              <span style={{ fontFamily: "monospace", fontSize: 20, fontWeight: 700, color: theme.accent.success }}>
                ${fmt(balanceModal.currentBalance)}
              </span>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 8, fontSize: 13, color: theme.text.secondary, fontWeight: 500 }}>
                Operation Type
              </label>
              <select
                value={balanceModal.type}
                onChange={(e) => setBalanceModal(prev => ({ ...prev, type: e.target.value as any }))}
                style={{ 
                  width: "100%", 
                  padding: "12px 14px", 
                  borderRadius: 10, 
                  border: `1px solid ${theme.border.subtle}`,
                  background: theme.bg.input,
                  color: theme.text.primary,
                  fontSize: 14,
                  outline: "none",
                }}
              >
                <option value="deposit">Deposit (+)</option>
                <option value="withdrawal">Withdrawal (-)</option>
                <option value="charge">Charge (-)</option>
                <option value="refund">Refund (+)</option>
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 8, fontSize: 13, color: theme.text.secondary, fontWeight: 500 }}>
                {t("amount")}
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={balanceModal.amount}
                onChange={(e) => setBalanceModal(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0.00"
                autoComplete="off"
                style={{ 
                  width: "100%", 
                  padding: "12px 14px", 
                  borderRadius: 10, 
                  border: `1px solid ${theme.border.subtle}`,
                  background: theme.bg.input,
                  color: theme.text.primary,
                  fontSize: 14,
                  fontFamily: "monospace",
                  boxSizing: "border-box",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", marginBottom: 8, fontSize: 13, color: theme.text.secondary, fontWeight: 500 }}>
                Description (optional)
              </label>
              <input
                type="text"
                value={balanceModal.description}
                onChange={(e) => setBalanceModal(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Reason for balance change"
                autoComplete="off"
                style={{ 
                  width: "100%", 
                  padding: "12px 14px", 
                  borderRadius: 10, 
                  border: `1px solid ${theme.border.subtle}`,
                  background: theme.bg.input,
                  color: theme.text.primary,
                  fontSize: 14,
                  boxSizing: "border-box",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={closeBalanceModal}
                style={{ 
                  flex: 1,
                  padding: "12px", 
                  borderRadius: 10, 
                  border: `1px solid ${theme.border.default}`, 
                  background: "transparent",
                  color: theme.text.secondary,
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                {t("cancel")}
              </button>
              <button
                onClick={adjustBalance}
                style={{ 
                  flex: 1,
                  padding: "12px", 
                  borderRadius: 10, 
                  border: "none", 
                  background: theme.gradient.primary,
                  color: "white",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
