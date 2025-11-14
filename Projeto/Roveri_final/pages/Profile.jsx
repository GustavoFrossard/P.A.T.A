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
        // fetch all pets and filter client-side by creator to avoid depending on backend filter
        const res = await api.get(`pets/`);
        const raw = res.data;
        const list = Array.isArray(raw) ? raw : raw.results || [];
        setMyPets(list.filter((p) => p.created_by === user?.id));
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
    try {
      await api.delete(`favorites/${petId}/`);
      setFavorites((prev) => prev.filter((pet) => pet.id !== petId));
    } catch (err) {
      console.error("Erro ao remover favorito:", err);
      alert("Erro ao remover favorito. Tente novamente.");
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

const ProfileTab = ({ user, editing, setEditing }) => {
  // Função para aplicar máscara de telefone brasileiro
  const applyPhoneMask = (value) => {
    if (!value) return '';
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

  const [formData, setFormData] = React.useState({
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    email: user.email || '',
    phone: applyPhoneMask(user.profile?.phone || ''),
    city: user.profile?.city || '',
    avatar: null,
  });
  const [previewAvatar, setPreviewAvatar] = React.useState(user.profile?.avatar_url || '');

  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      const file = files[0];
      setFormData(prev => ({ ...prev, avatar: file }));
      if (file) {
        setPreviewAvatar(URL.createObjectURL(file));
      }
    } else if (name === 'phone') {
      // Aplica máscara de telefone
      const maskedValue = applyPhoneMask(value);
      setFormData(prev => ({ ...prev, [name]: maskedValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    try {
      const data = new FormData();
      data.append('first_name', formData.first_name);
      data.append('last_name', formData.last_name);
      data.append('email', formData.email);
      data.append('phone', formData.phone);
      data.append('city', formData.city);
      
      if (formData.avatar) {
        data.append('avatar', formData.avatar);
      }

      const res = await api.patch('auth/profile/update/', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      alert('Perfil atualizado com sucesso!');
      setEditing(false);
      // Refresh page to show updated data
      window.location.reload();
    } catch (err) {
      console.error('Erro ao atualizar perfil:', err);
      
      // Tratar erro de email duplicado
      if (err.response?.data?.email) {
        alert(err.response.data.email[0] || err.response.data.email);
      } else {
        alert('Erro ao atualizar perfil. Tente novamente.');
      }
    }
  };

  return (
    <motion.div {...fadeInUp} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      <div className="flex items-center space-x-4 mb-6">
        <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
          {(editing ? previewAvatar : user.profile?.avatar_url) ? (
            <img 
              src={editing ? previewAvatar : user.profile.avatar_url} 
              alt={user.name} 
              className="w-full h-full object-cover" 
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = '<div class="w-8 h-8 text-gray-400"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg></div>';
              }}
            />
          ) : (
            <Camera className="w-8 h-8 text-gray-400" />
          )}
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{user.name}</h2>
          <p className="text-gray-500 dark:text-gray-400">
            {user.profile?.city || "Localização não informada"}
          </p>
        </div>
      </div>

      {editing ? (
        <form className="space-y-4">
          {/* Upload de Avatar */}
          <div className="text-center mb-4">
            <div className="w-32 h-32 mx-auto bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4 overflow-hidden">
              {previewAvatar ? (
                <img
                  src={previewAvatar}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Camera className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              id="avatar-upload"
              name="avatar"
              onChange={handleInputChange}
              className="hidden"
            />
            <label
              htmlFor="avatar-upload"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-blue-700 transition-colors inline-block"
            >
              Alterar Foto
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Primeiro Nome
            </label>
            <input 
              type="text" 
              name="first_name"
              value={formData.first_name}
              onChange={handleInputChange}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Sobrenome
            </label>
            <input 
              type="text" 
              name="last_name"
              value={formData.last_name}
              onChange={handleInputChange}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input 
              type="email" 
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Telefone
            </label>
            <input 
              type="tel" 
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="(00) 00000-0000"
              maxLength={15}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Cidade
            </label>
            <input 
              type="text" 
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              placeholder="Ex: São Paulo"
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
            />
          </div>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={handleSave}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Salvar
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-2">
          <p className="flex items-center text-gray-700 dark:text-gray-300">
            <Mail className="w-4 h-4 mr-2" /> {user.email}
          </p>
          {user.profile?.phone && (
            <p className="flex items-center text-gray-700 dark:text-gray-300">
              <Phone className="w-4 h-4 mr-2" /> {user.profile.phone}
            </p>
          )}
          {user.profile?.city && (
            <p className="flex items-center text-gray-700 dark:text-gray-300">
              <MapPin className="w-4 h-4 mr-2" /> {user.profile.city}
            </p>
          )}
          <button
            onClick={() => setEditing(true)}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Editar Perfil
          </button>
        </div>
      )}
    </motion.div>
  );
};

const PetsTab = ({ pets, searchTerm, setSearchTerm, selectedType, setSelectedType, showFilters, setShowFilters }) => {
  const { user } = useAuth();
  const [localPets, setLocalPets] = useState(pets || []);

  useEffect(() => setLocalPets(pets || []), [pets]);

  const handleMarkRegistered = async (petId) => {
    try {
      const res = await api.post(`pets/${petId}/mark_registered/`);
      // Update local state to mark as adopted (is_published=false)
      setLocalPets((prev) => prev.map((p) => (p.id === petId ? { ...p, is_published: res?.data?.is_published === undefined ? false : res.data.is_published } : p)));
    } catch (err) {
      console.error("Erro ao marcar pet como adotado:", err);
    }
  };

  const handleRevertAdoption = async (petId) => {
    try {
      const res = await api.patch(`pets/${petId}/`, { is_published: true });
      setLocalPets((prev) => prev.map((p) => (p.id === petId ? { ...p, is_published: res?.data?.is_published === undefined ? true : res.data.is_published } : p)));
    } catch (err) {
      console.error("Erro ao reverter adoção:", err);
      alert('Não foi possível reverter a adoção. Tente novamente.');
    }
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {localPets.map((pet) => (
          <div key={pet.id} className="bg-white p-4 rounded shadow">
            <img src={pet.image || "https://placekitten.com/400/300"} alt={pet.name} className="w-full h-40 object-cover rounded mb-2" />
            <h3 className="font-semibold">{pet.name}</h3>
            <p className="text-sm text-gray-500">{pet.species} • {pet.age_text}</p>
            <div className="mt-2 flex items-center space-x-2">
              <Link to={`/pet/${pet.id}`} className={`text-blue-600 ${pet.is_published === false ? 'opacity-60' : ''}`}>Ver</Link>
              {/* Adotado indicator/button */}
              <button
                onClick={() => handleMarkRegistered(pet.id)}
                className={`${pet.is_published === false ? 'text-gray-500 cursor-default' : 'text-green-600 hover:text-green-700'}`}
                disabled={pet.is_published === false}
                title={pet.is_published === false ? 'Pet já adotado' : 'Marcar como adotado'}
              >
                Adotado
              </button>

              {/* Se já adotado, mostrar opção de reverter apenas para o dono (estamos na aba Meus Pets) */}
              {pet.is_published === false && (
                <button
                  onClick={() => {
                    if (!confirm('Reverter adoção e tornar o pet disponível novamente?')) return;
                    handleRevertAdoption(pet.id);
                  }}
                  className="text-blue-600 hover:underline"
                >
                  Reverter adoção
                </button>
              )}
            </div>
          </div>
        ))}
        {localPets.length === 0 && <p>Nenhum pet cadastrado.</p>}
      </div>
    </div>
  );
};

const FavoritesTab = ({ favorites, toggleFavorite, searchTerm, setSearchTerm, selectedType, setSelectedType, showFilters, setShowFilters }) => {
  const [selectedCity, setSelectedCity] = React.useState("all");

  // Filtros
  const filteredFavorites = favorites.filter((pet) => {
    const q = (searchTerm || "").trim().toLowerCase();
    const matchesSearch =
      !q ||
      (pet.name && pet.name.toString().toLowerCase().includes(q)) ||
      (pet.breed && pet.breed.toString().toLowerCase().includes(q));

    const speciesNorm = (pet.species || "").toString().toLowerCase();
    const isDog = ["dog", "cachorro", "cão", "cao", "canino", "canine"].some(
      (k) => speciesNorm.includes(k)
    );
    const isCat = ["cat", "gato", "felino", "feline"].some((k) =>
      speciesNorm.includes(k)
    );
    const petType = isDog ? "dog" : isCat ? "cat" : speciesNorm;
    const matchesType = selectedType === "all" ? true : petType === selectedType;

    const matchesCity =
      selectedCity === "all"
        ? true
        : pet.city &&
          pet.city.toString().toLowerCase() ===
            selectedCity.toString().toLowerCase();

    return matchesSearch && matchesType && matchesCity;
  });

  return (
    <div>
      {/* Barra de busca e filtros */}
      <div className="flex items-center mb-4 space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar favoritos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center px-3 py-2 border rounded-lg hover:bg-gray-100 transition"
        >
          <Filter className="w-5 h-5 mr-1" />
          Filtros
        </button>
      </div>

      {showFilters && (
        <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-2">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="border p-2 rounded-lg"
          >
            <option value="all">Todos os tipos</option>
            <option value="dog">Cachorros</option>
            <option value="cat">Gatos</option>
          </select>

          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="border p-2 rounded-lg"
          >
            <option value="all">Todas as cidades</option>
            {Array.from(new Set(favorites.map((p) => p.city).filter(Boolean))).map(
              (city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              )
            )}
          </select>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFavorites.map((pet) => (
          <motion.div
            key={pet.id}
            {...fadeInUp}
            className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow hover:shadow-md transition"
          >
            {pet.image_url && (
              <img
                src={pet.image_url}
                alt={pet.name}
                className="w-full h-48 object-cover rounded-md mb-3"
              />
            )}
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{pet.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
              <MapPin className="w-4 h-4" /> {pet.city}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Raça:</strong> {pet.breed || "Desconhecida"}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Idade:</strong> {pet.age_text}
            </p>
            <div className="flex justify-between items-center mt-3">
              <Link
                to={`/pet/${pet.id}`}
                className="text-blue-600 hover:underline"
              >
                Ver detalhes
              </Link>
              <button
                onClick={() => toggleFavorite(pet.id)}
                className="text-red-500 hover:text-red-600"
              >
                <Heart className="w-5 h-5 fill-current" />
              </button>
            </div>
          </motion.div>
        ))}
        {filteredFavorites.length === 0 && (
          <p className="col-span-full text-center text-gray-500">
            {favorites.length === 0 
              ? "Você não tem favoritos." 
              : "Nenhum favorito encontrado com esses filtros."}
          </p>
        )}
      </div>
    </div>
  );
};


export default Profile;
