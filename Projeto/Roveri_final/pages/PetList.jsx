// src/pages/PetList.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Filter, MapPin, Calendar, Heart } from "lucide-react";
import { fadeInUp } from "../utils/motion";
import { pets as mockPets } from "../utils/mockData";
import api from "../services/api"; // ✅ usa o axios configurado
import { useAuth } from "../contexts/AuthContext";

const PetList = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedCity, setSelectedCity] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [pets, setPets] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPets = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log("🔎 Buscando pets em:", "pets/");
        const res = await api.get("/pets/"); // ✅ corrigido
        console.log("✅ Raw API response:", res.data);

        // Trata tanto lista simples quanto resposta paginada do DRF
        const data = res.data;
        const items = Array.isArray(data)
          ? data
          : data && data.results
          ? data.results
          : [];

        console.log("ℹ️ items with is_published:", items.map(i => ({ id: i?.id, is_published: i?.is_published })))

        const adapted = items
          // só mostra publicados (trata `undefined` como publicado para compatibilidade)
          .filter((item) => item && (item.is_published === undefined || item.is_published))
          .map((item) => ({
            id: item.id,
            name: item.name,
            species: item.species,
            breed: item.breed,
            city: item.city || item.location || "Desconhecida",
            image: item.image_url || item.image || null,
            age: item.age_text,
            description: item.description,
            createdBy: item.created_by_username || "Desconhecido",
          }));

        console.log("🎯 Pets adaptados:", adapted);
        setPets(adapted);
      } catch (err) {
        console.error("❌ Erro ao buscar pets:", err);
        setError(err.message);
        setPets(mockPets); // fallback (mockPets pode estar vazio)
      } finally {
        setLoading(false);
      }
    };

    fetchPets();
  }, []);

  // Carregar favoritos do usuário
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user) return;
      try {
        const res = await api.get("favorites/");
        setFavorites(res.data.map(pet => pet.id));
      } catch (err) {
        console.error("Erro ao carregar favoritos:", err);
      }
    };
    fetchFavorites();
  }, [user]);

  // Toggle favorito
  const handleToggleFavorite = async (petId) => {
    if (!user) {
      alert("Você precisa estar logado para favoritar pets");
      return;
    }

    const isFavorite = favorites.includes(petId);
    try {
      if (isFavorite) {
        await api.delete(`favorites/${petId}/`);
        setFavorites(prev => prev.filter(id => id !== petId));
      } else {
        await api.post("favorites/", { pet: petId });
        setFavorites(prev => [...prev, petId]);
      }
    } catch (err) {
      console.error("Erro ao atualizar favorito:", err);
      alert("Erro ao atualizar favorito. Tente novamente.");
    }
  };

  const filteredPets = pets.filter((pet) => {
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

    const matchesType =
      selectedType === "all" ? true : petType === selectedType;

    const matchesCity =
      selectedCity === "all"
        ? true
        : pet.city &&
          pet.city.toString().toLowerCase() ===
            selectedCity.toString().toLowerCase();

    return matchesSearch && matchesType && matchesCity;
  });

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Pets Disponíveis</h1>

      {/* Barra de busca e botão de filtros */}
      <div className="flex items-center mb-4 space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou raça..."
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

      {/* Filtros extras */}
      {showFilters && (
        <motion.div
          {...fadeInUp}
          className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-2"
        >
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
            {Array.from(new Set(pets.map((p) => p.city).filter(Boolean))).map(
              (city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              )
            )}
          </select>
        </motion.div>
      )}

      {loading && <p>Carregando pets...</p>}
      {error && <p className="text-red-500">Erro: {error}</p>}

      {/* Grid de pets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filteredPets.length === 0 && !loading && (
          <p className="text-center col-span-full text-gray-500">
            Nenhum pet disponível
          </p>
        )}

        {filteredPets.map((pet) => (
          <motion.div
            key={pet.id}
            {...fadeInUp}
            className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow hover:shadow-md transition"
          >
            {pet.image && (
              <img
                src={pet.image}
                alt={pet.name}
                className="w-full h-48 object-cover rounded-md mb-3"
              />
            )}
            <h3 className="text-lg font-semibold">{pet.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
              <MapPin className="w-4 h-4" /> {pet.city}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
              <strong>Raça:</strong> {pet.breed || "Desconhecida"}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
              <Calendar className="w-4 h-4" /> {pet.age}
            </p>
            <p className="text-xs text-gray-500 mb-2">
              Publicado por {pet.createdBy}
            </p>
            <div className="flex justify-between items-center mt-2">
              <Link
                to={`/pet/${pet.id}`}
                className="text-blue-600 hover:underline"
              >
                Ver detalhes
              </Link>
              <button 
                onClick={() => handleToggleFavorite(pet.id)}
                className={`transition-colors ${
                  favorites.includes(pet.id) 
                    ? "text-red-500" 
                    : "text-gray-400 hover:text-red-500"
                }`}
                disabled={!user}
              >
                <Heart 
                  className={`w-5 h-5 ${
                    favorites.includes(pet.id) ? "fill-current" : ""
                  }`} 
                />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default PetList;
