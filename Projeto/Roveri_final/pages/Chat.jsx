import "./Chat.css";
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Send, ArrowLeft, Phone, Video, MoreVertical } from "lucide-react";
import api from "../services/api";

const getToken = () => {
  try {
    // Look for the token names the app stores: accessToken (AuthContext), refreshToken, or legacy names
    const t = localStorage.getItem("accessToken") || localStorage.getItem("access_token") || localStorage.getItem("token");
    if (t) return t;
  } catch (e) {
    /* ignore */
  }
  const m = document.cookie.match(/(?:^|; )token=([^;]+)/);
  return m ? m[1] : null;
};

const Chat = () => {
  const { user } = useAuth();
  const location = useLocation();
  const messagesEndRef = useRef(null);
  const wsRef = useRef(null);

  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState(""); const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    const loadRooms = async () => {
      try { const res = await api.get("chat/rooms/"); setRooms(res.data.results || res.data); } catch (err) { console.error(err); }
    }; loadRooms();
  }, []);

  useEffect(() => {
    if (wsRef.current) { try { wsRef.current.close(); } catch {} wsRef.current = null; }
    if (!activeRoom) { setMessages([]); return; }
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";

    // Prefer an explicit API URL from Vite env (VITE_API_URL). If not provided,
    // fall back to localhost:8000 for backend during development.
    let backendHost = window.location.hostname;
    let backendPort = "";
    try {
      const apiUrl = (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_URL) || null;
      if (apiUrl) {
        const parsed = new URL(apiUrl);
        backendHost = parsed.hostname || backendHost;
        backendPort = parsed.port || (parsed.protocol === "https:" ? "443" : parsed.protocol === "http:" ? "80" : "");
      } else {
        // default dev backend port
        backendPort = backendHost === "localhost" ? "8000" : (window.location.port || "");
      }
    } catch (e) {
      backendPort = backendHost === "localhost" ? "8000" : (window.location.port || "");
    }

    const token = getToken();
    const tokenQuery = token ? `?token=${encodeURIComponent(token)}` : "";
    const wsUrl = backendPort
      ? `${protocol}://${backendHost}:${backendPort}/ws/chat/${activeRoom.id}/${tokenQuery}`
      : `${protocol}://${backendHost}/ws/chat/${activeRoom.id}/${tokenQuery}`;
    const ws = new WebSocket(wsUrl); wsRef.current = ws;
    ws.onopen = () => { (async () => { try { const res = await api.get(`chat/rooms/${activeRoom.id}/messages/`); setMessages(res.data.results || res.data); } catch (err) { console.error(err); } })(); };
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // ignore ack messages (sent back to sender) or errors
        if (data && (data.saved || data.error)) return;

        setMessages((prev) => {
          // avoid duplicating messages that may already be present (same id)
          try {
            if (data.id && prev.some((m) => m.id === data.id)) return prev;
          } catch (e) {
            // ignore and append
          }
          return [...prev, data];
        });
      } catch (err) {
        console.error(err, event.data);
      }
    };
    ws.onerror = (err) => { console.error("WS erro", err); };
    ws.onclose = (e) => { console.log("WS fechado", e.code, e.reason); };
    return () => { try { ws.close(); } catch {} wsRef.current = null; };
  }, [activeRoom]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activeRoom) return;
    const payload = { type: "message", content: text };
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try { wsRef.current.send(JSON.stringify(payload)); setText(""); } catch (err) { try { const res = await api.post(`chat/rooms/${activeRoom.id}/messages/`, { content: text }); setMessages((prev) => [...prev, res.data]); setText(""); } catch (e) { console.error(e); } }
    } else {
      try {
        const res = await api.post(`chat/rooms/${activeRoom.id}/messages/`, { content: text });
        console.log('POST message response', res.status, res.data);
        setMessages((prev) => [...prev, res.data]);
        setText("");
      } catch (err) {
        console.error('Failed to POST message', err?.response || err.message || err);
        // show a quick alert to help debugging
        alert('Erro ao enviar mensagem: ' + (err?.response?.statusText || JSON.stringify(err?.response?.data) || err.message));
      }
    }
  };

  useEffect(() => { const checkMobile = () => setIsMobileView(window.innerWidth < 768); checkMobile(); window.addEventListener("resize", checkMobile); return () => window.removeEventListener("resize", checkMobile); }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  // only restore active room from navigation state (when navigating into chat)
  // do NOT auto-open a room on page reload — users should see the rooms list first
  useEffect(() => {
    if (location.state?.roomId && rooms.length > 0) {
      const r = rooms.find((room) => room.id === location.state.roomId);
      if (r) setActiveRoom(r);
    }
  }, [location.state, rooms]);

  return (
    // make the page a column that occupies the area below the site header and stays static
    // we assume a 64px site header height; the chat area will be `calc(100vh - 64px)`
    <div className="container mx-auto p-4 flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      <h1 className="text-2xl font-bold mb-0 h-16 flex items-center">Chat</h1>
      <div className="chat-root flex-1 min-h-0 bg-gray-50 dark:bg-gray-900 flex rounded-md overflow-hidden">
      {/* Rooms list */}
  <aside className="chat-rooms w-1/3 border-r p-4 overflow-auto">
        <h3 className="text-lg font-semibold mb-2">Salas</h3>
        <ul>
          {rooms.length === 0 && <li className="text-gray-500">Nenhuma sala encontrada.</li>}
          {rooms.map((room) => (
            <li
              key={room.id}
              onClick={() => setActiveRoom(room)}
              className={`room-item mb-1 ${activeRoom?.id === room.id ? 'active' : ''}`}
            >
              {(() => {
                // prefer pet name + pet owner username, fall back to participants or room.name
                if (room.pet_name) {
                  const owner = room.pet_owner_username || room.user1_username || room.user2_username || 'Desconhecido';
                  return `${room.pet_name} — ${owner}`;
                }
                return room.name || `Sala ${room.id}`;
              })()}
            </li>
          ))}
        </ul>
      </aside>

      {/* Chat panel */}
      <main className="chat-panel flex-1 p-4 flex flex-col">
        <div className="chat-header mb-4">
          <button onClick={() => setActiveRoom(null)} className="mr-3">←</button>
          <h2 className="text-xl font-bold">{activeRoom ? (
            (() => {
              if (activeRoom.pet_name) {
                const owner = activeRoom.pet_owner_username || activeRoom.user1_username || activeRoom.user2_username || 'Desconhecido';
                return `${activeRoom.pet_name} — ${owner}`;
              }
              return activeRoom.name || `Sala ${activeRoom.id}`;
            })()
          ) : 'Selecione uma sala'}</h2>
        </div>

  <div className="chat-messages mb-4 overflow-auto flex-1">
          {activeRoom ? (
            messages.length === 0 ? (
              <div className="text-gray-500">Sem mensagens ainda. Envie a primeira mensagem abaixo.</div>
            ) : (
              messages.map((m, i) => (
                <div key={m.id || i} className="message">
                  <div className="meta">{m.sender_username || (m.sender && m.sender.username) || 'Anônimo'}</div>
                  <div className="bubble">{m.content || JSON.stringify(m)}</div>
                </div>
              ))
            )
          ) : (
            <div className="text-gray-500">Nenhuma sala ativa. Clique em uma sala à esquerda para começar a conversar.</div>
          )}
          <div ref={messagesEndRef} />
        </div>

  <form onSubmit={sendMessage} className="chat-input mt-2">
          <input
            type="text"
            className="flex-1 border p-2 mr-2 rounded"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={activeRoom ? 'Escreva uma mensagem...' : 'Selecione uma sala primeiro'}
            disabled={!activeRoom}
          />
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded" disabled={!activeRoom || !text.trim()}>
            Enviar
          </button>
        </form>
      </main>
      </div>
    </div>
  );
};

export default Chat;
