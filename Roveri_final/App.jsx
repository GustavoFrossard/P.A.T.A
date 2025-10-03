// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import PetList from "./pages/PetList";
import AddPet from "./pages/AddPet";
import PetDetail from "./pages/PetDetail";
import Chat from "./pages/Chat";
import AdminPanel from "./pages/AdminPanel";
import Profile from "./pages/Profile";
import PrivateRoute from "./components/PrivateRoute";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
            <Navbar />
            <main className="pt-16">
              <Routes>
                {/* ✅ Rota pública */}
                <Route path="/" element={<Home />} />
                <Route path="/pets" element={<PetList />} />
                <Route path="/pet/:id" element={<PetDetail />} />

                {/* ✅ Rota pública */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* 🔒 Rotas privadas */}
                <Route
                  path="/add-pet"
                  element={
                    <PrivateRoute>
                      <AddPet />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/chat"
                  element={
                    <PrivateRoute>
                      <Chat />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <PrivateRoute>
                      <AdminPanel />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <PrivateRoute>
                      <Profile />
                    </PrivateRoute>
                  }
                />
              </Routes>
            </main>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
