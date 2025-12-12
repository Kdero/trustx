import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { theme, Icon } from "../components/DashboardLayout";

// CSS styles for responsive design
const mobileStyles = `
  @media (max-width: 768px) {
    .landing-header-nav { display: none !important; }
    .landing-mobile-menu-btn { display: flex !important; }
    .landing-mobile-menu { display: flex !important; }
    .landing-platform-label { display: none !important; }
    .landing-hero-title { font-size: 32px !important; }
    .landing-hero-subtitle { font-size: 16px !important; }
    .landing-hero-buttons { flex-direction: column !important; }
    .landing-hero-buttons button { width: 100% !important; }
    .landing-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
    .landing-features-grid { grid-template-columns: 1fr !important; }
    .landing-process-grid { grid-template-columns: repeat(2, 1fr) !important; }
    .landing-contacts-grid { grid-template-columns: 1fr !important; }
    .landing-footer-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
    .landing-section { padding: 48px 16px !important; }
    .landing-section-title { font-size: 28px !important; }
  }
  @media (max-width: 480px) {
    .landing-stats-grid { grid-template-columns: 1fr !important; }
    .landing-process-grid { grid-template-columns: 1fr !important; }
    .landing-hero-title { font-size: 26px !important; }
    .landing-stat-value { font-size: 28px !important; }
  }
`;

// FAQ Item component with accordion
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div
      style={{
        background: theme.bg.card,
        borderRadius: 14,
        border: `1px solid ${isOpen ? theme.accent.primary + "50" : theme.border.subtle}`,
        overflow: "hidden",
        transition: "all 0.2s ease",
      }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: "100%",
          padding: "20px 24px",
          background: "transparent",
          border: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          color: theme.text.primary,
          fontSize: 16,
          fontWeight: 600,
          textAlign: "left",
        }}
      >
        {question}
        <span
          style={{
            transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
            color: theme.accent.primary,
          }}
        >
          <Icon name="plus" size={20} />
        </span>
      </button>
      {isOpen && (
        <div style={{ padding: "0 24px 20px 24px", color: theme.text.secondary, fontSize: 15, lineHeight: 1.6 }}>
          {answer}
        </div>
      )}
    </div>
  );
}

// Stat Card component
function StatCard({ value, label, icon }: { value: string; label: string; icon: string }) {
  return (
    <div
      style={{
        background: theme.bg.card,
        borderRadius: 16,
        padding: "28px 24px",
        textAlign: "center",
        border: `1px solid ${theme.border.subtle}`,
      }}
    >
      <div style={{ color: theme.accent.primary, marginBottom: 12 }}>
        <Icon name={icon} size={28} />
      </div>
      <div
        className="landing-stat-value"
        style={{
          fontSize: 36,
          fontWeight: 800,
          background: theme.gradient.primary,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          marginBottom: 6,
        }}
      >
        {value}
      </div>
      <div style={{ color: theme.text.secondary, fontSize: 14 }}>{label}</div>
    </div>
  );
}

