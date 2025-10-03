import "./Home.css";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, Search, MessageCircle, Shield } from "lucide-react";
import { fadeInUp } from "../utils/motion";
import api from "../services/api"; // ✅ axios centralizado

const Home = () => {
  const [stats, setStats] = useState({
    petsAdotados: 0,
    usuariosAtivos: 0,
    cidadesAtendidas: 0,
  });

  const features = [
    {
      icon: <Search className="h-8 w-8" />,
      title: "Encontre seu Pet",
      description: "Busque por cães e gatos disponíveis para adoção em sua região",
    },
    {
      icon: <Heart className="h-8 w-8" />,
      title: "Ajude um Animal",
      description: "Cadastre pets que precisam de um novo lar e encontre famílias amorosas",
    },
    {
      icon: <MessageCircle className="h-8 w-8" />,
      title: "Chat Integrado",
      description: "Converse diretamente com outros usuários sobre adoções",
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Ambiente Seguro",
      description: "Plataforma moderada para garantir a segurança de todos",
    },
  ];

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("stats/"); // ✅ agora via axios centralizado
        setStats(res.data);
      } catch (err) {
        console.error("Erro ao buscar estatísticas:", err.response?.data || err);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeInUp} className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Conectando <span className="text-emerald-600">Corações</span> e{" "}
              <span className="text-blue-600">Patas</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              A maior comunidade de adoção de pets do Brasil. Encontre seu novo melhor amigo
              ou ajude um animal a encontrar uma família amorosa.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/pets"
                className="bg-emerald-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-emerald-700 transition-colors"
              >
                Ver Pets Disponíveis
              </Link>
              <Link
                to="/register"
                className="bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 px-8 py-3 rounded-lg text-lg font-semibold border-2 border-emerald-600 hover:bg-emerald-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cadastrar-se
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Como Funciona
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Nossa plataforma facilita o processo de adoção, conectando pessoas que querem
              adotar com aquelas que precisam encontrar um novo lar para seus pets.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                {...fadeInUp}
                transition={{ delay: index * 0.1 }}
                className="text-center p-6 rounded-xl bg-gray-50 dark:bg-gray-800 hover:shadow-lg transition-shadow"
              >
                <div className="text-emerald-600 dark:text-emerald-400 mb-4 flex justify-center">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-emerald-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <motion.div {...fadeInUp}>
              <div className="text-4xl font-bold text-white mb-2">{stats.petsAdotados}+</div>
              <div className="text-emerald-100">Pets Adotados</div>
            </motion.div>
            <motion.div {...fadeInUp} transition={{ delay: 0.1 }}>
              <div className="text-4xl font-bold text-white mb-2">{stats.usuariosAtivos}+</div>
              <div className="text-emerald-100">Usuários Ativos</div>
            </motion.div>
            <motion.div {...fadeInUp} transition={{ delay: 0.2 }}>
              <div className="text-4xl font-bold text-white mb-2">{stats.cidadesAtendidas}+</div>
              <div className="text-emerald-100">Cidades Atendidas</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div {...fadeInUp}>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
              Pronto para Fazer a Diferença?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Junte-se à nossa comunidade e ajude a conectar pets com famílias amorosas.
            </p>
            <Link
              to="/register"
              className="bg-emerald-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-emerald-700 transition-colors inline-block"
            >
              Começar Agora
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;
