import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  // 🔹 Recupera usuário salvo no localStorage
  const initialUser = (() => {
    try {
      const raw = localStorage.getItem("roveri_user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  const [user, setUser] = useState(initialUser);
  const [loading, setLoading] = useState(!!initialUser);

  // 🔹 Sincroniza user no localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem("roveri_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("roveri_user");
    }
  }, [user]);

  // 🔹 Valida sessão se já existe user no localStorage
  useEffect(() => {
    const loadUser = async () => {
      if (!initialUser) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get("accounts/user/");
        setUser(res.data);
      } catch (err) {
        console.warn("Sessão inválida:", err);
        setUser(null);
        localStorage.removeItem("roveri_user");
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // 🔑 Login
  const login = async ({ email, password }) => {
    setLoading(true);
    try {
      const res = await api.post("accounts/login/", { email, password });

      // depois do login, pega dados do usuário
      const userRes = await api.get("accounts/user/");
      setUser(userRes.data);

      return { ok: true };
    } catch (e) {
      const errMsg =
        e?.response?.data?.detail ||
        (e?.response?.data ? JSON.stringify(e.response.data) : e.message);
      return { ok: false, error: errMsg };
    } finally {
      setLoading(false);
    }
  };

  // 🔑 Registro
  const register = async (userData) => {
    setLoading(true);
    try {
      await api.post("accounts/register/", {
        username: userData.email, // backend exige username (pode ser = email)
        email: userData.email,
        password: userData.password,
        password2: userData.password,
        name: userData.name,
        phone: userData.phone,
        city: userData.city,
      });

      const res = await api.get("accounts/user/");
      setUser(res.data);

      return { ok: true };
    } catch (e) {
      const errMsg = e?.response?.data || e?.message || "Erro ao registrar usuário";
      return { ok: false, error: errMsg };
    } finally {
      setLoading(false);
    }
  };

  // 🔒 Logout
  const logout = async () => {
    try {
      await api.post("accounts/logout/");
    } catch {
      // mesmo se falhar, limpa local
    } finally {
      setUser(null);
      localStorage.removeItem("roveri_user");
    }
  };

  const value = { user, loading, login, register, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
