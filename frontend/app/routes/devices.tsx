import type { Route } from "./+types/devices";
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useNavigate } from "react-router";
import DashboardLayout, { theme, Icon } from "../components/DashboardLayout";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Devices | TrustX" },
    { name: "description", content: "Manage your devices" },
  ];
}

interface Device {
  id: number;
  device_id: string;
  model: string;
  name: string;
  imei: string;
  created_at: string;
  updated_at: string;
}

export default function Devices() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [model, setModel] = useState("");
  const [name, setName] = useState("");
  const [imei, setImei] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [loading, setLoading] = useState(true);
  const { token, username } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const baseURL = "";

  useEffect(() => {
    if (!username) {
      navigate("/login");
      return;
    }

    if (token) {
      loadDevices();
    }
    setLoading(false);
  }, [token, username, navigate]);

  async function loadDevices() {
    if (!token) return;
    try {
      const res = await axios.get(`${baseURL}/api/v1/devices`, {
        headers: { "Authorization": `Token ${token}` }
      });
      setDevices(res.data);
    } catch (e) {
      console.error("Error loading devices:", e);
      showMessage(t("error"), "error");
    }
  }

  function showMessage(msg: string, type: "success" | "error") {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(""), 3000);
  }

  async function handleAddDevice(e: React.FormEvent) {
    e.preventDefault();

    if (!model || !name || !imei) {
      showMessage(t("error") + ": Fill all fields", "error");
      return;
    }

    if (!token) {
      showMessage(t("error"), "error");
      return;
    }

    try {
      await axios.post(
        `${baseURL}/api/v1/devices/add`,
        { model, name, imei },
        { headers: { "Authorization": `Token ${token}` } }
      );

      showMessage(t("success"), "success");
      setModel("");
      setName("");
      setImei("");
      loadDevices();
    } catch (e) {
      const error = e as any;
      if (error.response?.data?.imei) {
        showMessage(`IMEI: ${error.response.data.imei[0]}`, "error");
      } else {
        showMessage(t("error"), "error");
      }
    }
  }

  async function handleDeleteDevice(deviceId: number) {
    if (!window.confirm(t("delete") + "?")) {
      return;
    }

    if (!token) return;

    try {
      await axios.delete(`${baseURL}/api/v1/devices/${deviceId}`, {
        headers: { "Authorization": `Token ${token}` }
      });

      showMessage(t("success"), "success");
      loadDevices();
    } catch (e) {
      showMessage(t("error"), "error");
    }
  }

  if (!username) {
    return null;
  }

  return (
    <DashboardLayout title={t("devices")} subtitle={t("my_devices")}>
      {/* Message Toast */}
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
        input:focus {
          border-color: ${theme.accent.primary} !important;
          outline: none;
        }
      `}</style>

      {/* Add Device Form */}
      <div style={{
        background: theme.bg.card,
        borderRadius: 16,
        padding: 24,
        border: `1px solid ${theme.border.subtle}`,
        marginBottom: 24,
      }}>
        <div style={{ 
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 24,
        }}>
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
            <Icon name="plus" size={20} />
          </div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
            {t("add_device")}
          </h3>
        </div>
        
        <form onSubmit={handleAddDevice}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 20 }}>
            <div>
              <label style={{ 
                display: "block", 
                marginBottom: 8, 
                fontSize: 13, 
                color: theme.text.secondary,
                fontWeight: 500,
              }}>
                {t("device_model")}
              </label>
              <input
                type="text"
                value={model}
                onChange={e => setModel(e.target.value)}
                placeholder="iPhone 15 Pro"
                autoComplete="off"
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  background: theme.bg.input,
                  border: `1px solid ${theme.border.subtle}`,
                  borderRadius: 10,
                  color: theme.text.primary,
                  fontSize: 14,
                  boxSizing: "border-box",
                  transition: "border-color 0.2s",
                }}
              />
            </div>

            <div>
              <label style={{ 
                display: "block", 
                marginBottom: 8, 
                fontSize: 13, 
                color: theme.text.secondary,
                fontWeight: 500,
              }}>
                {t("device_name")}
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="My Phone"
                autoComplete="off"
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  background: theme.bg.input,
                  border: `1px solid ${theme.border.subtle}`,
                  borderRadius: 10,
                  color: theme.text.primary,
                  fontSize: 14,
                  boxSizing: "border-box",
                  transition: "border-color 0.2s",
                }}
              />
            </div>

            <div>
              <label style={{ 
                display: "block", 
                marginBottom: 8, 
                fontSize: 13, 
                color: theme.text.secondary,
                fontWeight: 500,
              }}>
                {t("device_imei")}
              </label>
              <input
                type="text"
                value={imei}
                onChange={e => setImei(e.target.value)}
                placeholder="123456789012345"
                maxLength={15}
                autoComplete="off"
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  background: theme.bg.input,
                  border: `1px solid ${theme.border.subtle}`,
                  borderRadius: 10,
                  color: theme.text.primary,
                  fontSize: 14,
                  fontFamily: "monospace",
                  boxSizing: "border-box",
                  transition: "border-color 0.2s",
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            style={{
              padding: "12px 24px",
              background: theme.gradient.primary,
              color: "white",
              border: "none",
              borderRadius: 10,
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 8,
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            onMouseOver={e => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(99, 102, 241, 0.4)";
            }}
            onMouseOut={e => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <Icon name="plus" size={18} />
            {t("add")}
          </button>
        </form>
      </div>

      {/* Devices List */}
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
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
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
              <Icon name="smartphone" size={20} />
            </div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
              {t("my_devices")}
            </h3>
          </div>
          <span style={{ 
            fontSize: 13, 
            color: theme.text.muted,
            background: theme.bg.input,
            padding: "6px 12px",
            borderRadius: 20,
          }}>
            {devices.length} {t("devices").toLowerCase()}
          </span>
        </div>

        {loading ? (
          <div style={{ padding: 48, textAlign: "center" }}>
            <div style={{ 
              width: 40, 
              height: 40, 
              border: `3px solid ${theme.border.subtle}`, 
              borderTopColor: theme.accent.primary, 
              borderRadius: "50%", 
              animation: "spin 0.8s linear infinite",
              margin: "0 auto",
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : devices.length === 0 ? (
          <div style={{
            padding: 64,
            textAlign: "center",
          }}>
            <div style={{
              width: 80,
              height: 80,
              background: `${theme.accent.primary}10`,
              borderRadius: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              color: theme.accent.primary,
            }}>
              <Icon name="smartphone" size={40} />
            </div>
            <p style={{ margin: 0, color: theme.text.secondary, fontSize: 15, marginBottom: 8 }}>
              {t("no_devices")}
            </p>
            <p style={{ margin: 0, color: theme.text.muted, fontSize: 13 }}>
              Add your first device using the form above
            </p>
          </div>
        ) : (
          <div>
            {devices.map((device, index) => (
              <div
                key={device.id}
                style={{
                  padding: "20px 24px",
                  borderBottom: index < devices.length - 1 ? `1px solid ${theme.border.subtle}` : "none",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  transition: "background 0.15s ease",
                }}
                onMouseOver={e => e.currentTarget.style.background = theme.bg.cardHover}
                onMouseOut={e => e.currentTarget.style.background = "transparent"}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{
                    width: 52,
                    height: 52,
                    background: theme.gradient.primary,
                    borderRadius: 14,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                  }}>
                    <Icon name="smartphone" size={26} />
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: 15 }}>{device.name}</span>
                      <span style={{
                        fontSize: 11,
                        fontFamily: "monospace",
                        fontWeight: 600,
                        color: theme.accent.primary,
                        background: `${theme.accent.primary}15`,
                        padding: "3px 8px",
                        borderRadius: 6,
                        border: `1px solid ${theme.accent.primary}30`,
                      }}>
                        #{device.device_id}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: theme.text.secondary, marginBottom: 6 }}>
                      {device.model}
                    </div>
                    <div style={{ 
                      fontSize: 12, 
                      color: theme.text.muted,
                      fontFamily: "monospace",
                      background: theme.bg.input,
                      padding: "4px 10px",
                      borderRadius: 6,
                      display: "inline-block",
                      border: `1px solid ${theme.border.subtle}`,
                    }}>
                      IMEI: {device.imei}
                    </div>
                  </div>
                </div>
                
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 12, color: theme.text.muted, marginBottom: 2 }}>
                      {t("date")}
                    </div>
                    <div style={{ fontSize: 13, color: theme.text.secondary }}>
                      {new Date(device.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteDevice(device.id)}
                    style={{
                      padding: "10px 16px",
                      background: `${theme.accent.danger}15`,
                      color: theme.accent.danger,
                      border: `1px solid ${theme.accent.danger}30`,
                      borderRadius: 10,
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 500,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      transition: "all 0.2s",
                    }}
                    onMouseOver={e => {
                      e.currentTarget.style.background = theme.accent.danger;
                      e.currentTarget.style.color = "white";
                    }}
                    onMouseOut={e => {
                      e.currentTarget.style.background = `${theme.accent.danger}15`;
                      e.currentTarget.style.color = theme.accent.danger;
                    }}
                  >
                    <Icon name="trash" size={16} />
                    {t("delete")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
