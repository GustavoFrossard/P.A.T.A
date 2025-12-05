import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  MapPin,
  Heart,
  MessageCircle,
} from "lucide-react";
import api from "../services/api";

const PetDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pet, setPet] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const { user } = useAuth();

  // Carregar detalhes do pet
  useEffect(() => {
    const fetchPet = async () => {
      try {
        // ✅ Corrigido: usa rota relativa ao baseURL do api.js
        const res = await api.get(`pets/${id}/`);
        setPet(res.data);
      } catch (err) {
        console.error("Erro ao carregar pet:", err);
      }
    };
    fetchPet();
  }, [id]);

  // Verificar se o pet está nos favoritos
  useEffect(() => {
    const checkFavorite = async () => {
      if (!user) return;
      try {
        const res = await api.get("favorites/");
        const isFav = res.data.some(favPet => favPet.id === parseInt(id));
        setIsFavorite(isFav);
      } catch (err) {
        console.error("Erro ao verificar favorito:", err);
      }
    };
    checkFavorite();
  }, [id, user]);

  // Criar ou recuperar sala de chat
  const handleContact = async () => {
    try {
      // ✅ Corrigido: rota relativa, consistente com backend
      const res = await api.post("chat/rooms/", {
        pet_id: pet.id,
        receiver_id: pet.created_by, // precisa existir no backend
      });

      if (res.status === 200 || res.status === 201) {
        const room = res.data;
        navigate("/chat", { state: { roomId: room.id } });
      }
    } catch (err) {
      console.error("Erro ao criar sala de chat:", err);
    }
  };

  const toggleFavorite = async () => {
    if (!user) {
      alert("Você precisa estar logado para favoritar pets");
      return;
    }

    try {
      if (isFavorite) {
        await api.delete(`favorites/${id}/`);
        setIsFavorite(false);
      } else {
        await api.post("favorites/", { pet: parseInt(id) });
        setIsFavorite(true);
      }
    } catch (err) {
      console.error("Erro ao atualizar favorito:", err);
      alert("Erro ao atualizar favorito. Tente novamente.");
    }
  };

  if (!pet) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Botão Voltar */}
        <button
          onClick={() => navigate("/pets")}
          className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Voltar para lista
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Imagem do Pet */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative"
          >
            <img
              src={pet.image_url}
              alt={pet.name}
              className="w-full h-96 object-cover rounded-lg shadow-lg"
            />
            <button
              onClick={toggleFavorite}
              className={`absolute top-4 right-4 p-2 rounded-full ${
                isFavorite ? "bg-red-500 text-white" : "bg-white text-gray-600"
              } shadow-lg hover:scale-110 transition-all`}
            >
              <Heart
                className={`w-6 h-6 ${isFavorite ? "fill-current" : ""}`}
              />
            </button>
          </motion.div>

          {/* Informações do Pet */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {pet.name}
              </h1>
              <div className="flex items-center text-gray-600 dark:text-gray-400 mb-4">
                <MapPin className="w-4 h-4 mr-1" />
                <span>{pet.city || pet.location || "Local não informado"}</span>
              </div>
            </div>

            {/* Cards básicos */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Espécie
                </h3>
                <p className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                  {pet.species}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Raça
                </h3>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {pet.breed}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Idade
                </h3>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {pet.age_text || "Não informado"}
                </p>
              </div>
            </div>

            {/* Status de saúde removed per design — not shown on pet detail */}

            {/* Botão de contato */}
            <div className="space-y-2">
              <button
                onClick={handleContact}
                disabled={pet.is_published === false}
                className={`w-full py-3 px-6 rounded-lg flex items-center justify-center space-x-2 transition-colors ${pet.is_published === false ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
              >
                <MessageCircle className="w-5 h-5" />
                <span>Entrar em Contato</span>
              </button>

              {/* Botão 'Adotado' apenas para o proprietário do anúncio */}
              {(user && user.id === pet.created_by) && (
                <button
                  onClick={async () => {
                    try {
                      const res = await api.post(`pets/${pet.id}/mark_registered/`);
                      // update local pet state with returned data (backend returns the pet)
                      if (res && res.data) {
                        setPet(res.data);
                      } else {
                        setPet((p) => ({ ...p, is_published: false }));
                      }
                    } catch (err) {
                      console.error("Erro ao marcar pet como adotado:", err);
                    }
                  }}
                  disabled={pet.is_published === false}
                  className={`w-full py-3 px-6 rounded-lg flex items-center justify-center space-x-2 transition-colors ${pet.is_published === false ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}
                >
                  <span>{pet.is_published === false ? 'Adotado' : 'Adotado'}</span>
                </button>
              )}
            </div>
          </motion.div>
        </div>

        {/* Descrição */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Sobre {pet.name}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            {pet.description}
          </p>
        </motion.div>

        {/* Dono / Responsável */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Informações do Responsável
          </h2>
          <div className="space-y-2">
            <p className="text-gray-600 dark:text-gray-300">
              <span className="font-medium">Publicado por:</span>{" "}
              {pet.created_by_username}
            </p>
            <p className="text-gray-600 dark:text-gray-300">
              <span className="font-medium">Anúncio publicado em:</span>{" "}
              {new Date(pet.created_at).toLocaleDateString("pt-BR")}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PetDetail;
