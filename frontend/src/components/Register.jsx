import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { UserPlus, User, Lock, Loader2, CheckCircle, Mail, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.post('http://localhost:5000/api/register', { username, email, fullName, password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-6 relative overflow-hidden">
      <div className="mesh-bg" />
      <div className="mesh-glow top-0 right-0" style={{ transform: 'translate(30%, -30%)', background: 'radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, transparent 70%)' }} />
      <div className="mesh-glow bottom-0 left-0" style={{ transform: 'translate(-30%, 30%)' }} />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-lg glass-panel p-10 rounded-[2.5rem] relative z-10 my-10"
      >
        <div className="text-center mb-10">
          <motion.div 
            whileHover={{ scale: 1.1 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-secondary/20 mb-6 border border-secondary/30"
          >
            <Zap className="w-8 h-8 text-secondary" />
          </motion.div>
          <h1 className="text-4xl font-bold mb-3 premium-gradient-text tracking-tight">Create Identity</h1>
          <p className="text-slate-400 text-sm">Join the next generation of communication</p>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-xs mb-6 flex items-center gap-3">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
            {error}
          </motion.div>
        )}

        {success && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-accent/10 border border-accent/20 text-accent p-4 rounded-2xl text-xs mb-6 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 animate-bounce" />
            Identity secured! Moving to access point...
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 ml-1 uppercase tracking-[0.2em]">Full Name</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-accent transition-colors" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:bg-white/10 transition-all text-sm placeholder:text-slate-700"
                placeholder="John Wick"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 ml-1 uppercase tracking-[0.2em]">Username</label>
            <div className="relative group">
              <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-accent transition-colors" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:bg-white/10 transition-all text-sm placeholder:text-slate-700"
                placeholder="night_stalker"
                required
              />
            </div>
          </div>

          <div className="md:col-span-2 space-y-2">
            <label className="text-[10px] font-bold text-slate-500 ml-1 uppercase tracking-[0.2em]">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-accent transition-colors" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:bg-white/10 transition-all text-sm placeholder:text-slate-700"
                placeholder="contact@nexus.com"
                required
              />
            </div>
          </div>

          <div className="md:col-span-2 space-y-2">
            <label className="text-[10px] font-bold text-slate-500 ml-1 uppercase tracking-[0.2em]">Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-accent transition-colors" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:bg-white/10 transition-all text-sm placeholder:text-slate-700"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="md:col-span-2 relative group overflow-hidden mt-4"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-secondary via-primary to-accent opacity-90 group-hover:opacity-100 transition-opacity" />
            <div className="relative py-4 rounded-2xl flex items-center justify-center gap-3 font-bold text-white shadow-xl shadow-secondary/20">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  <UserPlus className="w-5 h-5" />
                  <span>Initialize Connection</span>
                </>
              )}
            </div>
          </button>
        </form>

        <div className="mt-10 text-center">
          <p className="text-slate-500 text-sm">
            Already have an identity?{' '}
            <Link to="/login" className="text-accent hover:text-secondary transition-colors font-bold tracking-tight">
              Sign In
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

const AtSign = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"/></svg>
);

export default Register;
