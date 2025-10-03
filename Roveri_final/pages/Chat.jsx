import "./Chat.css";
// src/pages/Chat.jsx
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Send, ArrowLeft, Phone, Video, MoreVertical } from "lucide-react";
import api from "../services/api"; // ✅ axios centralizado

const Chat = () => {
  const { user } = useAuth();
  const location = useLocation();
  const messagesEndRef = useRef(null);

  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [isMobileView, setIsMobileView] = useState(false);

  // Carregar salas
  useEffect(() => {
    const loadRooms = async () => {
      try {
        const res = await api.get("chat/rooms/");
        setRooms(res.data.results || res.data);
      } catch (err) {
        console.error("Erro ao carregar salas:", err.response?.data || err);
      }
    };
    loadRooms();
  }, []);

  // Carregar mensagens da sala ativa (com polling)
  useEffect(() => {
    if (!activeRoom) return;

    const loadMsgs = async () => {
      try {
        const res = await api.get(`chat/rooms/${activeRoom.id}/messages/`);
        setMessages(res.data.results || res.data);
      } catch (err) {
        console.error("Erro ao carregar mensagens:", err.response?.data || err);
      }
    };

    loadMsgs(); // primeira carga
    const timer = setInterval(loadMsgs, 3000);

    return () => clearInterval(timer);
  }, [activeRoom]);

  // Enviar mensagem
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activeRoom) return;

    try {
      const res = await api.post(`chat/rooms/${activeRoom.id}/messages/`, {
        content: text,
      });
      setMessages((prev) => [...prev, res.data]);
      setText("");
    } catch (err) {
      console.error("Erro ao enviar mensagem:", err.response?.data || err);
    }
  };

  // Ajustar mobile/desktop
  useEffect(() => {
    const checkMobile = () => setIsMobileView(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Scroll automático
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Se veio de um pet (PetDetail -> navigate("/chat", { state: { roomId } }))
  useEffect(() => {
    if (location.state?.roomId && rooms.length > 0) {
      const r = rooms.find((room) => room.id === location.state.roomId);
      if (r) setActiveRoom(r);
    }
  }, [location.state, rooms]);

  // Lista de salas
  const ConversationList = () => (
    <div className="w-full md:w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Conversas
        </h2>
      </div>
      <div className="overflow-y-auto h-full">
        {rooms.map((room) => (
          <motion.div
            key={room.id}
            whileHover={{ backgroundColor: "rgba(59, 130, 246, 0.05)" }}
            onClick={() => setActiveRoom(room)}
            className={`p-4 cursor-pointer border-b border-gray-100 dark:border-gray-700 ${
              activeRoom?.id === room.id ? "bg-blue-50 dark:bg-blue-900/20" : ""
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 font-bold">
                {room.pet_name?.charAt(0).toUpperCase() || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {room.pet_name || `Sala ${room.id}`}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {room.user1_username} & {room.user2_username}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  // Área de mensagens
  const ChatArea = () => (
    <div className="flex-1 flex flex-col">
      {/* Cabeçalho */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {isMobileView && (
              <button
                onClick={() => setActiveRoom(null)}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center font-bold text-gray-700">
              {activeRoom?.pet_name?.charAt(0).toUpperCase() || "?"}
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                {activeRoom?.pet_name}
              </h3>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <Phone className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <Video className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${
              msg.sender === user.id || msg.sender_username === user.username
                ? "justify-end"
                : "justify-start"
            }`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                msg.sender === user.id || msg.sender_username === user.username
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              }`}
            >
              <p className="text-sm">{msg.content}</p>
              <p
                className={`text-xs mt-1 ${
                  msg.sender === user.id || msg.sender_username === user.username
                    ? "text-blue-100"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {new Date(msg.timestamp).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </motion.div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
        <form onSubmit={sendMessage} className="flex space-x-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex">
      {(!isMobileView || !activeRoom) && <ConversationList />}
      {(!isMobileView || activeRoom) && activeRoom && <ChatArea />}
    </div>
  );
};

export default Chat;
