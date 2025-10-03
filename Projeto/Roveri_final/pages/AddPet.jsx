import "./AddPet.css";
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Camera, MapPin, Info } from 'lucide-react';
import api from '../services/api';

const AddPet = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    species: 'dog',
    breed: '',
    age_text: '',
    city: '',
    description: '',
    image: null,
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        if (formData[key] !== null) {
          data.append(key, formData[key]);
        }
      });

      // 🔹 Usando o axios configurado (api)
      const res = await api.post('/pets/', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      navigate(`/pet/${res.data.id}`);
    } catch (err) {
      if (err.response?.data) {
        setError(JSON.stringify(err.response.data));
      } else {
        setError('Erro ao criar pet');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
        >
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Adicionar Pet para Adoção
          </h1>

          {error && (
            <div className="mb-4 p-3 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Upload da Foto */}
            <div className="text-center">
              <div className="w-32 h-32 mx-auto bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4 overflow-hidden">
                {formData.image ? (
                  <img
                    src={URL.createObjectURL(formData.image)}
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
                id="photo-upload"
                name="image"
                onChange={handleInputChange}
                className="hidden"
              />
              <label
                htmlFor="photo-upload"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-blue-700 transition-colors"
              >
                Adicionar Foto
              </label>
            </div>

            {/* Informações Básicas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nome
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Espécie
                </label>
                <select
                  name="species"
                  value={formData.species}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="dog">Cachorro</option>
                  <option value="cat">Gato</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Raça
                </label>
                <input
                  type="text"
                  name="breed"
                  value={formData.breed}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Idade
                </label>
                <input
                  type="text"
                  name="age_text"
                  value={formData.age_text}
                  onChange={handleInputChange}
                  placeholder="Ex: 2 anos"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Localização */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <MapPin className="inline w-4 h-4 mr-1" />
                Cidade
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Info className="inline w-4 h-4 mr-1" />
                Descrição
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                placeholder="Conte mais sobre o pet: personalidade, cuidados especiais, etc."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Botões */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/pets')}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 
                text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Adicionando...' : 'Adicionar Pet'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default AddPet;
