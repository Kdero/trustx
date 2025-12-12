import { useState } from "react";
import { api } from "../api";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleLogin() {
    if (!username || !password) {
      setMessage("Заполните все поля");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/login", {
        username,
        password
      });

      // Сохраняем токен в localStorage
      localStorage.setItem("authToken", res.data.token);
      localStorage.setItem("username", res.data.username);

      setMessage("Авторизация успешна!");
      setTimeout(() => {
        navigate("/admin");
      }, 1000);
    } catch (e) {
      if (e.response?.data) {
        const errors = e.response.data;
        if (typeof errors === "object") {
          const errorMessage = Object.values(errors).flat().join(", ");
          setMessage(errorMessage);
        } else {
          setMessage(JSON.stringify(e.response.data, null, 2));
        }
      } else {
        setMessage("Ошибка подключения");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 20, maxWidth: 400, margin: "0 auto" }}>
      <h2>Авторизация</h2>

      <input
        placeholder="Имя пользователя"
        value={username}
        onChange={e => setUsername(e.target.value)}
        onKeyPress={e => e.key === "Enter" && handleLogin()}
        style={{ width: "100%", marginBottom: 10, padding: 8, boxSizing: "border-box" }}
      />

      <input
        placeholder="Пароль"
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        onKeyPress={e => e.key === "Enter" && handleLogin()}
        style={{ width: "100%", marginBottom: 10, padding: 8, boxSizing: "border-box" }}
      />

      <button
        onClick={handleLogin}
        disabled={loading}
        style={{
          width: "100%",
          padding: 10,
          background: loading ? "#999" : "#007bff",
          color: "white",
          border: "none",
          borderRadius: 4,
          cursor: loading ? "not-allowed" : "pointer",
          fontSize: 16
        }}
      >
        {loading ? "Загрузка..." : "Войти"}
      </button>

      {message && (
        <div style={{
          marginTop: 20,
          padding: 10,
          background: message.includes("успешна") ? "#d4edda" : "#f8d7da",
          color: message.includes("успешна") ? "#155724" : "#721c24",
          borderRadius: 4,
          border: `1px solid ${message.includes("успешна") ? "#c3e6cb" : "#f5c6cb"}`
        }}>
          {message}
        </div>
      )}

      <div style={{ marginTop: 20, textAlign: "center", fontSize: 14 }}>
        <p>Нет аккаунта? <a href="/register" style={{ color: "blue" }}>Зарегистрируйтесь</a></p>
      </div>
    </div>
  );
}
