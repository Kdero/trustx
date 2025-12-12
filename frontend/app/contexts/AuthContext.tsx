import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { ReactNode } from "react";

interface AuthContextType {
  username: string | null;
  role: string;
  isVerified: boolean;
  token: string | null;
  balance: number;
  logout: () => void;
  setAuthData: (username: string | null, role: string, isVerified: boolean, token: string | null, balance: number) => void;
  updateBalance: (newBalance: number) => void;
  setUsername: (username: string) => void;
  setToken: (token: string) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [username, setUsername] = useState<string | null>(null);
  const [role, setRole] = useState<string>("user");
  const [isVerified, setIsVerified] = useState<boolean>(true);
  const [token, setToken] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  // Инициализируем состояние из localStorage один раз при загрузке
  useEffect(() => {
    const savedUsername = localStorage.getItem("username");
    const savedRole = localStorage.getItem("role") || "user";
    const savedIsVerified = localStorage.getItem("isVerified") === "true";
    const savedToken = localStorage.getItem("authToken");
    const savedBalance = parseFloat(localStorage.getItem("balance") || "0");

    setUsername(savedUsername);
    setRole(savedRole);
    setIsVerified(savedIsVerified);
    setToken(savedToken);
    setBalance(savedBalance);
    setIsLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    localStorage.removeItem("isVerified");
    localStorage.removeItem("balance");
    
    setUsername(null);
    setRole("user");
    setIsVerified(true);
    setToken(null);
    setBalance(0);
    window.location.href = "/";
  };

  const setAuthData = (newUsername: string | null, newRole: string, newIsVerified: boolean, newToken: string | null, newBalance: number = 0) => {
    setUsername(newUsername);
    setRole(newRole);
    setIsVerified(newIsVerified);
    setToken(newToken);
    setBalance(newBalance);

    if (newUsername) {
      localStorage.setItem("username", newUsername);
      localStorage.setItem("role", newRole);
      localStorage.setItem("isVerified", String(newIsVerified));
      localStorage.setItem("balance", String(newBalance));
      if (newToken) {
        localStorage.setItem("authToken", newToken);
      }
      // Редирект на cabinet после успешной авторизации
      window.location.href = "/cabinet";
    }
  };

  const updateBalance = (newBalance: number) => {
    setBalance(newBalance);
    localStorage.setItem("balance", String(newBalance));
  };

  const updateUsername = (newUsername: string) => {
    setUsername(newUsername);
    localStorage.setItem("username", newUsername);
  };

  const updateToken = (newToken: string) => {
    setToken(newToken);
    localStorage.setItem("authToken", newToken);
  };

  // Функция для получения актуального баланса и статуса верификации с сервера
  const refreshUser = useCallback(async () => {
    const currentToken = token || localStorage.getItem("authToken");
    if (!currentToken) return;
    try {
      const response = await fetch("/api/v1/auth/me", {
        headers: { Authorization: `Token ${currentToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        const newBalance = parseFloat(data.balance) || 0;
        setBalance(newBalance);
        localStorage.setItem("balance", String(newBalance));
        // Обновляем статус верификации
        if (typeof data.is_verified !== "undefined") {
          setIsVerified(Boolean(data.is_verified));
          localStorage.setItem("isVerified", String(Boolean(data.is_verified)));
        }
      }
    } catch (error) {
      console.error("Failed to refresh user:", error);
    }
  }, [token]);

  // Автоматически обновляем пользователя каждые 10 секунд и при загрузке
  useEffect(() => {
    if (token) {
      refreshUser();
      const interval = setInterval(refreshUser, 10000);
      return () => clearInterval(interval);
    }
  }, [token, refreshUser]);

  if (isLoading) {
    return <div>Загрузка...</div>;
  }

  return (
    <AuthContext.Provider value={{ 
      username, 
      role, 
      isVerified, 
      token, 
      balance, 
      logout: handleLogout, 
      setAuthData, 
      updateBalance,
      setUsername: updateUsername,
      setToken: updateToken,
      refreshUser // <-- только refreshUser, без refreshBalance
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth должен быть использован внутри AuthProvider");
  }
  return context;
}
