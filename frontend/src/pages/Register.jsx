import { useState } from "react";
import { api } from "../api";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const [message, setMessage] = useState("");

  async function register() {
    try {
      const res = await api.post("/auth/register", {
        username,
        password,
        password_confirm: passwordConfirm
      });

      setMessage("Регистрация успешна!");
    } catch (e) {
      if (e.response?.data) {
        setMessage(JSON.stringify(e.response.data, null, 2));
      } else {
        setMessage("Ошибка");
      }
    }
  }

  return (
    <div style={{ padding: 20, maxWidth: 400 }}>
      <h2>Регистрация</h2>

      <input
        placeholder="Telegram username"
        value={username}
        onChange={e => setUsername(e.target.value)}
        style={{ width: "100%", marginBottom: 10 }}
      />

      <input
        placeholder="Пароль"
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        style={{ width: "100%", marginBottom: 10 }}
      />

      <input
        placeholder="Повтор пароля"
        type="password"
        value={passwordConfirm}
        onChange={e => setPasswordConfirm(e.target.value)}
        style={{ width: "100%", marginBottom: 10 }}
      />

      <button onClick={register}>Зарегистрироваться</button>

      {message && (
        <pre style={{ marginTop: 20, background: "#f5f5f5", padding: 10 }}>
          {message}
        </pre>
      )}
    </div>
  );
}
