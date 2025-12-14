import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { theme, Icon } from '../components/DashboardLayout';

interface PaymentCountry {
  id: number;
  name: string;
  code: string;
  flag: string;
  is_active: boolean;
}

interface Device {
  id: number;
  name: string;
  model: string;
  imei: string;
}

interface FormData {
  currency: 'USD' | 'RUB';
  method: 'card' | 'sbp';
  country: number;
  bank: string;
  card_number: string;
  card_holder: string;
  min_limit: string;
  max_limit: string;
  max_transactions: string;
  device?: number;
}

// Banks by country code
const BANKS_BY_COUNTRY: Record<string, string[]> = {
  // Абхазия
  AB: [
    'Сбербанк Абхазии',
    'Универсал-банк',
    'Амра-банк',
    'Гагра-банк',
    'Банк развития Абхазии',
  ],
  // Аргентина
  AR: [
    'Banco de la Nación Argentina',
    'Banco Santander Río',
    'Banco Galicia',
    'Banco BBVA Argentina',
    'Banco Macro',
    'Banco Provincia',
    'HSBC Argentina',
    'Banco Ciudad',
    'Banco Credicoop',
    'Banco Patagonia',
    'Brubank',
    'Ualá',
    'Mercado Pago',
  ],
  // Армения
  AM: [
    'Ameriabank',
    'Ardshinbank',
    'ACBA Bank',
    'IDBank',
    'Inecobank',
    'Armeconombank',
    'Evocabank',
    'Converse Bank',
    'Ararat Bank',
    'ArmSwissBank',
    'Unibank',
    'VTB Bank Armenia',
  ],
  // Азербайджан
  AZ: [
    'Kapital Bank',
    'PASHA Bank',
    'Xalq Bank',
    'Bank Respublika',
    'ABB (Azerbaijan Beynəlxalq Bankı)',
    'AccessBank',
    'Bank of Baku',
    'Unibank Azerbaijan',
    'Rabitabank',
    'TuranBank',
    'Yapı Kredi Bank Azerbaijan',
  ],
  // Беларусь
  BY: [
    'Беларусбанк',
    'Белагропромбанк',
    'БПС-Сбербанк',
    'Приорбанк',
    'Белинвестбанк',
    'БелВЭБ',
    'Альфа-Банк Беларусь',
    'МТБанк',
    'Банк Дабрабыт',
    'Белгазпромбанк',
  ],
  // Кипр
  CY: [
    'Bank of Cyprus',
    'Hellenic Bank',
    'RCB Bank',
    'Eurobank Cyprus',
    'Alpha Bank Cyprus',
    'AstroBank',
    'Ancoria Bank',
    'Cyprus Development Bank',
    'National Bank of Greece Cyprus',
  ],
  // Казахстан
  KZ: [
    'Halyk Bank',
    'Kaspi Bank',
    'Forte Bank',
    'Jusan Bank',
    'Bank CenterCredit',
    'Евразийский банк',
    'Altyn Bank',
    'Банк ЦентрКредит',
    'АТФБанк',
    'Отбасы банк',
    'Freedom Bank',
    'Bereke Bank',
  ],
  // Киргизия
  KG: [
    'Оптима Банк',
    'KICB',
    'Демир Банк',
    'Банк Компаньон',
    'MBank',
    'Банк Азия',
    'РСК Банк',
    'Dos-Credo Bank',
    'Аюто Банк',
    'Коммерческий банк Кыргызстан',
  ],
  // Польша
  PL: [
    'PKO Bank Polski',
    'Bank Pekao',
    'Santander Bank Polska',
    'mBank',
    'ING Bank Śląski',
    'BNP Paribas Bank Polska',
    'Alior Bank',
    'Millennium Bank',
    'Credit Agricole Bank Polska',
    'Getin Noble Bank',
    'Bank Pocztowy',
    'Nest Bank',
  ],
  // Россия
  RU: [
    'Альфа-банк',
    'Газпромбанк',
    'МТС банк',
    'Озонбанк',
    'Промсвязьбанк',
    'ПСБ',
    'Райффайзен',
    'Росбанк',
    'Россельхозбанк',
    'Сбербанк',
    'Тинькофф банк',
    'Юникредит банк',
    'ВТБ',
  ],
  // Сербия
  RS: [
    'Banca Intesa Beograd',
    'UniCredit Bank Serbia',
    'Komercijalna Banka',
    'Raiffeisen Bank Serbia',
    'Erste Bank Serbia',
    'AIK Banka',
    'OTP Bank Serbia',
    'Eurobank Direktna',
    'Addiko Bank Serbia',
    'NLB Komercijalna Banka',
  ],
  // Словакия
  SK: [
    'Slovenská sporiteľňa',
    'VÚB banka',
    'Tatra banka',
    'ČSOB',
    'mBank',
    'Fio banka',
    'Povážská banka',
    'Postová banka',
    'Prima banka Slovensko',
    'UniCredit Bank Czech Republic and Slovakia',
  ],
  // Таджикистан
  TJ: [
    'Амонатбанк',
    'Ориёнбанк',
    'Эсхата-Банк',
    'Bank Arvand',
    'Таджиксодиротбанк',
    'Спитамен Банк',
    'Первый Микрофинансовый Банк',
    'Сохибкорбанк',
    'Банк Русский Стандарт Таджикистан',
    'Банк Точикистон',
  ],
  // Украина
  UA: [
    'ПриватБанк',
    'Monobank',
    'Ощадбанк',
    'ПУМБ',
    'Райффайзен Банк',
    'Укрсиббанк',
    'А-Банк',
    'Універсал Банк',
    'Креді Агріколь',
    'Альфа-Банк Україна',
    'Sense Bank',
    'Укргазбанк',
  ],
  // Узбекистан
  UZ: [
    'Узнацбанк',
    'Асака банк',
    'Ипотека-банк',
    'Капиталбанк',
    'Хамкорбанк',
    'Aloqa Bank',
    'Davr Bank',
    'Anor Bank',
    'InfinBank',
    'Turon Bank',
    'Orient Finans Bank',
    'Ravnaq Bank',
  ],
};

