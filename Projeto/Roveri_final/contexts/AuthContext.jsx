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
  const [networkOffline, setNetworkOffline] = useState(false);

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
      // keep any existing user while we validate (prevents immediate redirect on transient network errors)
      setNetworkOffline(false);

      console.log('🔐 Validando sessão...');
      console.log('🍪 Cookies disponíveis:', document.cookie);
      console.log('👤 Usuário no localStorage:', initialUser ? 'Sim' : 'Não');

      try {
        const res = await api.get("accounts/user/");
        console.log('✅ Usuário validado com sucesso:', res.data);
        setUser(res.data);
        // ensure stored user is in sync
        try {
          localStorage.setItem("roveri_user", JSON.stringify(res.data));
        } catch {}
      } catch (err) {
        // persist a short error artifact so we can debug redirect issues
        try {
          const errObj = {
            message: err?.message,
            status: err?.response?.status,
            data: err?.response?.data,
          };
          localStorage.setItem("auth_last_error", JSON.stringify(errObj));
        } catch (e) {
          // ignore storage errors
        }

        // network-level error (no response) -> mark offline but do NOT clear stored user
        if (!err?.response) {
          console.warn("Network error while validating session:", err);
          setNetworkOffline(true);
        } else if (err.response && err.response.status === 401) {
          // auth invalid -> clear stored user/tokens
          console.warn("Sessão inválida (401):", err);
          setUser(null);
          localStorage.removeItem("roveri_user");
          // remove any stale tokens left from previous behavior
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
        } else {
          // other HTTP error -> keep user until explicit 401
          console.warn("HTTP error while validating session:", err);
        }
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
      console.log('🔐 Tentando fazer login...');
      console.log('🍪 Cookies antes do login:', document.cookie);
      
      const res = await api.post("accounts/login/", { email, password });

      console.log('✅ Login bem-sucedido:', res.data);
      console.log('🍪 Cookies após login:', document.cookie);

      // persist full response for debugging
      try {
        localStorage.setItem("auth_last_response", JSON.stringify(res.data));
      } catch {}

      // Backend retorna user no response E seta cookies
      // Usa os dados do usuário que já vieram no response
      if (res.data.user) {
        setUser(res.data.user);
        return { ok: true };
      }

      // Fallback: se por algum motivo não tiver user no response, busca
      try {
        console.log('⚠️ User não veio no response, buscando...');
        const userRes = await api.get("accounts/user/");
        console.log('✅ User obtido:', userRes.data);
        setUser(userRes.data);
      } catch (errUser) {
        // save the error for debugging but don't clear tokens here
        try {
          const errObj = {
            message: errUser?.message,
            status: errUser?.response?.status,
            data: errUser?.response?.data,
          };
          localStorage.setItem("auth_last_error", JSON.stringify(errObj));
        } catch {}
        
        return { ok: false, error: "Falha ao carregar dados do usuário" };
      }

      return { ok: true };
    } catch (e) {
      // persist error so debug UI can show it
      try {
        const errObj = {
          message: e?.message,
          status: e?.response?.status,
          data: e?.response?.data,
        };
        localStorage.setItem("auth_last_error", JSON.stringify(errObj));
      } catch {}

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
      const resp = await api.post("auth/register/", {
        first_name: userData.first_name,
        last_name: userData.last_name,
        email: userData.email,
        password: userData.password,
        password2: userData.password,
        phone: userData.phone || "",
        city: userData.city || "",
      });

      // Backend sets HttpOnly cookies with tokens

      const res = await api.get("auth/user/");
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
    console.log('🚪 Fazendo logout...');
    console.log('🍪 Cookies antes do logout:', document.cookie);
    
    try {
      // Tell backend to clear auth cookies
      await api.post("accounts/logout/");
      console.log('✅ Logout no backend bem-sucedido');
    } catch (e) {
      // ignore errors from the API call, but continue to clear local state
      console.warn('⚠️ Logout request failed, clearing local session anyway', e);
    }

    // Clear all local auth artifacts so a page reload doesn't re-authenticate
    setUser(null);
    try {
      localStorage.removeItem("roveri_user");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    } catch (e) {
      /* ignore storage errors */
    }
    
    console.log('🍪 Cookies após logout:', document.cookie);
    // Optional: Force a small navigation change so UI reacts immediately
    // window.location.href = '/';
  };

  const value = { user, loading, login, register, logout, networkOffline };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
