import type { Route } from "./+types/messages";
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useNavigate } from "react-router";
import DashboardLayout, { theme, Icon } from "../components/DashboardLayout";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Messages | TrustX" },
    { name: "description", content: "System Messages" },
  ];
}

interface Message {
  id: number;
  device_id: string;
  device_name: string;
  received_at: string;
  delivered_at: string;
  notification_type: 'push' | 'sms';
  sender: string;
  order_id: string;
  message_type: string;
  content: string;
}

type NotificationType = 'all' | 'push' | 'sms';
type MessageType = 'all' | 'payment' | 'system' | 'alert';

export default function Messages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [notificationFilter, setNotificationFilter] = useState<NotificationType>('all');
  const [messageTypeFilter, setMessageTypeFilter] = useState<MessageType>('all');
  const [searchSender, setSearchSender] = useState('');
  const [searchOrderId, setSearchOrderId] = useState('');
  const [createdBefore, setCreatedBefore] = useState('');
  const [createdAfter, setCreatedAfter] = useState('');
  const { token, username } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    if (!username) {
      navigate("/login");
      return;
    }
    loadMessages();
  }, [username, token, navigate]);

  async function loadMessages() {
    setTimeout(() => {
      setMessages([]);
      setLoading(false);
    }, 500);
  }

  const fmtDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit", 
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const filteredMessages = messages.filter(msg => {
    if (notificationFilter !== 'all' && msg.notification_type !== notificationFilter) return false;
    if (messageTypeFilter !== 'all' && msg.message_type !== messageTypeFilter) return false;
    if (searchSender && !msg.sender.toLowerCase().includes(searchSender.toLowerCase())) return false;
    if (searchOrderId && !msg.order_id.toLowerCase().includes(searchOrderId.toLowerCase())) return false;
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

  return (
    <DashboardLayout title={t("messages")}>
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
          <select
            value={notificationFilter}
            onChange={e => setNotificationFilter(e.target.value as NotificationType)}
            style={selectStyle}
          >
            <option value="all">{t("all")}</option>
            <option value="push">Push</option>
            <option value="sms">SMS</option>
          </select>
          <select
            value={messageTypeFilter}
            onChange={e => setMessageTypeFilter(e.target.value as MessageType)}
            style={selectStyle}
          >
            <option value="all">{t("all")}</option>
            <option value="payment">{t("payment")}</option>
            <option value="system">{t("system")}</option>
            <option value="alert">{t("alert")}</option>
          </select>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>{t("device_name")}</th>
                <th style={thStyle}>{t("received_by_device")}</th>
                <th style={thStyle}>{t("delivered_to_system")}</th>
                <th style={thStyle}>{t("type")}</th>
                <th style={thStyle}>{t("message_from")}</th>
                <th style={thStyle}>{t("order")}</th>
                <th style={thStyle}>{t("message")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ ...tdStyle, textAlign: "center", padding: 40, color: theme.text.muted }}>
                    {t("loading")}...
                  </td>
                </tr>
              ) : filteredMessages.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ ...tdStyle, textAlign: "center", padding: 40, color: theme.text.muted, borderBottom: "none" }}>
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
                      <Icon name="activity" size={24} />
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: theme.text.primary, marginBottom: 6 }}>
                      {t("no_messages")}
                    </div>
                    <div style={{ fontSize: 13, color: theme.text.muted }}>
                      {t("no_messages_hint")}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredMessages.map((msg) => (
                  <tr 
                    key={msg.id}
                    style={{ 
                      background: "transparent",
                      transition: "background 0.15s",
                      cursor: "pointer",
                    }}
                    onMouseOver={e => e.currentTarget.style.background = theme.bg.cardHover}
                    onMouseOut={e => e.currentTarget.style.background = "transparent"}
                  >
                    <td style={tdStyle}>
                      <span style={{ fontWeight: 500 }}>{msg.device_id}</span>
                    </td>
                    <td style={{ ...tdStyle, color: theme.text.secondary }}>{msg.device_name}</td>
                    <td style={{ ...tdStyle, color: theme.text.muted, fontSize: 13 }}>{fmtDate(msg.received_at)}</td>
                    <td style={{ ...tdStyle, color: theme.text.muted, fontSize: 13 }}>{fmtDate(msg.delivered_at)}</td>
                    <td style={tdStyle}>
                      <span style={{
                        color: msg.notification_type === 'push' ? theme.accent.primary : theme.accent.success,
                        fontWeight: 600,
                        fontSize: 12,
                      }}>
                        {msg.notification_type.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, color: theme.text.secondary }}>{msg.sender}</td>
                    <td style={{ ...tdStyle, color: theme.accent.primary, fontWeight: 500 }}>{msg.order_id}</td>
                    <td style={{ ...tdStyle, color: theme.text.muted, fontSize: 13, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {msg.content}
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
