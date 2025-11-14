import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { fadeInUp } from "../utils/motion";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const { login, loading } = useAuth(); // pega o loading também
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(""); // limpa erro ao digitar
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.email || !formData.password) {
      setError("Por favor, preencha todos os campos");
      return;
    }

    const res = await login({
      email: formData.email,
      password: formData.password,
    });

    if (res.ok) {
      navigate("/");
    } else {
      setError(res.error || "Email ou senha incorretos");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div {...fadeInUp} className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900 dark:text-white">
            Entrar na sua conta
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Ou{" "}
            <Link
              to="/register"
              className="font-medium text-emerald-600 hover:text-emerald-500"
            >
              criar uma nova conta
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                             focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 
                             bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="pl-10 pr-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                             focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 
                             bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="Sua senha"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 
                             text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Opções extras */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
              />
              <label
                htmlFor="remember-me"
                className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
              >
                Lembrar de mim
              </label>
            </div>

            <div className="text-sm">
              <a
                href="#"
                className="font-medium text-emerald-600 hover:text-emerald-500"
              >
                Esqueceu a senha?
              </a>
            </div>
          </div>

          {/* Botão */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-2 px-4 
                         border border-transparent text-sm font-medium rounded-lg 
                         text-white ${
                           loading
                             ? "bg-emerald-400 cursor-not-allowed"
                             : "bg-emerald-600 hover:bg-emerald-700"
                         } 
                         focus:outline-none focus:ring-2 focus:ring-offset-2 
                         focus:ring-emerald-500 transition-colors`}
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </div>
        </form>

        {/* debug UI removed */}
      </motion.div>
    </div>
  );
};

export default Login;
