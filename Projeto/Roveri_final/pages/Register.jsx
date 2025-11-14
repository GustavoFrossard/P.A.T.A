// src/pages/Register.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, User, Phone, MapPin, Eye, EyeOff, Calendar } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { fadeInUp } from "../utils/motion";

const Register = () => {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    city: "",
    birthDate: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Aplica máscara de telefone
    if (name === 'phone') {
      const maskedValue = applyPhoneMask(value);
      setFormData({ ...formData, [name]: maskedValue });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Função para aplicar máscara de telefone brasileiro
  const applyPhoneMask = (value) => {
    // Remove tudo que não é dígito
    let phoneNumber = value.replace(/\D/g, '');
    
    // Limita a 11 dígitos
    phoneNumber = phoneNumber.substring(0, 11);
    
    // Aplica a máscara
    if (phoneNumber.length <= 10) {
      // Formato: (XX) XXXX-XXXX
      phoneNumber = phoneNumber.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
    } else {
      // Formato: (XX) XXXXX-XXXX
      phoneNumber = phoneNumber.replace(/^(\d{2})(\d{5})(\d{0,4}).*/, '($1) $2-$3');
    }
    
    return phoneNumber;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    // Validar idade (18+)
    if (!formData.birthDate) {
      setError("Por favor, informe sua data de nascimento");
      return;
    }

    const birthDate = new Date(formData.birthDate);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < 18) {
      setError("Você precisa ter pelo menos 18 anos para se cadastrar");
      return;
    }

    setLoading(true);
    try {
      const result = await register({
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        city: formData.city,
        password: formData.password,
      });
      
      if (result.ok) {
        // Redirecionar para a home após registro bem-sucedido
        navigate("/");
      } else {
        // Tratar erros do backend
        if (typeof result.error === 'object' && result.error.email) {
          setError(result.error.email[0] || result.error.email);
        } else {
          setError(
            typeof result.error === 'string' 
              ? result.error 
              : JSON.stringify(result.error)
          );
        }
      }
    } catch (err) {
      console.error("Erro no registro:", err);
      setError("Erro ao registrar usuário. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div {...fadeInUp} className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900 dark:text-white">
            Criar nova conta
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Já tem conta?{" "}
            <Link
              to="/login"
              className="font-medium text-emerald-600 hover:text-emerald-500"
            >
              Faça login
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
            {/* Nome */}
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                name="firstName"
                type="text"
                required
                placeholder="Primeiro nome"
                value={formData.firstName}
                onChange={handleChange}
                className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-800 
                text-gray-900 dark:text-white"
              />
            </div>

            {/* Sobrenome */}
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                name="lastName"
                type="text"
                required
                placeholder="Sobrenome"
                value={formData.lastName}
                onChange={handleChange}
                className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-800 
                text-gray-900 dark:text-white"
              />
            </div>

            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                name="email"
                type="email"
                required
                placeholder="seu@email.com"
                value={formData.email}
                onChange={handleChange}
                className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-800 
                text-gray-900 dark:text-white"
              />
            </div>

            {/* Telefone */}
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                name="phone"
                type="tel"
                placeholder="(00) 00000-0000"
                value={formData.phone}
                onChange={handleChange}
                maxLength={15}
                className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-800 
                text-gray-900 dark:text-white"
              />
            </div>

            {/* Cidade */}
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                name="city"
                type="text"
                placeholder="Sua cidade"
                value={formData.city}
                onChange={handleChange}
                className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-800 
                text-gray-900 dark:text-white"
              />
            </div>

            {/* Data de Nascimento */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                name="birthDate"
                type="date"
                required
                value={formData.birthDate}
                onChange={handleChange}
                max={new Date().toISOString().split('T')[0]}
                className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-800 
                text-gray-900 dark:text-white"
              />
            </div>

            {/* Senha */}
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                required
                placeholder="Senha"
                value={formData.password}
                onChange={handleChange}
                className="pl-10 pr-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-800 
                text-gray-900 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>

            {/* Confirmar Senha */}
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                name="confirmPassword"
                type={showConfirm ? "text" : "password"}
                required
                placeholder="Confirme sua senha"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="pl-10 pr-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-800 
                text-gray-900 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirm ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium 
            rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 
            focus:ring-offset-2 focus:ring-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Criando conta..." : "Criar conta"}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default Register;
