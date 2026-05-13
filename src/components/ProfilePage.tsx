import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { motion } from 'motion/react';
import { 
  User, Mail, School, ShieldCheck, ShieldAlert, 
  Camera, ArrowRight, CheckCircle2, History 
} from 'lucide-react';
import { cn } from '../lib/utils';

const STUDENT_DOMAINS = [
  'khi.iba.edu.pk',
  'nust.edu.pk',
  'uok.edu.pk',
  'nu.edu.pk',
  'neduet.edu.pk',
  'fast.edu.pk',
  'edu.pk'
];

export const ProfilePage: React.FC = () => {
  const { profile, user } = useAuth();
  const [studentEmail, setStudentEmail] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  if (!profile || !user) return null;

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setMessage(null);

    const domain = studentEmail.split('@')[1]?.toLowerCase() || '';
    const isStudent = STUDENT_DOMAINS.some(d => domain.endsWith(d));

    if (!isStudent) {
      setMessage({ type: 'error', text: 'Please enter a valid university email (ending in .edu.pk)' });
      setIsVerifying(false);
      return;
    }

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        email: studentEmail,
        universityDomain: domain,
        isVerified: true,
        updatedAt: serverTimestamp()
      });
      setMessage({ type: 'success', text: 'Verification successful! Your student status is now verified.' });
      // The auth context listener will update the local profile state
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'users');
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Header Card */}
      <div className="card p-8 md:p-12 bg-white border-slate-100 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full -mr-32 -mt-32 blur-3xl" />
        
        <div className="relative flex flex-col md:flex-row items-center gap-8">
          <div className="relative group">
            <div className="w-32 h-32 rounded-[2rem] overflow-hidden border-4 border-white shadow-2xl">
              <img 
                src={profile.avatarUrl} 
                alt={profile.name} 
                className="w-full h-full object-cover"
              />
            </div>
            <button className="absolute -bottom-2 -right-2 p-3 bg-[#0F172A] text-white rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-all">
              <Camera size={16} />
            </button>
          </div>

          <div className="text-center md:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <h1 className="text-4xl font-extrabold tracking-tighter text-[#0F172A]">{profile.name}</h1>
              {profile.isVerified && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                  <CheckCircle2 size={14} className="fill-emerald-50" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Verified Student</span>
                </div>
              )}
            </div>
            <p className="text-lg font-bold text-slate-400">@{profile.username}</p>
            <div className="flex items-center justify-center md:justify-start gap-6 pt-4">
              <div className="text-center md:text-left">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Rides Completed</p>
                <p className="text-2xl font-black text-[#0F172A]">{profile.rideCount}</p>
              </div>
              <div className="w-px h-8 bg-slate-100" />
              <div className="text-center md:text-left">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Affiliation</p>
                <p className="text-sm font-extrabold text-indigo-600 uppercase tracking-tight">{profile.universityId}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left Column: Details */}
        <div className="lg:col-span-3 space-y-6">
          <section className="card p-8 bg-white border-slate-100 space-y-8">
            <h3 className="text-xl font-extrabold text-[#0F172A] flex items-center gap-3">
              <User size={20} className="text-indigo-600" />
              Profile Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Full Name</p>
                <div className="flex items-center gap-3 px-4 py-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <User size={18} className="text-slate-400" />
                  <span className="font-bold text-slate-700">{profile.name}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Institutional Email</p>
                <div className="flex items-center gap-3 px-4 py-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <Mail size={18} className="text-slate-400" />
                  <span className="font-bold text-slate-700 truncate">{profile.email}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">University</p>
                <div className="flex items-center gap-3 px-4 py-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <School size={18} className="text-slate-400" />
                  <span className="font-bold text-slate-700 uppercase">{profile.universityId}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Member Since</p>
                <div className="flex items-center gap-3 px-4 py-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <History size={18} className="text-slate-400" />
                  <span className="font-bold text-slate-700">
                    {profile.createdAt instanceof Date ? profile.createdAt.toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Verification */}
        <div className="lg:col-span-2 space-y-6">
          {!profile.isVerified ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card p-8 bg-indigo-600 text-white border-0 shadow-2xl shadow-indigo-200"
            >
              <ShieldAlert size={40} className="mb-6 text-indigo-300" />
              <h3 className="text-2xl font-black tracking-tight mb-2">Get Verified</h3>
              <p className="text-indigo-100 text-sm font-medium leading-relaxed mb-8">
                Unlock higher trust and the "Protocol Verified" badge by adding your university email.
              </p>

              <form onSubmit={handleVerify} className="space-y-4">
                <div>
                  <input
                    type="email"
                    placeholder="student@university.edu.pk"
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    className="w-full px-5 py-4 bg-white/10 border border-white/20 rounded-xl focus:bg-white/20 outline-none transition-all placeholder:text-white/40 font-bold"
                    required
                  />
                </div>
                
                {message && (
                  <p className={cn(
                    "text-[10px] font-bold uppercase tracking-wider px-1",
                    message.type === 'success' ? "text-emerald-300" : "text-rose-300"
                  )}>
                    {message.text}
                  </p>
                )}

                <button 
                  type="submit"
                  disabled={isVerifying}
                  className="w-full py-4 bg-white text-indigo-600 rounded-xl font-black uppercase tracking-tight flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors shadow-lg"
                >
                  {isVerifying ? 'Verifying...' : 'Verify Status'}
                  <ArrowRight size={18} />
                </button>
              </form>
            </motion.div>
          ) : (
            <div className="card p-8 bg-emerald-50 border-emerald-100 text-center">
              <div className="w-16 h-16 bg-emerald-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-200">
                <ShieldCheck size={32} />
              </div>
              <h3 className="text-xl font-extrabold text-emerald-900 mb-2">Protocol Verified</h3>
              <p className="text-emerald-700/70 text-sm font-medium leading-relaxed">
                Your student status has been successfully verified via your institutional domain.
              </p>
            </div>
          )}

          <div className="card p-6 bg-slate-900 text-white border-0">
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-3">Security Note</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Verification is based on university domain matching. Verified status allows you to join student-only pools with increased security.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
