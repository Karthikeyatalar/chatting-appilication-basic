import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Send, LogOut, MessageSquare, Users, Search, MoreVertical, Paperclip, Smile, Hash, AtSign, Globe, ShieldCheck, File, Image as ImageIcon, Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import EmojiPicker from 'emoji-picker-react';

const Chat = ({ user, onLogout }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [socket, setSocket] = useState(null);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChannel, setActiveChannel] = useState('all'); 
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [securityError, setSecurityError] = useState('');
  const scrollRef = useRef();
  const fileInputRef = useRef();
  const navigate = useNavigate();

  const RESTRICTED_WORDS = ['suicide', 'murder', 'terrorist', 'bomb', 'kill', 'attack', 'illegal', 'hack'];

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/users');
        setUsers(res.data.filter(u => u.username !== user.username));
      } catch (err) {
        console.error('Error fetching users', err);
      }
    };
    fetchUsers();

    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);
    newSocket.emit('join', user.username);

    newSocket.on('previousMessages', (prevMessages) => setMessages(prevMessages));
    newSocket.on('message', (message) => setMessages((prev) => [...prev, message]));
    newSocket.on('newUser', (newUser) => {
      if (newUser.username !== user.username) {
        setUsers((prev) => {
          if (prev.find(u => u.username === newUser.username)) return prev;
          return [...prev, newUser];
        });
      }
    });

    return () => newSocket.close();
  }, [user.username]);

  useEffect(() => {
    if (securityError) {
      const timer = setTimeout(() => setSecurityError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [securityError]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeChannel]);

  const onEmojiClick = (emojiData) => {
    setInput(prev => prev + emojiData.emoji);
  };

  const sendMessage = (e) => {
    e.preventDefault();
    const lowText = input.toLowerCase();
    const foundWord = RESTRICTED_WORDS.find(word => lowText.includes(word));
    
    if (foundWord) {
      setSecurityError(`Security Alert: Your message contains restricted content ("${foundWord}"). Please adhere to community guidelines.`);
      return;
    }

    if (input.trim() && socket) {
      socket.emit('sendMessage', { text: input, receiver: activeChannel });
      setInput('');
      setShowEmojiPicker(false);
      setSecurityError('');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post('http://localhost:5000/api/upload', formData);
      socket.emit('sendMessage', { 
        text: `Shared a file: ${file.name}`, 
        receiver: activeChannel,
        fileUrl: res.data.fileUrl,
        fileType: res.data.fileType
      });
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setIsUploading(false);
    }
  };

  const filteredMessages = messages.filter(msg => {
    if (activeChannel === 'all') return msg.receiver === 'all';
    return (msg.user === user.username && msg.receiver === activeChannel) || 
           (msg.user === activeChannel && msg.receiver === user.username);
  });

  return (
    <div className="flex h-screen bg-[#030712] overflow-hidden font-['Plus_Jakarta_Sans']">
      {/* Profile Modal */}
      <AnimatePresence>
        {showProfile && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowProfile(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md glass-panel p-10 rounded-[3rem] relative z-10 border border-white/20"
            >
              <button 
                onClick={() => setShowProfile(false)}
                className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-full text-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-8">
                <div className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-br from-primary to-secondary flex items-center justify-center font-bold text-4xl text-white shadow-2xl shadow-primary/20 mx-auto mb-6">
                  {user.fullName ? user.fullName[0].toUpperCase() : user.username[0].toUpperCase()}
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-glow">{user.fullName || user.username}</h2>
                <p className="text-primary font-bold text-xs uppercase tracking-widest mt-1">Lounge Member</p>
              </div>

              <div className="space-y-4">
                <div className="bg-white/5 p-5 rounded-3xl border border-white/5">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Username</p>
                  <p className="font-semibold text-slate-200">@{user.username}</p>
                </div>
                <div className="bg-white/5 p-5 rounded-3xl border border-white/5">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Email Address</p>
                  <p className="font-semibold text-slate-200">{user.email || 'N/A'}</p>
                </div>
                <div className="bg-white/5 p-5 rounded-3xl border border-white/5 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Account ID</p>
                    <p className="font-mono text-[10px] text-slate-400">{user.id}</p>
                  </div>
                  <div className="px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-[8px] font-bold text-green-400 uppercase tracking-tighter">
                    Verified
                  </div>
                </div>
              </div>

              {user.username === 'charan' && (
                <button 
                  onClick={() => navigate('/admin')}
                  className="w-full mt-6 py-4 bg-primary/10 hover:bg-primary text-primary hover:text-white border border-primary/20 rounded-2xl font-bold transition-all flex items-center justify-center gap-3"
                >
                  <ShieldCheck className="w-5 h-5" />
                  Management Console
                </button>
              )}

              <button 
                onClick={onLogout}
                className="w-full mt-8 py-4 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 rounded-2xl font-bold transition-all flex items-center justify-center gap-3"
              >
                <LogOut className="w-5 h-5" />
                Sign Out from Lounge
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="mesh-bg opacity-30" />

      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-80 border-r border-white/5 glass-panel m-4 rounded-[2rem] overflow-hidden">
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div 
            onClick={() => setShowProfile(true)}
            className="flex items-center gap-4 cursor-pointer group"
          >
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center font-bold text-white shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                {user.fullName ? user.fullName[0].toUpperCase() : user.username[0].toUpperCase()}
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-4 border-[#030712] rounded-full" />
            </div>
            <div className="overflow-hidden">
              <h2 className="font-bold text-sm truncate tracking-tight group-hover:text-primary transition-colors">{user.fullName || user.username}</h2>
              <p className="text-[10px] text-slate-500 font-medium">@{user.username}</p>
            </div>
          </div>
          <button onClick={onLogout} className="p-2.5 hover:bg-red-500/10 hover:text-red-400 rounded-xl text-slate-500 transition-all">
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white/10 transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-8">
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4 px-4">Channels</div>
            <button 
              onClick={() => setActiveChannel('all')}
              className={`w-full flex items-center gap-4 p-4 rounded-[1.5rem] transition-all relative group ${activeChannel === 'all' ? 'bg-primary/10 border border-primary/20' : 'hover:bg-white/5 border border-transparent'}`}
            >
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${activeChannel === 'all' ? 'bg-primary/20 text-primary' : 'bg-white/5 text-slate-500'}`}>
                <Globe className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className={`text-sm font-bold tracking-tight ${activeChannel === 'all' ? 'text-white' : 'text-slate-300'}`}>Global Lounge</div>
                <div className="text-[10px] text-slate-500 font-medium">Live interaction</div>
              </div>
              {activeChannel === 'all' && <div className="absolute right-4 w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_10px_#8b5cf6]" />}
            </button>
          </div>

          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4 px-4">Active Identities</div>
            <div className="space-y-2">
              {users
                .filter(u => u.username.toLowerCase().includes(searchQuery.toLowerCase()) || (u.fullName && u.fullName.toLowerCase().includes(searchQuery.toLowerCase())))
                .map((u) => (
                <button 
                  key={u.id}
                  onClick={() => setActiveChannel(u.username)}
                  className={`w-full flex items-center gap-4 p-3.5 rounded-[1.5rem] transition-all relative group ${activeChannel === u.username ? 'bg-accent/10 border border-accent/20' : 'hover:bg-white/5 border border-transparent'}`}
                >
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold ${activeChannel === u.username ? 'bg-accent/20 text-accent' : 'bg-white/5 text-slate-500'}`}>
                    {u.username[0].toUpperCase()}
                  </div>
                  <div className="text-left overflow-hidden">
                    <div className={`text-sm font-bold tracking-tight truncate ${activeChannel === u.username ? 'text-white' : 'text-slate-300'}`}>{u.fullName || u.username}</div>
                    <div className="text-[10px] text-slate-500 font-medium">@{u.username}</div>
                  </div>
                  {activeChannel === u.username && <div className="absolute right-4 w-1.5 h-1.5 bg-accent rounded-full shadow-[0_0_10px_#06b6d4]" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative lg:m-4 lg:ml-0 bg-white/[0.02] glass-panel lg:rounded-[2rem] overflow-hidden">
        {/* Chat Header */}
        <header className="p-6 md:p-8 border-b border-white/5 bg-white/[0.02] backdrop-blur-xl flex items-center justify-between">
          <div className="flex items-center gap-5">
            <motion.div 
              initial={{ scale: 0.8 }} 
              animate={{ scale: 1 }} 
              key={activeChannel}
              className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-white shadow-2xl ${activeChannel === 'all' ? 'bg-gradient-to-br from-primary to-secondary shadow-primary/20' : 'bg-gradient-to-br from-accent to-blue-600 shadow-accent/20'}`}
            >
              {activeChannel === 'all' ? <Globe className="w-7 h-7" /> : activeChannel[0].toUpperCase()}
            </motion.div>
            <div>
              <h3 className="font-extrabold text-xl tracking-tight text-glow">
                {activeChannel === 'all' ? 'Global Lounge' : (users.find(u => u.username === activeChannel)?.fullName || activeChannel)}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <ShieldCheck className="w-3 h-3 text-accent" />
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">End-to-End Secure</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 transition-all border border-white/5"><Search className="w-5 h-5" /></button>
            <button className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 transition-all border border-white/5"><MoreVertical className="w-5 h-5" /></button>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 scrollbar-hide">
          <AnimatePresence initial={false}>
            {filteredMessages.map((msg, i) => {
              const isMe = msg.user === user.username;
              const isSystem = msg.user === 'System';

              if (isSystem) return (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} key={i} className="flex justify-center">
                  <span className="px-6 py-2 bg-white/5 rounded-full text-[10px] font-bold text-slate-500 border border-white/5 uppercase tracking-[0.15em] backdrop-blur-sm">{msg.text}</span>
                </motion.div>
              );

              return (
                <motion.div 
                  initial={{ opacity: 0, y: 20, scale: 0.95 }} 
                  animate={{ opacity: 1, y: 0, scale: 1 }} 
                  key={i} 
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] md:max-w-[65%] group ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                    {!isMe && activeChannel === 'all' && (
                      <span className="text-[10px] font-bold text-primary mb-2 ml-4 uppercase tracking-widest flex items-center gap-2">
                        <div className="w-1 h-1 bg-primary rounded-full" />
                        {msg.user}
                      </span>
                    )}
                    <div className={`p-5 rounded-[1.8rem] shadow-2xl transition-all duration-300 relative ${
                      isMe 
                        ? (activeChannel === 'all' ? 'bg-gradient-to-br from-primary to-secondary text-white rounded-tr-none' : 'bg-gradient-to-br from-accent to-blue-600 text-white rounded-tr-none')
                        : 'bg-white/5 border border-white/10 text-slate-200 rounded-tl-none backdrop-blur-md'
                    }`}>
                      {msg.fileUrl ? (
                        <div className="space-y-3">
                          {msg.fileType?.startsWith('image/') ? (
                            <img src={msg.fileUrl} alt="shared" className="max-w-full rounded-xl shadow-lg border border-white/10" />
                          ) : (
                            <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10">
                              <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-primary">
                                <File className="w-5 h-5" />
                              </div>
                              <span className="text-xs truncate max-w-[150px]">{msg.text.split(': ')[1]}</span>
                            </div>
                          )}
                          <a 
                            href={msg.fileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors py-2 bg-white/5 rounded-lg border border-white/5"
                          >
                            <Download className="w-3 h-3" />
                            Download
                          </a>
                        </div>
                      ) : (
                        <p className="text-sm md:text-base leading-relaxed font-medium">{msg.text}</p>
                      )}
                    </div>
                    <div className={`text-[9px] font-bold text-slate-600 mt-2 px-2 uppercase tracking-widest flex items-center gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      <div className="w-0.5 h-0.5 bg-slate-700 rounded-full" />
                      Delivered
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          <div ref={scrollRef} />
        </div>

        {/* Message Input */}
        <footer className="p-6 md:p-10 bg-transparent relative">
          <AnimatePresence>
            {securityError && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-full left-10 right-10 mb-6 bg-red-500/10 border border-red-500/20 backdrop-blur-xl p-4 rounded-2xl flex items-center gap-4 z-50 shadow-2xl shadow-red-500/10"
              >
                <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-red-400 tracking-tight">Security Protocol Violation</h4>
                  <p className="text-[10px] text-red-500/70 font-medium leading-tight mt-1">{securityError}</p>
                </div>
                <button 
                  onClick={() => setSecurityError('')}
                  className="ml-auto p-2 hover:bg-red-500/10 rounded-lg text-red-500/50 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {showEmojiPicker && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute bottom-full mb-4 z-50 right-10 flex flex-col items-end"
              >
                <button 
                  type="button"
                  onClick={() => setShowEmojiPicker(false)}
                  className="bg-white/10 hover:bg-red-500/80 text-white p-2 rounded-xl mb-3 backdrop-blur-md border border-white/10 shadow-2xl transition-all hover:scale-110 active:scale-95 group"
                >
                  <X className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                </button>
                <EmojiPicker 
                  theme="dark" 
                  onEmojiClick={onEmojiClick}
                  autoFocusSearch={false}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileUpload}
          />

          <form onSubmit={sendMessage} className="relative glass-card p-2 rounded-[2rem] flex items-center gap-3 border border-white/10 shadow-2xl">
            <button 
              type="button" 
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`p-4 rounded-2xl transition-all ${showEmojiPicker ? 'bg-primary/20 text-primary' : 'hover:bg-white/5 text-slate-400'}`}
            >
              <Smile className="w-6 h-6" />
            </button>
            <button 
              type="button" 
              onClick={() => fileInputRef.current.click()}
              disabled={isUploading}
              className={`p-4 rounded-2xl transition-all ${isUploading ? 'animate-pulse text-accent' : 'hover:bg-white/5 text-slate-500'}`}
            >
              {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Paperclip className="w-6 h-6" />}
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm md:text-base py-4 font-medium placeholder:text-slate-600"
              placeholder={isUploading ? "Uploading file..." : `Communicate in ${activeChannel === 'all' ? 'Lounge' : '@' + activeChannel}...`}
            />
            <button
              type="submit"
              disabled={!input.trim() || isUploading}
              className={`p-5 rounded-2xl transition-all duration-500 ${
                input.trim() && !isUploading
                  ? (activeChannel === 'all' ? 'bg-gradient-to-br from-primary to-secondary shadow-lg shadow-primary/30' : 'bg-gradient-to-br from-accent to-blue-600 shadow-lg shadow-accent/30') + ' text-white scale-100 rotate-0' 
                  : 'bg-white/5 text-slate-600 scale-90 -rotate-12 opacity-50'
              }`}
            >
              <Send className="w-6 h-6" />
            </button>
          </form>
        </footer>
      </main>
    </div>
  );
};

const Loader2 = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4"/><path d="m16.2 7.8 2.9-2.9"/><path d="M18 12h4"/><path d="m16.2 16.2 2.9 2.9"/><path d="M12 18v4"/><path d="m4.9 19.1 2.9-2.9"/><path d="M2 12h4"/><path d="m4.9 4.9 2.9 2.9"/></svg>
);

export default Chat;
