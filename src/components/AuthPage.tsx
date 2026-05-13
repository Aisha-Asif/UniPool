import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';
import { Car, ChevronRight, AlertCircle, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';

export const AuthPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [universityId, setUniversityId] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, register } = useAuth();

  const universities = [
    { id: 'iba', name: 'IBA Karachi' },
    { id: 'nust', name: 'NUST Islamabad' },
    { id: 'uok', name: 'University of Karachi' },
    { id: 'nu', name: 'FAST-NUCES' },
    { id: 'neduet', name: 'NED University' },
    { id: 'lums', name: 'LUMS' },
    { id: 'szabist', name: 'SZABIST' },
    { id: 'other', name: 'Other University' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        await login(email.trim(), password);
      } else {
        await register(email.trim(), password, {
          username: username.trim(),
          name: name.trim(),
          universityId
        });
        setSuccess("Account created! Use your handle to login.");
        setMode('login');
        setEmail('@' + username.trim()); // Pre-fill with the handle
        setPassword('');
        setIsSubmitting(false);
      }
    } catch (err: any) {
      let friendlyMessage = 'Authentication failed';
      try {
        // Try to parse if it's a JSON string from handleFirestoreError
        const parsed = JSON.parse(err.message);
        friendlyMessage = parsed.error || friendlyMessage;
      } catch {
        friendlyMessage = err.message || friendlyMessage;
      }
      
      // Clean up common Firebase error codes
      if (friendlyMessage.includes('auth/invalid-credential')) {
        friendlyMessage = "Incorrect email or password.";
      } else if (friendlyMessage.includes('auth/user-not-found')) {
        friendlyMessage = "No student record found for this email.";
      } else if (friendlyMessage.includes('auth/email-already-in-use')) {
        friendlyMessage = "Email already registered. Try logging in.";
      } else if (friendlyMessage.includes('auth/operation-not-allowed')) {
        friendlyMessage = "Auth system offline. Please enable 'Email/Password' in Firebase Console -> Authentication -> Sign-in method.";
      }

      setError(friendlyMessage);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row">
      <div className="hidden md:flex md:w-1/2 bg-[#0F172A] items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,#4F46E5,transparent)]" />
        </div>
        <div className="relative z-10 max-w-sm">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl font-bold text-white tracking-tighter leading-none mb-6">
              Rideshare for the <span className="text-indigo-400 italic font-serif">connected</span> university.
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed">
              One platform for every student. Offer a ride, join a pool, and move together safely.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-[#F8FAFC]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white p-10 rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)] border border-slate-100"
        >
          <div className="mb-10 text-center">
            <div className="w-12 h-12 bg-[#4F46E5] rounded-2xl mx-auto mb-6 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <Car size={24} />
            </div>
            <h2 className="text-3xl font-extrabold text-[#0F172A] tracking-tighter">
              {mode === 'login' ? 'Uni Login' : 'Join Community'}
            </h2>
            <p className="text-[#64748B] mt-2 text-sm font-medium">
              {mode === 'login' 
                ? 'Enter your unique handle to proceed.' 
                : 'Create your account to start pool sharing.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={16} className="text-[#4F46E5]" />
                  <span className="text-xs font-bold uppercase tracking-widest text-[#4F46E5]">Verification Boost</span>
                </div>
                <p className="text-[11px] text-indigo-700 leading-relaxed font-medium">
                  💡 <span className="font-bold">Pro-tip:</span> Use your <span className="font-bold">student email</span> (e.g. .edu.pk) to automatically get a <span className="italic">Verified Student</span> badge on your profile!
                </p>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] mb-2 px-1">
                {mode === 'login' ? 'Unique Handle' : 'Email Address'}
              </label>
              <input
                type={mode === 'login' ? "text" : "email"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl focus:ring-2 focus:ring-[#4F46E5]/10 focus:border-[#4F46E5] outline-none transition-all font-semibold"
                placeholder={mode === 'login' ? "@jane_fast" : "yourname@email.com"}
                required
              />
            </div>

            {mode === 'register' && (
              <>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] mb-2 px-1">
                      Choose Your University
                    </label>
                    <select
                      value={universityId}
                      onChange={(e) => setUniversityId(e.target.value)}
                      className="w-full px-5 py-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl focus:ring-2 focus:ring-[#4F46E5]/10 focus:border-[#4F46E5] outline-none transition-all font-semibold appearance-none"
                      required
                    >
                      <option value="" disabled>Select University</option>
                      {universities.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] mb-2 px-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-5 py-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl focus:ring-2 focus:ring-[#4F46E5]/10 focus:border-[#4F46E5] outline-none transition-all font-semibold"
                        placeholder="Jane Doe"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] mb-2 px-1">
                        Pick a Handle
                      </label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-5 py-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl focus:ring-2 focus:ring-[#4F46E5]/10 focus:border-[#4F46E5] outline-none transition-all font-semibold"
                        placeholder="jane_fast"
                        required
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] mb-2 px-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl focus:ring-2 focus:ring-[#4F46E5]/10 focus:border-[#4F46E5] outline-none transition-all font-semibold"
                placeholder="••••••••"
                required
              />
            </div>

            {success && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl text-sm font-medium"
              >
                <Sparkles size={16} />
                {success}
              </motion.div>
            )}

            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex items-center gap-2 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-sm font-medium"
              >
                <AlertCircle size={16} />
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#4F46E5] text-white font-bold py-5 rounded-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {isSubmitting ? 'Hang tight...' : mode === 'login' ? 'Start Riding' : 'Create Profile'}
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>

            <div className="pt-4 text-center">
               <button 
                type="button"
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                className="text-sm font-bold text-[#64748B] hover:text-[#4F46E5] transition-colors inline-flex items-center justify-center gap-1"
               >
                 {mode === 'login' ? (
                   <>New student? <span className="text-[#4F46E5] ml-1">Start verification</span> <Sparkles size={14} /></>
                 ) : (
                   <>Already verified? <span className="text-[#4F46E5] ml-1">Login here</span></>
                 )}
               </button>
            </div>
          </form>

          <p className="text-center text-[#94A3B8] text-[9px] mt-8 px-8 leading-relaxed uppercase tracking-[0.15em] font-bold">
            Identity verified via student enrollment ID.
          </p>
        </motion.div>
      </div>
    </div>
  );
};
