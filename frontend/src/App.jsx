import { Routes, Route, Link } from "react-router-dom";
import Register from "./pages/Register";
import Admin from "./pages/Admin";
import Landing from "../app/routes/landing";

export default function App() {
  return (
    <div style={{ fontFamily: "sans-serif" }}>
      <nav style={{ padding: 10, background: "#eee" }}>
        <Link to="/">Главная</Link>
        <Link to="/register" style={{ marginLeft: 20 }}>Регистрация</Link>
        <Link to="/admin" style={{ marginLeft: 20 }}>Админ панель</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </div>
  );
}
