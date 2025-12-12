import type { Route } from "./+types/profile";
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useNavigate } from "react-router";
import DashboardLayout, { theme, Icon } from "../components/DashboardLayout";
import axios from "axios";

const API_URL = "/api/v1";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Profile | TrustX" },
    { name: "description", content: "User Profile" },
  ];
}

export default function Profile() {
  const { username, role, token, setUsername, setToken } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  const [profileData, setProfileData] = useState({
    username: "",
    role: "",
    telegram: "",
    created_at: "",
  });
  
  const [newLogin, setNewLogin] = useState("");
  const [newTelegram, setNewTelegram] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    
    // Load profile data from API
    const fetchProfile = async () => {
      try {
        const response = await axios.get(`${API_URL}/auth/me`, {
          headers: { Authorization: `Token ${token}` }
        });
        const data = response.data;
        setProfileData({
          username: data.username || "",
          role: data.role || "user",
          telegram: data.telegram || "",
          created_at: data.created_at 
            ? new Date(data.created_at).toLocaleDateString("ru-RU", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              })
            : "",
        });
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        // Fallback to local data
        setProfileData({
          username: username || "",
          role: role || "user",
          telegram: "",
          created_at: new Date().toLocaleDateString("ru-RU", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          }),
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [token, navigate, username, role]);

  const handleSaveInfo = async () => {
    if (!newLogin && !newTelegram) {
      setMessage(t("fill_at_least_one"));
      return;
    }
    
    setSaving(true);
    setMessage("");
    
    try {
      const updateData: { username?: string; telegram?: string } = {};
      if (newLogin.trim()) updateData.username = newLogin.trim();
      if (newTelegram.trim()) updateData.telegram = newTelegram.trim();
      
      const response = await axios.patch(`${API_URL}/auth/profile/update`, updateData, {
        headers: { Authorization: `Token ${token}` }
      });
      
      // Update local state
      if (response.data.username && setUsername) {
        setUsername(response.data.username);
      }
      setProfileData(prev => ({
        ...prev,
        username: response.data.username || prev.username,
        telegram: response.data.telegram || prev.telegram,
      }));
      
      setMessage(t("info_saved"));
      setNewLogin("");
      setNewTelegram("");
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.response?.data?.username?.[0] || t("error");
      setMessage(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleSavePassword = async () => {
    if (!currentPassword || !newPassword) {
      setPasswordMessage(t("fill_all_fields"));
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordMessage(t("password_too_short"));
      return;
    }
    
    setSavingPassword(true);
    setPasswordMessage("");
    
    try {
      const response = await axios.post(`${API_URL}/auth/password/change`, {
        current_password: currentPassword,
        new_password: newPassword
      }, {
        headers: { Authorization: `Token ${token}` }
      });
      
      // Update token in auth context if new token is returned
      if (response.data.token) {
        setToken(response.data.token);
      }
      
      setPasswordMessage(t("password_changed"));
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.response?.data?.current_password?.[0] || t("error");
      setPasswordMessage(errorMsg);
    } finally {
      setSavingPassword(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    background: theme.bg.input,
    border: `1px solid ${theme.border.subtle}`,
    borderRadius: 10,
    color: theme.text.primary,
    fontSize: 14,
    outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 13,
    color: theme.text.muted,
    marginBottom: 8,
    display: "block",
  };

  const cardStyle: React.CSSProperties = {
    background: theme.bg.card,
    borderRadius: 16,
    padding: 24,
    border: `1px solid ${theme.border.subtle}`,
  };

  const buttonStyle: React.CSSProperties = {
    padding: "12px 24px",
    background: theme.bg.input,
    border: `1px solid ${theme.border.subtle}`,
    borderRadius: 10,
    color: theme.text.primary,
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.2s",
  };

  const infoRowStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 0",
    borderBottom: `1px solid ${theme.border.subtle}`,
  };

  return (
    <DashboardLayout title={t("profile")}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Left Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Profile Info Card */}
          <div style={cardStyle}>
            <h3 style={{ margin: "0 0 20px 0", fontSize: 18, fontWeight: 600, color: theme.text.primary }}>
              {t("your_profile")}
            </h3>
            
            {/* Username */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 18, fontWeight: 600, color: theme.text.primary }}>
                {profileData.username}
              </div>
              <div style={{
                display: "inline-block",
                marginTop: 8,
                padding: "4px 12px",
                background: theme.bg.input,
                borderRadius: 6,
                fontSize: 12,
                color: theme.text.muted,
                border: `1px solid ${theme.border.subtle}`,
              }}>
                Trader
              </div>
            </div>

            {/* Info Rows */}
            <div style={infoRowStyle}>
              <span style={{ color: theme.text.muted, fontSize: 14 }}>{t("role")}:</span>
              <span style={{ color: theme.text.primary, fontSize: 14, fontWeight: 500 }}>
                {profileData.role === "admin" ? t("administrator") : t("user")}
              </span>
            </div>
            <div style={infoRowStyle}>
              <span style={{ color: theme.text.muted, fontSize: 14 }}>{t("user_login")}:</span>
              <span style={{ color: theme.text.primary, fontSize: 14, fontWeight: 500 }}>
                {profileData.username}
              </span>
            </div>
            <div style={infoRowStyle}>
              <span style={{ color: theme.text.muted, fontSize: 14 }}>Telegram {t("for_contact")}:</span>
              <span style={{ color: theme.text.primary, fontSize: 14, fontWeight: 500 }}>
                {profileData.telegram}
              </span>
            </div>
            <div style={{ ...infoRowStyle, borderBottom: "none" }}>
              <span style={{ color: theme.text.muted, fontSize: 14 }}>{t("created_at")}:</span>
              <span style={{ color: theme.text.primary, fontSize: 14, fontWeight: 500 }}>
                {profileData.created_at}
              </span>
            </div>
          </div>

          {/* Change Password Card */}
          <div style={cardStyle}>
            <h3 style={{ margin: "0 0 20px 0", fontSize: 18, fontWeight: 600, color: theme.text.primary }}>
              {t("change_password")}
            </h3>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              <div>
                <label style={labelStyle}>{t("current_password")}</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="********"
                  autoComplete="new-password"
                  style={inputStyle}
                  onFocus={e => e.currentTarget.style.borderColor = theme.accent.primary}
                  onBlur={e => e.currentTarget.style.borderColor = theme.border.subtle}
                />
              </div>
              <div>
                <label style={labelStyle}>{t("new_password")}</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="********"
                  autoComplete="new-password"
                  style={inputStyle}
                  onFocus={e => e.currentTarget.style.borderColor = theme.accent.primary}
                  onBlur={e => e.currentTarget.style.borderColor = theme.border.subtle}
                />
              </div>
            </div>
            
            {passwordMessage && (
              <div style={{
                marginBottom: 16,
                padding: "10px 14px",
                borderRadius: 8,
                fontSize: 13,
                background: passwordMessage.includes(t("password_changed")) ? `${theme.accent.success}15` : `${theme.accent.danger}15`,
                color: passwordMessage.includes(t("password_changed")) ? theme.accent.success : theme.accent.danger,
                border: `1px solid ${passwordMessage.includes(t("password_changed")) ? theme.accent.success : theme.accent.danger}30`,
              }}>
                {passwordMessage}
              </div>
            )}
            
            <button
              onClick={handleSavePassword}
              disabled={savingPassword}
              style={buttonStyle}
              onMouseOver={e => {
                e.currentTarget.style.background = theme.bg.cardHover;
                e.currentTarget.style.borderColor = theme.border.default;
              }}
              onMouseOut={e => {
                e.currentTarget.style.background = theme.bg.input;
                e.currentTarget.style.borderColor = theme.border.subtle;
              }}
            >
              {savingPassword ? t("saving") : t("save_password")}
            </button>
          </div>
        </div>

        {/* Right Column - Contacts */}
        <div style={cardStyle}>
          <h3 style={{ margin: "0 0 20px 0", fontSize: 18, fontWeight: 600, color: theme.text.primary }}>
            {t("contacts")}
          </h3>
          
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>{t("user_login")}</label>
            <input
              type="text"
              value={newLogin}
              onChange={e => setNewLogin(e.target.value)}
              placeholder={t("new_login")}
              autoComplete="off"
              style={inputStyle}
              onFocus={e => e.currentTarget.style.borderColor = theme.accent.primary}
              onBlur={e => e.currentTarget.style.borderColor = theme.border.subtle}
            />
          </div>
          
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Telegram {t("for_contact")}</label>
            <input
              type="text"
              value={newTelegram}
              onChange={e => setNewTelegram(e.target.value)}
              placeholder={t("new_telegram")}
              autoComplete="off"
              style={inputStyle}
              onFocus={e => e.currentTarget.style.borderColor = theme.accent.primary}
              onBlur={e => e.currentTarget.style.borderColor = theme.border.subtle}
            />
          </div>
          
          {message && (
            <div style={{
              marginBottom: 16,
              padding: "10px 14px",
              borderRadius: 8,
              fontSize: 13,
              background: message.includes(t("info_saved")) ? `${theme.accent.success}15` : `${theme.accent.danger}15`,
              color: message.includes(t("info_saved")) ? theme.accent.success : theme.accent.danger,
              border: `1px solid ${message.includes(t("info_saved")) ? theme.accent.success : theme.accent.danger}30`,
            }}>
              {message}
            </div>
          )}
          
          <button
            onClick={handleSaveInfo}
            disabled={saving}
            style={buttonStyle}
            onMouseOver={e => {
              e.currentTarget.style.background = theme.bg.cardHover;
              e.currentTarget.style.borderColor = theme.border.default;
            }}
            onMouseOut={e => {
              e.currentTarget.style.background = theme.bg.input;
              e.currentTarget.style.borderColor = theme.border.subtle;
            }}
          >
            {saving ? t("saving") : t("save_info")}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
