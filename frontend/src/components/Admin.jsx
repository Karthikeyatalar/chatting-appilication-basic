import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, MessageSquare, Trash2, Shield, BarChart3, Clock, Download } from 'lucide-react';
import { motion } from 'framer-motion';

const Admin = ({ user, onLogout }) => {
  const [stats, setStats] = useState({ userCount: 0, messageCount: 0 });
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem('chat-token');
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const [statsRes, usersRes, messagesRes] = await Promise.all([
        axios.get('http://localhost:5000/api/admin/stats', { headers }),
        axios.get('http://localhost:5000/api/admin/users', { headers }),
        axios.get('http://localhost:5000/api/admin/messages', { headers })
      ]);

      setStats(statsRes.data);
      setUsers(usersRes.data);
      setMessages(messagesRes.data);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    const token = localStorage.getItem('chat-token');
    try {
      await axios.delete(`http://localhost:5000/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(users.filter(u => u.id !== userId));
    } catch (err) {
      alert('Error deleting user');
    }
  };

  const deleteMessage = async (msgId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    const token = localStorage.getItem('chat-token');
    try {
      await axios.delete(`http://localhost:5000/api/admin/messages/${msgId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(messages.filter(m => m.id !== msgId));
    } catch (err) {
      alert('Error deleting message');
    }
  };

  if (user?.username !== 'charan') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Shield className="w-20 h-20 text-red-500 mb-4" />
        <h1 className="text-3xl font-bold text-white mb-2">Access Denied</h1>
        <p className="text-slate-400 mb-6">You do not have administrative privileges to view this page.</p>
        <button 
          onClick={() => window.location.href = '/chat'}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Return to Chat
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0f172a]">
      {/* Sidebar */}
      <div className="w-64 bg-[#1e293b] border-r border-slate-800 p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-10">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">Admin Panel</h2>
        </div>

        <nav className="space-y-2 flex-1">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <BarChart3 size={20} />
            <span>Dashboard</span>
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'users' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Users size={20} />
            <span>Users</span>
          </button>
          <button 
            onClick={() => setActiveTab('messages')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'messages' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <MessageSquare size={20} />
            <span>Messages</span>
          </button>
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold">
              {user.fullName[0]}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-white truncate">{user.fullName}</p>
              <p className="text-xs text-slate-500 truncate">Administrator</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full py-2 bg-slate-800 hover:bg-red-600/20 hover:text-red-500 text-slate-300 rounded-lg transition-all text-sm font-medium"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold text-white capitalize">{activeTab}</h1>
            <p className="text-slate-400">Manage your application data and users.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={async () => {
                const token = localStorage.getItem('chat-token');
                try {
                  const res = await axios.get('http://localhost:5000/api/admin/export-messages', {
                    headers: { Authorization: `Bearer ${token}` }
                  });
                  const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `encrypted_messages_${new Date().toISOString()}.json`;
                  a.click();
                } catch (err) {
                  alert('Error exporting messages');
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              <Download size={18} />
              <span>Export Encrypted</span>
            </button>
            <button 
              onClick={fetchData}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
              title="Refresh Data"
            >
              <Clock size={20} />
            </button>
          </div>
        </header>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'dashboard' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#1e293b] p-8 rounded-3xl border border-slate-800 flex items-center gap-6">
                  <div className="p-4 bg-blue-500/10 rounded-2xl text-blue-500">
                    <Users size={40} />
                  </div>
                  <div>
                    <p className="text-slate-400 font-medium">Total Users</p>
                    <h3 className="text-4xl font-bold text-white">{stats.userCount}</h3>
                  </div>
                </div>
                <div className="bg-[#1e293b] p-8 rounded-3xl border border-slate-800 flex items-center gap-6">
                  <div className="p-4 bg-indigo-500/10 rounded-2xl text-indigo-500">
                    <MessageSquare size={40} />
                  </div>
                  <div>
                    <p className="text-slate-400 font-medium">Total Messages</p>
                    <h3 className="text-4xl font-bold text-white">{stats.messageCount}</h3>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="bg-[#1e293b] rounded-3xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-800/50 text-slate-400 text-sm uppercase tracking-wider">
                      <th className="px-6 py-4 font-semibold">User</th>
                      <th className="px-6 py-4 font-semibold">Email</th>
                      <th className="px-6 py-4 font-semibold">Role</th>
                      <th className="px-6 py-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">
                              {u.fullName[0]}
                            </div>
                            <div>
                              <p className="text-white font-medium">{u.fullName}</p>
                              <p className="text-slate-500 text-xs">@{u.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-300">{u.email}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.role === 'admin' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button 
                            onClick={() => deleteUser(u.id)}
                            disabled={u.id === user.id}
                            className={`p-2 rounded-lg transition-colors ${u.id === user.id ? 'text-slate-600 cursor-not-allowed' : 'text-slate-400 hover:bg-red-500/10 hover:text-red-500'}`}
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'messages' && (
              <div className="bg-[#1e293b] rounded-3xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-800/50 text-slate-400 text-sm uppercase tracking-wider">
                      <th className="px-6 py-4 font-semibold">Sender</th>
                      <th className="px-6 py-4 font-semibold">Recipient</th>
                      <th className="px-6 py-4 font-semibold">Message</th>
                      <th className="px-6 py-4 font-semibold">Time</th>
                      <th className="px-6 py-4 font-semibold text-center">Secure Download</th>
                      <th className="px-6 py-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {messages.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 text-white font-medium">@{m.user}</td>
                        <td className="px-6 py-4 text-slate-400">{m.receiver}</td>
                        <td className="px-6 py-4 text-slate-300 max-w-xs truncate">{m.text || (m.fileUrl ? '[File]' : '')}</td>
                        <td className="px-6 py-4 text-slate-500 text-sm">{new Date(m.timestamp).toLocaleString()}</td>
                        <td className="px-6 py-4 text-center">
                          <button 
                            onClick={async () => {
                              const password = prompt('Enter a password to encrypt this message export:');
                              if (!password) return;
                              
                              // Simple frontend encryption for individual message
                              const data = JSON.stringify(m);
                              const encoder = new TextEncoder();
                              const dataBuffer = encoder.encode(data);
                              
                              // Create a key from the password
                              const keyMaterial = await window.crypto.subtle.importKey(
                                "raw",
                                encoder.encode(password),
                                { name: "PBKDF2" },
                                false,
                                ["deriveBits", "deriveKey"]
                              );
                              
                              const key = await window.crypto.subtle.deriveKey(
                                {
                                  name: "PBKDF2",
                                  salt: encoder.encode("salt-for-individual-msg"),
                                  iterations: 100000,
                                  hash: "SHA-256"
                                },
                                keyMaterial,
                                { name: "AES-GCM", length: 256 },
                                true,
                                ["encrypt"]
                              );
                              
                              const iv = window.crypto.getRandomValues(new Uint8Array(12));
                              const encrypted = await window.crypto.subtle.encrypt(
                                { name: "AES-GCM", iv: iv },
                                key,
                                dataBuffer
                              );
                              
                              const exportData = {
                                payload: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
                                iv: btoa(String.fromCharCode(...iv)),
                                algorithm: "AES-GCM",
                                note: "Encrypted with user-provided password"
                              };
                              
                              const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `msg_${m.id}_secure.json`;
                              a.click();
                            }}
                            className="p-2 text-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-300 rounded-lg transition-colors mx-auto"
                            title="Secure Download with Password"
                          >
                            <Shield className="w-5 h-5" />
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <button 
                            onClick={() => deleteMessage(m.id)}
                            className="p-2 text-slate-400 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Admin;
