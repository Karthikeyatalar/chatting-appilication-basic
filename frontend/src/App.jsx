import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Chat from './components/Chat';
import Admin from './components/Admin';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('chat-user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('chat-user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('chat-user');
    localStorage.removeItem('chat-token');
  };

  return (
    <Router>
      <div className="min-h-screen bg-[#0f172a] text-white">
        <Routes>
          <Route 
            path="/login" 
            element={user ? <Navigate to="/chat" /> : <Login onLogin={handleLogin} />} 
          />
          <Route 
            path="/register" 
            element={user ? <Navigate to="/chat" /> : <Register />} 
          />
          <Route 
            path="/chat" 
            element={user ? <Chat user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/admin" 
            element={user ? <Admin user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} 
          />
          <Route path="/" element={<Navigate to={user ? "/chat" : "/login"} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
