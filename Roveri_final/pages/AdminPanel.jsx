import "./AdminPanel.css";
// src/pages/AdminPanel.jsx

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import api from "../services/api";
import {
  Users,
  Heart,
  MessageSquare,
  Settings,
  Ban,
  CheckCircle,
  Trash2,
  Edit,
} from "lucide-react";

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [users, setUsers] = useState([]);
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Buscar dados do backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, petsRes] = await Promise.all([
          api.get("users/"), // usando api (com JWT)
          api.get("pets/"),
        ]);
        setUsers(usersRes.data);
        setPets(petsRes.data);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Estatísticas do dashboard
  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter((u) => u.status === "active").length,
    totalPets: pets.length,
    availablePets: pets.filter((p) => p.status === "available").length,
    adoptedPets: pets.filter((p) => p.status === "adopted").length,
    totalViews: pets.reduce((sum, pet) => sum + (pet.views || 0), 0),
  };

  // Ações nos usuários
  const handleUserAction = async (userId, action) => {
    try {
      await api.post(`users/${userId}/${action}/`);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? { ...u, status: action === "block" ? "blocked" : "active" }
            : u
        )
      );
    } catch (error) {
      console.error(`Erro ao ${action} usuário:`, error);
    }
  };

  // Ações nos pets
  const handlePetAction = async (petId, action) => {
    try {
      if (action === "delete") {
        await api.delete(`pets/${petId}/`);
        setPets((prev) => prev.filter((p) => p.id !== petId));
      } else if (action === "edit") {
        // Aqui você pode abrir modal ou redirecionar para página de edição
        console.log("Editar pet:", petId);
      }
    } catch (error) {
      console.error(`Erro ao ${action} pet:`, error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-600 dark:text-gray-300">
        Carregando dados...
      </div>
    );
  }

  // --- COMPONENTES DAS ABAS ---
  const OverviewTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <StatCard
        icon={<Users className="w-6 h-6 text-blue-500" />}
        title="Usuários"
        value={stats.totalUsers}
      />
      <StatCard
        icon={<Heart className="w-6 h-6 text-pink-500" />}
        title="Pets Cadastrados"
        value={stats.totalPets}
      />
      <StatCard
        icon={<CheckCircle className="w-6 h-6 text-green-500" />}
        title="Pets Adotados"
        value={stats.adoptedPets}
      />
      <StatCard
        icon={<MessageSquare className="w-6 h-6 text-purple-500" />}
        title="Usuários Ativos"
        value={stats.activeUsers}
      />
      <StatCard
        icon={<Heart className="w-6 h-6 text-orange-500" />}
        title="Pets Disponíveis"
        value={stats.availablePets}
      />
      <StatCard
        icon={<Settings className="w-6 h-6 text-gray-500" />}
        title="Total de Visualizações"
        value={stats.totalViews}
      />
    </div>
  );

  const UsersTab = () => (
    <div className="space-y-4">
      {users.map((user) => (
        <motion.div
          key={user.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow"
        >
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {user.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {user.email}
            </p>
          </div>
          <div className="flex space-x-2">
            {user.status === "active" ? (
              <button
                onClick={() => handleUserAction(user.id, "block")}
                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
              >
                <Ban className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={() => handleUserAction(user.id, "unblock")}
                className="p-2 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"
              >
                <CheckCircle className="w-5 h-5" />
              </button>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );

  const PetsTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {pets.map((pet) => (
        <motion.div
          key={pet.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden"
        >
          <img
            src={pet.image || "https://placekitten.com/400/300"}
            alt={pet.name}
            className="w-full h-48 object-cover"
          />
          <div className="p-4">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
              {pet.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {pet.species} • {pet.age_text}
            </p>
            <div className="mt-4 flex space-x-2">
              <button
                onClick={() => handlePetAction(pet.id, "edit")}
                className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
              >
                <Edit className="w-5 h-5" />
              </button>
              <button
                onClick={() => handlePetAction(pet.id, "delete")}
                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );

  // --- COMPONENTE AUXILIAR ---
  const StatCard = ({ icon, title, value }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
        </div>
        {icon}
      </div>
    </motion.div>
  );

  // --- RETORNO ---
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Painel Administrativo
        </h1>

        {/* Tabs */}
        <div className="flex space-x-4 mb-8">
          {[
            { id: "overview", label: "Visão Geral" },
            { id: "users", label: "Usuários" },
            { id: "pets", label: "Pets" },
            { id: "settings", label: "Configurações" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Conteúdo da Tab */}
        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "users" && <UsersTab />}
        {activeTab === "pets" && <PetsTab />}
        {activeTab === "settings" && (
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Configurações
            </h2>
            <p className="text-gray-600 dark:text-gray-300">Em breve...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
