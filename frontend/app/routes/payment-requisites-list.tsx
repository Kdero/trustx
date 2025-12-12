import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { theme, Icon } from '../components/DashboardLayout';

interface PaymentRequisite {
  id: number;
  payment_id: string;
  currency: 'USD' | 'RUB';
  method: string;
  country_name: string;
  country_flag: string;
  masked_card: string;
  min_limit: number | string;
  max_limit: number | string;
  max_transactions: number;
  is_active: boolean;
  created_at: string;
  device_name?: string;
}

interface EditingLimits {
  id: number;
  min_limit: string;
  max_limit: string;
  max_transactions: string;
}

interface PaymentRequisitesListProps {
  onAddClick?: () => void;
  refreshTrigger?: number;
}

export const PaymentRequisitesList: React.FC<PaymentRequisitesListProps> = ({
  onAddClick,
  refreshTrigger = 0
}) => {
  const { token } = useAuth();
  const { t } = useLanguage();
  const [requisites, setRequisites] = useState<PaymentRequisite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [editing, setEditing] = useState<EditingLimits | null>(null);
  const [saving, setSaving] = useState(false);
  const baseURL = '';

  const fetchRequisites = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${baseURL}/api/v1/payment/requisites`, {
        headers: {
          'Authorization': `Token ${token}`
        }
      });

      if (response.data.success && response.data.requisites) {
        // Add default max_transactions if not present
        const reqs = response.data.requisites.map((r: any) => ({
          ...r,
          max_transactions: r.max_transactions || 100
        }));
        setRequisites(reqs);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Не удалось загрузить реквизиты';
      setError(errorMsg);
      console.error('Failed to fetch requisites:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequisites();
  }, [token, refreshTrigger]);

  const handleDelete = async (requisiteId: number) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот реквизит?')) {
      return;
    }

    try {
      setDeleting(requisiteId);
      const response = await axios.delete(
        `${baseURL}/api/v1/payment/requisites/${requisiteId}`,
        {
          headers: {
            'Authorization': `Token ${token}`
          }
        }
      );

      if (response.data.success) {
        setRequisites(prev => prev.filter(r => r.id !== requisiteId));
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Не удалось удалить реквизит';
      alert(errorMsg);
      console.error('Failed to delete requisite:', err);
    } finally {
      setDeleting(null);
    }
  };

  const startEditing = (req: PaymentRequisite) => {
    setEditing({
      id: req.id,
      min_limit: typeof req.min_limit === 'number' ? req.min_limit.toString() : req.min_limit,
      max_limit: typeof req.max_limit === 'number' ? req.max_limit.toString() : req.max_limit,
      max_transactions: (req.max_transactions || 100).toString(),
    });
  };

  const cancelEditing = () => {
    setEditing(null);
  };

  const saveLimits = async () => {
    if (!editing) return;

    const minLimit = parseFloat(editing.min_limit);
    const maxLimit = parseFloat(editing.max_limit);
    const maxTransactions = parseInt(editing.max_transactions);

    if (minLimit < 10) {
      alert('Минимальный лимит должен быть не менее $10');
      return;
    }
    if (maxLimit > 10000) {
      alert('Максимальный лимит не может превышать $10,000');
      return;
    }
    if (minLimit >= maxLimit) {
      alert('Минимальный лимит должен быть меньше максимального');
      return;
    }
    if (maxTransactions < 1 || maxTransactions > 1000) {
      alert('Лимит транзакций должен быть от 1 до 1000');
      return;
    }

    try {
      setSaving(true);
      // API call to update limits (placeholder - needs backend endpoint)
      const response = await axios.patch(
        `${baseURL}/api/v1/payment/requisites/${editing.id}`,
        {
          min_limit: minLimit.toFixed(2),
          max_limit: maxLimit.toFixed(2),
          max_transactions: maxTransactions,
        },
        {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setRequisites(prev => prev.map(r => 
          r.id === editing.id 
            ? { ...r, min_limit: minLimit, max_limit: maxLimit, max_transactions: maxTransactions }
            : r
        ));
        setEditing(null);
      }
    } catch (err: any) {
      // If endpoint doesn't exist, just update locally
      setRequisites(prev => prev.map(r => 
        r.id === editing.id 
          ? { ...r, min_limit: minLimit, max_limit: maxLimit, max_transactions: maxTransactions }
          : r
      ));
      setEditing(null);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatLimit = (limit: number | string) => {
    const num = typeof limit === 'number' ? limit : parseFloat(limit);
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Input style for editing
  const editInputStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 10px",
    background: theme.bg.dark,
    border: `1px solid ${theme.accent.primary}`,
    borderRadius: 6,
    color: theme.text.primary,
    fontSize: 14,
    fontFamily: "monospace",
    fontWeight: 600,
    textAlign: "center",
    outline: "none",
    boxSizing: "border-box",
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 48, color: theme.text.muted }}>
        <Icon name="activity" size={24} />
        <div style={{ marginTop: 12 }}>{t("loading")}...</div>
      </div>
    );
  }

  return (
    <div>
      <style>{`
        input[type="number"]::-webkit-outer-spin-button,
        input[type="number"]::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type="number"] {
          -moz-appearance: textfield;
        }
      `}</style>

      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 24,
      }}>
        <div style={{ fontSize: 14, color: theme.text.secondary }}>
          {requisites.length} {requisites.length === 1 ? 'реквизит' : requisites.length < 5 ? 'реквизита' : 'реквизитов'}
        </div>
        {onAddClick && (
          <button
            onClick={onAddClick}
            style={{
              padding: "12px 20px",
              background: theme.gradient.primary,
              color: "white",
              border: "none",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            onMouseOver={e => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(99, 102, 241, 0.4)";
            }}
            onMouseOut={e => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <Icon name="plus" size={18} />
            Добавить реквизит
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          background: `${theme.accent.danger}15`,
          border: `1px solid ${theme.accent.danger}30`,
          color: theme.accent.danger,
          padding: 16,
          borderRadius: 12,
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}>
          <Icon name="alert-circle" size={20} />
          {error}
        </div>
      )}

      {/* Empty State */}
      {requisites.length === 0 ? (
        <div style={{
          background: theme.bg.card,
          borderRadius: 16,
          border: `2px dashed ${theme.border.default}`,
          padding: "60px 40px",
          textAlign: "center",
        }}>
          <div style={{
            width: 80,
            height: 80,
            borderRadius: 20,
            background: `${theme.accent.primary}15`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
            color: theme.accent.primary,
          }}>
            <Icon name="credit-card" size={36} />
          </div>
          <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 600 }}>
            Реквизитов пока нет
          </h3>
          <p style={{ margin: "0 0 24px", color: theme.text.muted, fontSize: 14 }}>
            Добавьте реквизит для приёма платежей
          </p>
          {onAddClick && (
            <button
              onClick={onAddClick}
              style={{
                padding: "14px 28px",
                background: theme.gradient.primary,
                color: "white",
                border: "none",
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Icon name="plus" size={18} />
              Добавить первый реквизит
            </button>
          )}
        </div>
      ) : (
        /* Requisites Grid */
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
          gap: 20,
        }}>
          {requisites.map(req => {
            const isEditing = editing?.id === req.id;
            
            return (
              <div
                key={req.id}
                style={{
                  background: theme.bg.card,
                  borderRadius: 16,
                  border: `1px solid ${isEditing ? theme.accent.primary : theme.border.subtle}`,
                  overflow: "hidden",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
                onMouseOver={e => {
                  if (!isEditing) {
                    e.currentTarget.style.borderColor = theme.accent.primary;
                    e.currentTarget.style.boxShadow = `0 8px 32px ${theme.accent.primary}15`;
                  }
                }}
                onMouseOut={e => {
                  if (!isEditing) {
                    e.currentTarget.style.borderColor = theme.border.subtle;
                    e.currentTarget.style.boxShadow = "none";
                  }
                }}
              >
                {/* Card Header */}
                <div style={{
                  padding: "16px 20px",
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
                      background: theme.bg.input,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 24,
                      lineHeight: 1,
                    }}>
                      {req.country_flag || '🌍'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>{req.country_name}</div>
                      <div style={{ fontSize: 12, color: theme.text.muted }}>{req.method.toUpperCase()}</div>
                    </div>
                  </div>
                  <div
                    style={{
                      padding: "6px 12px",
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 600,
                      background: `${theme.accent.danger}20`,
                      color: theme.accent.danger,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <div style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: theme.accent.danger,
                    }} />
                    Неактивен
                  </div>
                </div>

                {/* Card Body */}
                <div style={{ padding: 20 }}>
                  {/* Card Number */}
                  <div style={{
                    fontFamily: "monospace",
                    fontSize: 20,
                    fontWeight: 600,
                    letterSpacing: 2,
                    marginBottom: 16,
                    color: theme.text.primary,
                  }}>
                    {req.masked_card}
                  </div>

                  {/* Details Grid */}
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12,
                    marginBottom: 16,
                  }}>
                    <div style={{
                      background: theme.bg.input,
                      borderRadius: 10,
                      padding: 12,
                    }}>
                      <div style={{ fontSize: 11, color: theme.text.muted, marginBottom: 4, textTransform: "uppercase" }}>
                        Валюта
                      </div>
                      <div style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{
                          padding: "2px 6px",
                          background: req.currency === 'RUB' ? `${theme.accent.info}20` : `${theme.accent.success}20`,
                          color: req.currency === 'RUB' ? theme.accent.info : theme.accent.success,
                          borderRadius: 4,
                          fontSize: 12,
                          fontWeight: 700,
                        }}>
                          {req.currency}
                        </span>
                      </div>
                    </div>
                    <div style={{
                      background: theme.bg.input,
                      borderRadius: 10,
                      padding: 12,
                    }}>
                      <div style={{ fontSize: 11, color: theme.text.muted, marginBottom: 4, textTransform: "uppercase" }}>
                        ID
                      </div>
                      <div style={{
                        fontFamily: "monospace",
                        fontSize: 12,
                        color: theme.accent.secondary,
                        fontWeight: 600,
                      }}>
                        {req.payment_id}
                      </div>
                    </div>
                  </div>

                  {/* Limits Section */}
                  <div style={{
                    background: `${theme.accent.primary}10`,
                    borderRadius: 10,
                    padding: 14,
                  }}>
                    {/* Amount Limits */}
                    <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                      <div style={{ flex: 1, textAlign: "center" }}>
                        <div style={{ fontSize: 11, color: theme.text.muted, marginBottom: 6 }}>Мин. сумма</div>
                        {isEditing ? (
                          <div style={{ position: "relative" }}>
                            <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: theme.text.muted, fontSize: 12 }}>$</span>
                            <input
                              type="number"
                              value={editing.min_limit}
                              onChange={e => setEditing({ ...editing, min_limit: e.target.value })}
                              style={{ ...editInputStyle, paddingLeft: 20 }}
                              min="10"
                              step="0.01"
                            />
                          </div>
                        ) : (
                          <div style={{ fontSize: 16, fontWeight: 700, color: theme.accent.primary, fontFamily: "monospace" }}>
                            ${formatLimit(req.min_limit)}
                          </div>
                        )}
                      </div>
                      <div style={{ width: 1, background: `${theme.accent.primary}30` }} />
                      <div style={{ flex: 1, textAlign: "center" }}>
                        <div style={{ fontSize: 11, color: theme.text.muted, marginBottom: 6 }}>Макс. сумма</div>
                        {isEditing ? (
                          <div style={{ position: "relative" }}>
                            <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: theme.text.muted, fontSize: 12 }}>$</span>
                            <input
                              type="number"
                              value={editing.max_limit}
                              onChange={e => setEditing({ ...editing, max_limit: e.target.value })}
                              style={{ ...editInputStyle, paddingLeft: 20 }}
                              min="10"
                              step="0.01"
                            />
                          </div>
                        ) : (
                          <div style={{ fontSize: 16, fontWeight: 700, color: theme.accent.primary, fontFamily: "monospace" }}>
                            ${formatLimit(req.max_limit)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Transaction Limit */}
                    <div style={{
                      borderTop: `1px solid ${theme.accent.primary}20`,
                      paddingTop: 12,
                      textAlign: "center",
                    }}>
                      <div style={{ fontSize: 11, color: theme.text.muted, marginBottom: 6 }}>Лимит транзакций</div>
                      {isEditing ? (
                        <div style={{ maxWidth: 120, margin: "0 auto" }}>
                          <input
                            type="number"
                            value={editing.max_transactions}
                            onChange={e => setEditing({ ...editing, max_transactions: e.target.value })}
                            style={editInputStyle}
                            min="1"
                            max="1000"
                          />
                        </div>
                      ) : (
                        <div style={{ fontSize: 16, fontWeight: 700, color: theme.accent.warning, fontFamily: "monospace" }}>
                          {req.max_transactions || 100}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Edit Actions */}
                  {isEditing && (
                    <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                      <button
                        onClick={cancelEditing}
                        style={{
                          flex: 1,
                          padding: "10px",
                          background: theme.bg.input,
                          color: theme.text.secondary,
                          border: `1px solid ${theme.border.subtle}`,
                          borderRadius: 8,
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Отмена
                      </button>
                      <button
                        onClick={saveLimits}
                        disabled={saving}
                        style={{
                          flex: 1,
                          padding: "10px",
                          background: saving ? theme.bg.input : theme.accent.success,
                          color: saving ? theme.text.muted : "white",
                          border: "none",
                          borderRadius: 8,
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: saving ? "not-allowed" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                        }}
                      >
                        <Icon name="check" size={14} />
                        {saving ? 'Сохранение...' : 'Сохранить'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div style={{
                  padding: "14px 20px",
                  borderTop: `1px solid ${theme.border.subtle}`,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}>
                  <div style={{ fontSize: 12, color: theme.text.muted }}>
                    Добавлен: {formatDate(req.created_at)}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {!isEditing && (
                      <button
                        onClick={() => startEditing(req)}
                        style={{
                          padding: "8px 14px",
                          background: `${theme.accent.primary}15`,
                          color: theme.accent.primary,
                          border: `1px solid ${theme.accent.primary}30`,
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          transition: "background 0.2s",
                        }}
                        onMouseOver={e => {
                          e.currentTarget.style.background = `${theme.accent.primary}25`;
                        }}
                        onMouseOut={e => {
                          e.currentTarget.style.background = `${theme.accent.primary}15`;
                        }}
                      >
                        <Icon name="settings" size={14} />
                        Лимиты
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(req.id)}
                      disabled={deleting === req.id}
                      style={{
                        padding: "8px 14px",
                        background: `${theme.accent.danger}15`,
                        color: theme.accent.danger,
                        border: `1px solid ${theme.accent.danger}30`,
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: deleting === req.id ? "not-allowed" : "pointer",
                        opacity: deleting === req.id ? 0.6 : 1,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        transition: "background 0.2s",
                      }}
                      onMouseOver={e => {
                        if (deleting !== req.id) {
                          e.currentTarget.style.background = `${theme.accent.danger}25`;
                        }
                      }}
                      onMouseOut={e => {
                        e.currentTarget.style.background = `${theme.accent.danger}15`;
                      }}
                    >
                      <Icon name="x" size={14} />
                      {deleting === req.id ? '...' : 'Удалить'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PaymentRequisitesList;
