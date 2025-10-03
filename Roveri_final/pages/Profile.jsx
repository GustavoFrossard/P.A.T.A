import "./Profile.css";
import React, { useState, useEffect } from "react";
import { User, PawPrint, Heart, Camera, MapPin, Mail, Phone, Search, Filter } from "lucide-react";
import { motion } from "framer-motion";
import { fadeInUp } from "../utils/motion";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api"; // ✅ usar axios configurado

const Profile = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [editing, setEditing] = useState(false);

  // filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  // dados do backend
  const [profile, setProfile] = useState(null);
  const [myPets, setMyPets] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  // carregar perfil
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await api.get("auth/user/"); // ✅ corrigido
        setProfile(res.data);
      } catch (err) {
        console.error("Erro ao carregar perfil:", err);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  // carregar pets do usuário
  useEffect(() => {
    const loadPets = async () => {
      try {
        const res = await api.get(`pets/?owner=${user?.id}`); // ✅ corrigido
        setMyPets(res.data);
      } catch (err) {
        console.error("Erro ao carregar meus pets:", err);
      }
    };
    if (user?.id) loadPets();
  }, [user]);

  // carregar favoritos
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const res = await api.get("favorites/"); // ✅ corrigido
        setFavorites(res.data);
      } catch (err) {
        console.error("Erro ao carregar favoritos:", err);
      }
    };
    loadFavorites();
  }, []);

  // toggle favorito (cria/remove no backend)
  const handleToggleFavorite = async (petId) => {
    const isFav = favorites.some((f) => f.id === petId);
    try {
      if (isFav) {
        await api.delete(`favorites/${petId}/`); // ✅ corrigido
        setFavorites((prev) => prev.filter((f) => f.id !== petId));
      } else {
        const res = await api.post("favorites/", { pet: petId }); // ✅ corrigido
        setFavorites((prev) => [...prev, res.data]);
      }
    } catch (err) {
      console.error("Erro ao atualizar favorito:", err);
    }
  };

  if (loading && !profile) return <p className="p-4">Carregando perfil...</p>;

  const tabs = [
    { id: "profile", label: "Perfil", icon: User },
    { id: "pets", label: "Meus Pets", icon: PawPrint },
    { id: "favorites", label: "Favoritos", icon: Heart },
  ];

  return (
    <div className="container mx-auto p-4">
      <motion.div {...fadeInUp} className="flex space-x-4 mb-6 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center px-4 py-2 ${
              activeTab === tab.id
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500"
            }`}
          >
            <tab.icon className="w-5 h-5 mr-2" />
            {tab.label}
          </button>
        ))}
      </motion.div>

      {activeTab === "profile" && profile && (
        <ProfileTab user={profile} editing={editing} setEditing={setEditing} />
      )}
      {activeTab === "pets" && (
        <PetsTab
          pets={myPets}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
        />
      )}
      {activeTab === "favorites" && (
        <FavoritesTab
          favorites={favorites}
          toggleFavorite={handleToggleFavorite}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
        />
      )}
    </div>
  );
};

const ProfileTab = ({ user, editing, setEditing }) => (
  <motion.div {...fadeInUp} className="bg-white p-6 rounded-lg shadow">
    <div className="flex items-center space-x-4 mb-6">
      <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
        {user.avatar ? (
          <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
        ) : (
          <Camera className="w-8 h-8 text-gray-400" />
        )}
      </div>
      <div>
        <h2 className="text-xl font-semibold">{user.name}</h2>
        <p className="text-gray-500">
          {user.city}, {user.state}
        </p>
      </div>
    </div>

    {editing ? (
      <form className="space-y-4">
        <input type="text" defaultValue={user.name} className="w-full p-2 border rounded" />
        <input type="email" defaultValue={user.email} className="w-full p-2 border rounded" />
        <input type="text" defaultValue={user.phone} className="w-full p-2 border rounded" />
        <div className="flex space-x-2">
          <input type="text" defaultValue={user.city} className="w-1/2 p-2 border rounded" />
          <input type="text" defaultValue={user.state} className="w-1/2 p-2 border rounded" />
        </div>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Salvar
        </button>
      </form>
    ) : (
      <div className="space-y-2">
        <p className="flex items-center">
          <Mail className="w-4 h-4 mr-2" /> {user.email}
        </p>
        <p className="flex items-center">
          <Phone className="w-4 h-4 mr-2" /> {user.phone}
        </p>
        <p className="flex items-center">
          <MapPin className="w-4 h-4 mr-2" /> {user.city}, {user.state}
        </p>
        <button
          onClick={() => setEditing(true)}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
        >
          Editar Perfil
        </button>
      </div>
    )}
  </motion.div>
);

// PetsTab e FavoritesTab ficam iguais ao seu código original (sem alterações)

export default Profile;