interface PaymentFormProps {
  onSuccess?: () => void;
  onClose?: () => void;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({ onSuccess, onClose }) => {
  const { token } = useAuth();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  const [countries, setCountries] = useState<PaymentCountry[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const baseURL = '';

  const [formData, setFormData] = useState<FormData>({
    currency: 'RUB',
    method: 'card',
    country: 1,
    bank: '',
    card_number: '',
    card_holder: '',
    min_limit: '10',
    max_limit: '1000',
    max_transactions: '100',
  });

  // Default countries (fallback if API fails)
  const DEFAULT_COUNTRIES: PaymentCountry[] = [
    { id: 1, name: 'Абхазия', code: 'AB', flag: '🇺🇳', is_active: true },
    { id: 2, name: 'Аргентина', code: 'AR', flag: '🇦🇷', is_active: true },
    { id: 3, name: 'Армения', code: 'AM', flag: '🇦🇲', is_active: true },
    { id: 4, name: 'Азербайджан', code: 'AZ', flag: '🇦🇿', is_active: true },
    { id: 5, name: 'Беларусь', code: 'BY', flag: '🇧🇾', is_active: true },
    { id: 6, name: 'Кипр', code: 'CY', flag: '🇨🇾', is_active: true },
    { id: 7, name: 'Казахстан', code: 'KZ', flag: '🇰🇿', is_active: true },
    { id: 8, name: 'Киргизия', code: 'KG', flag: '🇰🇬', is_active: true },
    { id: 9, name: 'Польша', code: 'PL', flag: '🇵🇱', is_active: true },
    { id: 10, name: 'Россия', code: 'RU', flag: '🇷🇺', is_active: true },
    { id: 11, name: 'Сербия', code: 'RS', flag: '🇷🇸', is_active: true },
    { id: 12, name: 'Словакия', code: 'SK', flag: '🇸🇰', is_active: true },
    { id: 13, name: 'Таджикистан', code: 'TJ', flag: '🇹🇯', is_active: true },
    { id: 14, name: 'Украина', code: 'UA', flag: '🇺🇦', is_active: true },
    { id: 15, name: 'Узбекистан', code: 'UZ', flag: '🇺🇿', is_active: true },
  ];

  // Fetch countries on mount
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await axios.get(`${baseURL}/api/v1/payment/countries`);
        if (response.data.success && response.data.countries && response.data.countries.length > 0) {
          setCountries(response.data.countries);
          setFormData(prev => ({
            ...prev,
            country: response.data.countries[0].id
          }));
        } else {
          // Use default countries if API returns empty
          setCountries(DEFAULT_COUNTRIES);
        }
      } catch (err) {
        console.error('Failed to fetch countries:', err);
        // Use default countries on error
        setCountries(DEFAULT_COUNTRIES);
      }
    };