// Feature Card component
function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div
      style={{
        background: theme.bg.card,
        borderRadius: 16,
        padding: 28,
        border: `1px solid ${theme.border.subtle}`,
        transition: "all 0.2s ease",
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 12,
          background: `${theme.accent.primary}15`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: theme.accent.primary,
          marginBottom: 18,
        }}
      >
        <Icon name={icon} size={26} />
      </div>
      <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10, color: theme.text.primary }}>{title}</h3>
      <p style={{ color: theme.text.secondary, fontSize: 15, lineHeight: 1.6, margin: 0 }}>{description}</p>
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Smooth scroll to section
  const scrollTo = (id: string) => {
    setActiveNav(id);
    setMobileMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: theme.bg.dark,
        color: theme.text.primary,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Inject mobile styles */}
      <style>{mobileStyles}</style>

      {/* Sticky Header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: `${theme.bg.dark}ee`,
          backdropFilter: "blur(12px)",
          borderBottom: `1px solid ${theme.border.subtle}`,
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
              <rect x="4" y="4" width="40" height="40" rx="10" fill="url(#logoGrad)" />
              <path d="M14 14H34V20H27V36H21V20H14V14Z" fill="white" />
              <defs>
                <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
            <span style={{ fontWeight: 700, fontSize: 20, letterSpacing: "-0.02em" }}>
              Trust
              <span
                style={{
                  background: theme.gradient.primary,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                X
              </span>
              <span className="landing-platform-label" style={{ fontSize: 11, color: theme.text.muted, marginLeft: 8, fontWeight: 500 }}>P2P Platform</span>
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="landing-header-nav" style={{ display: "flex", alignItems: "center", gap: 32 }}>
            {[
              { id: "features", label: "О нас" },
              { id: "process", label: "Подключение" },
              { id: "faq", label: "FAQ" },
              { id: "contacts", label: "Контакты" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                style={{
                  background: "none",
                  border: "none",
                  color: activeNav === item.id ? theme.text.primary : theme.text.secondary,
                  fontSize: 15,
                  cursor: "pointer",
                  padding: "8px 0",
                  borderBottom: activeNav === item.id ? `2px solid ${theme.accent.primary}` : "2px solid transparent",
                  transition: "all 0.2s",
                }}
              >
                {item.label}
              </button>
            ))}
            <button
              onClick={() => navigate("/login")}
              style={{
                background: theme.gradient.primary,
                color: "#fff",
                border: "none",
                padding: "10px 24px",
                borderRadius: 10,
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
                boxShadow: "0 4px 16px rgba(99, 102, 241, 0.3)",
              }}
            >
              Войти в ЛК
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="landing-mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              display: "none",
              background: "none",
              border: "none",
              color: theme.text.primary,
              padding: 8,
              cursor: "pointer",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name={mobileMenuOpen ? "x" : "menu"} size={28} />
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div
            className="landing-mobile-menu"
            style={{
              display: "none",
              flexDirection: "column",
              padding: "16px 20px 24px",
              gap: 12,
              borderTop: `1px solid ${theme.border.subtle}`,
              background: theme.bg.dark,
            }}
          >
            {[
              { id: "features", label: "О нас" },
              { id: "process", label: "Подключение" },
              { id: "faq", label: "FAQ" },
              { id: "contacts", label: "Контакты" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                style={{
                  background: "none",
                  border: "none",
                  color: activeNav === item.id ? theme.text.primary : theme.text.secondary,
                  fontSize: 16,
                  cursor: "pointer",
                  padding: "12px 0",
                  textAlign: "left",
                  borderBottom: `1px solid ${theme.border.subtle}`,
                }}
              >
                {item.label}
              </button>
            ))}
            <button
              onClick={() => { setMobileMenuOpen(false); navigate("/login"); }}
              style={{
                background: theme.gradient.primary,
                color: "#fff",
                border: "none",
                padding: "14px 24px",
                borderRadius: 10,
                fontWeight: 600,
                fontSize: 16,
                cursor: "pointer",
                marginTop: 8,
              }}
            >
              Войти в ЛК
            </button>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section
        className="landing-section"
        style={{
          padding: "80px 32px 60px",
          background: `radial-gradient(ellipse at top center, ${theme.accent.primary}12 0%, transparent 60%)`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative glow */}
        <div
          style={{
            position: "absolute",
            top: "10%",
            right: "5%",
            width: 300,
            height: 300,
            background: `radial-gradient(circle, ${theme.accent.secondary}15 0%, transparent 70%)`,
            filter: "blur(60px)",
            pointerEvents: "none",
          }}
        />

        <div style={{ maxWidth: 1200, margin: "0 auto", textAlign: "center" }}>
          <div
            style={{
              display: "inline-block",
              background: `${theme.accent.primary}15`,
              border: `1px solid ${theme.accent.primary}30`,
              borderRadius: 20,
              padding: "6px 16px",
              fontSize: 13,
              color: theme.accent.primary,
              fontWeight: 600,
              marginBottom: 24,
            }}
          >
            ⚡ Криптопроцессинг нового уровня
          </div>

          <h1
            className="landing-hero-title"
            style={{
              fontSize: 52,
              fontWeight: 800,
              lineHeight: 1.15,
              marginBottom: 24,
              letterSpacing: "-0.03em",
              maxWidth: 800,
              margin: "0 auto 24px",
            }}
          >
            Автоматизированный процессинг{" "}
            <span
              style={{
                background: theme.gradient.primary,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              платежей
            </span>{" "}
            
          </h1>

          {/* <p
            style={{
              fontSize: 20,
              color: theme.text.secondary,
              maxWidth: 600,
              margin: "0 auto 40px",
              lineHeight: 1.6,
            }}
          >
            Принимайте и отправляйте криптовалюту с минимальными комиссиями. Быстрая интеграция, надёжная защита.
          </p> */}

          <div className="landing-hero-buttons" style={{ display: "flex", gap: 16, justifyContent: "center", marginBottom: 60 }}>
            <button
              onClick={() => navigate("/register")}
              style={{
                background: theme.gradient.primary,
                color: "#fff",
                border: "none",
                padding: "16px 32px",
                borderRadius: 12,
                fontWeight: 700,
                fontSize: 17,
                cursor: "pointer",
                boxShadow: "0 8px 32px rgba(99, 102, 241, 0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
              }}
            >
              Узнать больше <span style={{ fontSize: 20 }}>→</span>
            </button>
            <button
              onClick={() => scrollTo("process")}
              style={{
                background: theme.bg.card,
                color: theme.text.primary,
                border: `1px solid ${theme.border.subtle}`,
                padding: "16px 32px",
                borderRadius: 12,
                fontWeight: 600,
                fontSize: 17,
                cursor: "pointer",
              }}
            >
              Как подключиться?
            </button>
          </div>

          {/* Stats Row */}
          <div className="landing-stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, maxWidth: 900, margin: "0 auto" }}>
            <StatCard value="1.5M" label="Обработанных платежей" icon="activity" />
            <StatCard value="99.9%" label="Проходимость" icon="check" />
            <StatCard value="20 мин" label="Среднее время обработки транзакции" icon="clock" />
            <StatCard value="24/7" label="Поддержка" icon="users" />
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="landing-section" style={{ padding: "80px 32px", background: theme.bg.sidebar }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <span style={{ color: theme.accent.primary, fontSize: 14, fontWeight: 600 }}>Наши преимущества</span>
          </div>
          <h2
            className="landing-section-title"
            style={{
              textAlign: "center",
              fontSize: 36,
              fontWeight: 700,
              marginBottom: 16,
              letterSpacing: "-0.02em",
            }}
          >
            Всё необходимое для работы
            <br />
            с криптовалютными платежами
          </h2>
          <p style={{ textAlign: "center", color: theme.text.secondary, fontSize: 18, marginBottom: 48, maxWidth: 700, margin: "0 auto 48px" }}>
            Единая платформа для{" "}
            <span style={{ color: theme.accent.success, fontWeight: 600 }}>входа</span>,{" "}
            <span style={{ color: theme.accent.primary, fontWeight: 600 }}>выхода</span> и управления
            платежами.
          </p>

          <div id="features" className="landing-features-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
            <FeatureCard
              icon="shield"
              title="Безопасность средств"
              description="Холодное хранение активов, мультиподпись и ежедневный аудит. Ваши средства под надёжной защитой 24/7."
            />
            <FeatureCard
              icon="clock"
              title="Моментальные выплаты"
              description="Поток платежей — основа вашего дохода. Мы не устанавливаем ограничений по объёму, позволяя вам масштабировать свой заработок."
            />
            <FeatureCard
              icon="activity"
              title="Неограниченный объём трафика"
              description="Детальная статистика по всем операциям в реальном времени. Отслеживайте доходы и контролируйте бизнес."
            />
            <FeatureCard
              icon="users"
              title="Персональный TeamLead"
              description="Выделенный TeamLead   для решения любых вопросов. Помощь с настройкой и оптимизацией работы."
            />
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section id="process" className="landing-section" style={{ padding: "80px 32px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <span style={{ color: theme.accent.primary, fontSize: 14, fontWeight: 600 }}>Как начать?</span>
          </div>
          <h2 className="landing-section-title" style={{ textAlign: "center", fontSize: 36, fontWeight: 700, marginBottom: 48, letterSpacing: "-0.02em" }}>
            Процесс подключения
          </h2>

          <div className="landing-process-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }}>
            {[
              {
                num: "1",
                icon: "user",
                title: "Оставьте заявку",
                desc: "Заполните форму регистрации и укажите Telegram для связи",
              },
              {
                num: "2",
                icon: "shield",
                title: "Пройдите проверку",
                desc: "Наш менеджер свяжется с вами для подтверждения данных",
              },
              {
                num: "3",
                icon: "download",
                title: "Пополните баланс",
                desc: "Внесите депозит и получите доступ ко всем функциям",
              },
              {
                num: "4",
                icon: "activity",
                title: "Начните зарабатывать",
                desc: "Принимайте платежи и выводите прибыль в любое время",
              },
            ].map((step) => (
              <div
                key={step.num}
                style={{
                  background: theme.bg.card,
                  borderRadius: 16,
                  padding: 28,
                  border: `1px solid ${theme.border.subtle}`,
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 20,
                    right: 20,
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: `${theme.accent.primary}15`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: theme.accent.primary,
                    fontWeight: 700,
                    fontSize: 14,
                  }}
                >
                  {step.num}
                </div>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: theme.gradient.primary,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    marginBottom: 18,
                  }}
                >
                  <Icon name={step.icon} size={24} />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{step.title}</h3>
                <p style={{ color: theme.text.secondary, fontSize: 14, margin: 0, lineHeight: 1.5 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="landing-section" style={{ padding: "80px 32px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <h2 className="landing-section-title" style={{ textAlign: "center", fontSize: 36, fontWeight: 700, marginBottom: 48, letterSpacing: "-0.02em" }}>
            Часто задаваемые вопросы
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <FAQItem
              question="Какие криптовалюты поддерживаются?"
              answer="На данный момент мы работаем с USDT в сети TRC20. Это позволяет обеспечить быстрые транзакции с минимальными комиссиями сети."
            />
            <FAQItem
              question="Как быстро обрабатываются выводы?"
              answer="Большинство выводов обрабатываются автоматически в течение 5-15 минут. В пиковые часы время может увеличиться до 1 часа."
            />
            <FAQItem
              question="Есть ли лимиты на операции?"
              answer="Минимальный депозит составляет $500 USDT. Лимиты на вывод зависят от вашего уровня верификации и истории работы с платформой."
            />
            <FAQItem
              question="Как связаться с поддержкой?"
              answer="Наша команда доступна 24/7 через Telegram. Среднее время ответа — менее 10 минут."
            />
            <FAQItem
              question="Можно ли интегрировать TrustX с моим сайтом?  "
              answer="Да, мы предоставляем API для интеграции платёжных решений. Для подробностей свяжитесь с вашим менеджером."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        className="landing-section"
        style={{
          padding: "80px 32px",
          background: `linear-gradient(135deg, ${theme.accent.primary}15 0%, ${theme.accent.secondary}10 100%)`,
        }}
      >
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
          <h2 className="landing-section-title" style={{ fontSize: 36, fontWeight: 700, marginBottom: 16, letterSpacing: "-0.02em" }}>
            Готовы начать?
          </h2>
          <p style={{ color: theme.text.secondary, fontSize: 18, marginBottom: 32 }}>
            Зарегистрируйтесь сейчас и получите персональную консультацию от нашего менеджера
          </p>
          <button
            onClick={() => navigate("/register")}
            style={{
              background: theme.gradient.primary,
              color: "#fff",
              border: "none",
              padding: "18px 48px",
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 18,
              cursor: "pointer",
              boxShadow: "0 8px 32px rgba(99, 102, 241, 0.4)",
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <Icon name="telegram" size={22} /> Подключиться
          </button>
        </div>
      </section>

      {/* Contacts Section */}
      <section id="contacts" className="landing-section" style={{ padding: "80px 32px", background: theme.bg.sidebar }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <h2 className="landing-section-title" style={{ textAlign: "center", fontSize: 36, fontWeight: 700, marginBottom: 16 }}>
            Связь с командой TrustX
          </h2>
          <p style={{ textAlign: "center", color: theme.text.secondary, marginBottom: 48 }}>
            Наша команда всегда готова помочь
          </p>

          <div
            className="landing-contacts-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 32,
              maxWidth: 700,
              margin: "0 auto",
            }}
          >
            <a
              href="https://t.me/trustx_support"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                background: theme.bg.card,
                borderRadius: 14,
                padding: "24px 28px",
                border: `1px solid ${theme.border.subtle}`,
                textDecoration: "none",
                color: theme.text.primary,
                transition: "all 0.2s",
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 12,
                  background: "#229ED9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                }}
              >
                <Icon name="telegram" size={26} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>Telegram Support</div>
                <div style={{ color: theme.text.secondary, fontSize: 14 }}>@trustx_mng</div>
              </div>
            </a>

            <a
              href="mailto:support@trustx.io"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                background: theme.bg.card,
                borderRadius: 14,
                padding: "24px 28px",
                border: `1px solid ${theme.border.subtle}`,
                textDecoration: "none",
                color: theme.text.primary,
                transition: "all 0.2s",
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 12,
                  background: theme.gradient.primary,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                }}
              >
                <Icon name="mail" size={26} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>Email</div>
                <div style={{ color: theme.text.secondary, fontSize: 14 }}>support@trustx.io</div>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-section" style={{ background: theme.bg.dark, borderTop: `1px solid ${theme.border.subtle}`, padding: "48px 20px 32px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div className="landing-footer-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 48, marginBottom: 48 }}>
            {/* Brand */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <svg width="32" height="32" viewBox="0 0 48 48" fill="none">
                  <rect x="4" y="4" width="40" height="40" rx="10" fill="url(#footerLogoGrad)" />
                  <path d="M14 14H34V20H27V36H21V20H14V14Z" fill="white" />
                  <defs>
                    <linearGradient id="footerLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                </svg>
                <span style={{ fontWeight: 700, fontSize: 18 }}>
                  Trust
                  <span
                    style={{
                      background: theme.gradient.primary,
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    X
                  </span>
                </span>
              </div>
              <p style={{ color: theme.text.secondary, fontSize: 14, lineHeight: 1.6, maxWidth: 280 }}>
                Процессинговая платформа для крипто-трейдеров и команд. Надёжность, безопасность, высокая конверсия.
              </p>
            </div>

            {/* Navigation */}
            <div>
              <div style={{ fontWeight: 600, marginBottom: 16, color: theme.text.primary }}>Навигация</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {["О нас", "Подключение", "FAQ", "Контакты"].map((item) => (
                  <button
                    key={item}
                    onClick={() => scrollTo(item === "О нас" ? "features" : item === "Подключение" ? "process" : item.toLowerCase())}
                    style={{
                      background: "none",
                      border: "none",
                      color: theme.text.secondary,
                      fontSize: 14,
                      cursor: "pointer",
                      textAlign: "left",
                      padding: 0,
                    }}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {/* Social */}
            <div>
              <div style={{ fontWeight: 600, marginBottom: 16, color: theme.text.primary }}>Соцсети</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <a href="https://t.me/trustx_news" target="_blank" rel="noopener noreferrer" style={{ color: theme.text.secondary, fontSize: 14, textDecoration: "none" }}>
                  Telegram Channel
                </a>
                <a href="https://t.me/trustx_support" target="_blank" rel="noopener noreferrer" style={{ color: theme.text.secondary, fontSize: 14, textDecoration: "none" }}>
                  Telegram Support
                </a>
              </div>
            </div>

            {/* Legal */}
            <div>
              {/* <div style={{ fontWeight: 600, marginBottom: 16, color: theme.text.primary }}>Документы</div> */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div
            style={{
              padding: "20px 0",
              borderTop: `1px solid ${theme.border.subtle}`,
              marginBottom: 20,
            }}
          >
            <p style={{ color: theme.text.muted, fontSize: 12, lineHeight: 1.6, margin: 0 }}>
              TrustX не является банком или ЭПС, платежи, переводы и хранение средств осуществляется лицензированными
              банками-партнёрами. Информация на сайте не является публичной офертой.
            </p>
          </div>

          {/* Copyright */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ color: theme.text.muted, fontSize: 13 }}>© 2025 TrustX. Все права защищены.</div>
            <div style={{ color: theme.text.muted, fontSize: 12 }}>
              {/* 📍 #3503, Charalampou Mouskou, Paphos, Cyprus */}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