    const fetchDevices = async () => {
      try {
        const response = await axios.get(`${baseURL}/api/v1/devices`, {
          headers: {
            'Authorization': `Token ${token}`
          }
        });
        if (Array.isArray(response.data)) {
          setDevices(response.data);
        } else if (response.data.devices) {
          setDevices(response.data.devices);
        }
      } catch (err) {
        console.error('Failed to fetch devices:', err);
      }
    };

    fetchCountries();
    if (token) {
      fetchDevices();
    }
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: (name === 'country' || name === 'device') ? (value ? parseInt(value) : undefined) : value
      };
      // Reset bank when country changes
      if (name === 'country') {
        newData.bank = '';
      }
      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Validate device
      if (!formData.device) {
        setError('Пожалуйста, выберите устройство');
        setLoading(false);
        return;
      }

      // Validate bank
      if (!formData.bank) {
        setError('Пожалуйста, выберите банк');
        setLoading(false);
        return;
      }

      // Validate card number (up to 22 digits for Argentina)
      const cardDigits = formData.card_number.replace(/\s/g, '');
      const selectedCountry = countries.find(c => c.id === formData.country);
      const maxCardLength = selectedCountry?.code === 'AR' ? 22 : 19;
      if (cardDigits.length < 13 || cardDigits.length > maxCardLength) {
        setError(`Номер карты должен содержать 13-${maxCardLength} цифр`);
        setLoading(false);
        return;
      }

      // Validate card holder
      if (formData.card_holder.length < 3) {
        setError('Имя владельца должно быть минимум 3 символа');
        setLoading(false);
        return;
      }

      // Validate limits
      const minLimit = parseFloat(formData.min_limit);
      const maxLimit = parseFloat(formData.max_limit);

      if (minLimit < 10) {
        setError('Минимальный лимит должен быть не менее $10');
        setLoading(false);
        return;
      }

      if (maxLimit > 1000) {
        setError('Максимальный лимит не может превышать $1000');
        setLoading(false);
        return;
      }

      if (minLimit >= maxLimit) {
        setError('Минимальный лимит должен быть меньше максимального');
        setLoading(false);
        return;
      }

      const response = await axios.post(
        `${baseURL}/api/v1/payment/requisites/add`,
        {
          ...formData,
          min_limit: parseFloat(formData.min_limit).toFixed(2),
          max_limit: parseFloat(formData.max_limit).toFixed(2),
          max_transactions: parseInt(formData.max_transactions),
          country: parseInt(formData.country.toString())
        },
        {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.status === 201 && response.data.success) {
        setSuccess(true);
        setFormData({
          currency: 'RUB',
          method: 'card',
          country: countries[0]?.id || 1,
          bank: '',
          card_number: '',
          card_holder: '',
          min_limit: '10',
          max_limit: '1000',
          max_transactions: '100',
        });

        if (onSuccess) {
          setTimeout(onSuccess, 1500);
        }
      }
    } catch (err: any) {
      const responseData = err.response?.data;
      const errorMsg = responseData?.error || 
                       responseData?.detail ||
                       responseData?.non_field_errors?.[0] ||
                       (responseData && typeof responseData === 'object' ? Object.values(responseData)[0] : null) ||
                       'Не удалось добавить реквизит';
      setError(typeof errorMsg === 'string' ? errorMsg : Array.isArray(errorMsg) ? errorMsg[0] : JSON.stringify(errorMsg));
    } finally {
      setLoading(false);
    }
  };

  const formatCardNumber = (value: string, maxDigits: number = 19) => {
    const digits = value.replace(/\D/g, '').slice(0, maxDigits);
    const groups = digits.match(/.{1,4}/g) || [];
    return groups.join(' ');
  };

  // Input styles
  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "14px 16px",
    background: theme.bg.input,
    border: `1px solid ${theme.border.subtle}`,
    borderRadius: 10,
    color: theme.text.primary,
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: "pointer",
    appearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2371717a' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 16px center",
    paddingRight: 40,
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    marginBottom: 8,
    fontSize: 13,
    fontWeight: 500,
    color: theme.text.secondary,
  };

  const hintStyle: React.CSSProperties = {
    fontSize: 12,
    color: theme.text.muted,
    marginTop: 6,
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
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
        width: isMobile ? "100%" : 480,
        height: "100vh",
        background: theme.bg.sidebar,
        borderLeft: isMobile ? "none" : `1px solid ${theme.border.subtle}`,
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
              background: `${theme.accent.primary}20`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: theme.accent.primary,
            }}>
              <Icon name="credit-card" size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Добавить реквизит</h3>
              <div style={{ fontSize: 12, color: theme.text.muted }}>Новый способ оплаты</div>
            </div>
          </div>
          <button
            onClick={onClose}
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

        {/* Form Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
          <form onSubmit={handleSubmit} autoComplete="off">
            {/* Error */}
            {error && (
              <div style={{
                background: `${theme.accent.danger}15`,
                border: `1px solid ${theme.accent.danger}30`,
                color: theme.accent.danger,
                padding: 14,
                borderRadius: 10,
                marginBottom: 20,
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}>
                <Icon name="alert-circle" size={18} />
                {error}
              </div>
            )}

            {/* Success */}
            {success && (
              <div style={{
                background: `${theme.accent.success}15`,
                border: `1px solid ${theme.accent.success}30`,
                color: theme.accent.success,
                padding: 14,
                borderRadius: 10,
                marginBottom: 20,
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}>
                <Icon name="check" size={18} />
                Реквизит успешно добавлен!
              </div>
            )}

            {/* Currency & Method Row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              <div>
                <label style={labelStyle}>Валюта *</label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  required
                  style={selectStyle}
                >
                  <option value="RUB">RUB (Россия)</option>
                  <option value="USD">USD (USA)</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Метод оплаты *</label>
                <select
                  name="method"
                  value={formData.method}
                  onChange={handleChange}
                  required
                  style={selectStyle}
                >
                  <option value="card">Карта</option>
                  <option value="sbp">СБП</option>
                </select>
              </div>
            </div>

            {/* Country */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Страна *</label>
              <select
                name="country"
                value={formData.country}
                onChange={handleChange}
                required
                style={selectStyle}
              >
                {countries.map(country => (
                  <option key={country.id} value={country.id}>
                    {country.flag} {country.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Bank */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Банк *</label>
              <select
                name="bank"
                value={formData.bank}
                onChange={handleChange}
                required
                style={selectStyle}
              >
                <option value="">Выберите банк...</option>
                {(() => {
                  const selectedCountry = countries.find(c => c.id === formData.country);
                  const countryCode = selectedCountry?.code || 'RU';
                  const banks = BANKS_BY_COUNTRY[countryCode] || BANKS_BY_COUNTRY['RU'] || [];
                  return banks.map(bank => (
                    <option key={bank} value={bank}>
                      {bank}
                    </option>
                  ));
                })()}
              </select>
            </div>

            {/* Device */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Устройство *</label>
              <select
                name="device"
                value={formData.device || ''}
                onChange={handleChange}
                style={{
                  ...selectStyle,
                  borderColor: !formData.device && error?.includes('устройство') ? theme.accent.danger : theme.border.subtle,
                }}
              >
                <option value="">Выберите устройство...</option>
                {devices.map(device => (
                  <option key={device.id} value={device.id}>
                    {device.name} ({device.model})
                  </option>
                ))}
              </select>
              <div style={hintStyle}>Выберите устройство для привязки к реквизиту</div>
            </div>

            {/* Card Number */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Номер карты *</label>
              {(() => {
                const selectedCountry = countries.find(c => c.id === formData.country);
                const isArgentina = selectedCountry?.code === 'AR';
                const maxDigits = isArgentina ? 22 : 19;
                const maxLen = isArgentina ? 27 : 23; // digits + spaces
                return (
                  <>
                    <input
                      type="text"
                      name="card_number"
                      placeholder={isArgentina ? "0000 0000 0000 0000 0000 00" : "0000 0000 0000 0000"}
                      value={formatCardNumber(formData.card_number, maxDigits)}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        card_number: e.target.value.replace(/\s/g, '').slice(0, maxDigits)
                      }))}
                      maxLength={maxLen}
                      required
                      autoComplete="off"
                      style={{
                        ...inputStyle,
                        fontFamily: "monospace",
                        fontSize: 18,
                        letterSpacing: 2,
                      }}
                      onFocus={e => e.currentTarget.style.borderColor = theme.accent.primary}
                      onBlur={e => e.currentTarget.style.borderColor = theme.border.subtle}
                    />
                    <div style={hintStyle}>{isArgentina ? '13-22 цифры' : '13-19 цифр'}</div>
                  </>
                );
              })()}
            </div>

            {/* Card Holder */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Имя владельца *</label>
              <input
                type="text"
                name="card_holder"
                placeholder="IVAN IVANOV"
                value={formData.card_holder}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  card_holder: e.target.value.toUpperCase()
                }))}
                minLength={3}
                maxLength={100}
                required
                autoComplete="off"
                style={{
                  ...inputStyle,
                  textTransform: "uppercase",
                }}
                onFocus={e => e.currentTarget.style.borderColor = theme.accent.primary}
                onBlur={e => e.currentTarget.style.borderColor = theme.border.subtle}
              />
              <div style={hintStyle}>Минимум 3 символа</div>
            </div>

            {/* Limits Row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              <div>
                <label style={labelStyle}>Мин. лимит (USD) *</label>
                <div style={{ position: "relative" }}>
                  <input
                    type="number"
                    name="min_limit"
                    placeholder="10"
                    value={formData.min_limit}
                    onChange={handleChange}
                    min="10"
                    max="1000"
                    step="0.01"
                    required
                    style={{
                      ...inputStyle,
                      paddingLeft: 32,
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = theme.accent.primary}
                    onBlur={e => e.currentTarget.style.borderColor = theme.border.subtle}
                  />
                  <span style={{
                    position: "absolute",
                    left: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: theme.text.muted,
                    fontSize: 14,
                  }}>$</span>
                </div>
                <div style={hintStyle}>Минимум $10</div>
              </div>
              <div>
                <label style={labelStyle}>Макс. лимит (USD) *</label>
                <div style={{ position: "relative" }}>
                  <input
                    type="number"
                    name="max_limit"
                    placeholder="1000"
                    value={formData.max_limit}
                    onChange={handleChange}
                    min="10"
                    max="1000"
                    step="0.01"
                    required
                    style={{
                      ...inputStyle,
                      paddingLeft: 32,
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = theme.accent.primary}
                    onBlur={e => e.currentTarget.style.borderColor = theme.border.subtle}
                  />
                  <span style={{
                    position: "absolute",
                    left: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: theme.text.muted,
                    fontSize: 14,
                  }}>$</span>
                </div>
                <div style={hintStyle}>Максимум $1000</div>
              </div>
            </div>

            {/* Transaction Limit */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Лимит транзакций *</label>
              <input
                type="number"
                name="max_transactions"
                placeholder="100"
                value={formData.max_transactions}
                onChange={handleChange}
                min="1"
                max="1000"
                required
                style={inputStyle}
                onFocus={e => e.currentTarget.style.borderColor = theme.accent.primary}
                onBlur={e => e.currentTarget.style.borderColor = theme.border.subtle}
              />
            </div>

            {/* Info Note */}
            <div style={{
              background: `${theme.accent.info}10`,
              border: `1px solid ${theme.accent.info}30`,
              borderRadius: 10,
              padding: 14,
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
            }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: `${theme.accent.info}20`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: theme.accent.info,
                flexShrink: 0,
              }}>
                <Icon name="alert-circle" size={16} />
              </div>
              <div style={{ fontSize: 13, color: theme.text.secondary, lineHeight: 1.5 }}>
                Все данные карты надёжно шифруются. Номер карты будет сохранён в маскированном виде.
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div style={{
          padding: 24,
          borderTop: `1px solid ${theme.border.subtle}`,
          display: "flex",
          gap: 12,
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              padding: 14,
              background: theme.bg.card,
              color: theme.text.secondary,
              border: `1px solid ${theme.border.subtle}`,
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Отмена
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            style={{
              flex: 2,
              padding: 14,
              background: loading ? theme.bg.input : theme.gradient.primary,
              color: loading ? theme.text.muted : "white",
              border: "none",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {loading ? (
              <>
                <Icon name="activity" size={18} />
                Добавление...
              </>
            ) : (
              <>
                <Icon name="plus" size={18} />
                Добавить реквизит
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
};

export default PaymentForm;
