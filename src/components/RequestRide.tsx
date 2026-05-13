import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';
import { MapPin, Clock, ChevronLeft, ArrowRight, Info } from 'lucide-react';
import { PassengerRequest } from '../types';

interface RequestRideProps {
  onComplete: () => void;
  requestId?: string;
}

export const RequestRide: React.FC<RequestRideProps> = ({ onComplete, requestId }) => {
  const { user, profile } = useAuth();
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    preferredTime: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(!!requestId);

  useEffect(() => {
    if (requestId) {
      const fetchRequest = async () => {
        try {
          const docRef = doc(db, 'passenger_requests', requestId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data() as PassengerRequest;
            const date = data.preferredTime?.toDate?.() || new Date(data.preferredTime);
            const formattedDate = date.toISOString().slice(0, 16);
            
            setFormData({
              origin: data.origin,
              destination: data.destination,
              preferredTime: formattedDate
            });
          }
        } catch (error) {
          console.error("Error fetching request:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchRequest();
    }
  }, [requestId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    try {
      const requestData = {
        origin: formData.origin,
        destination: formData.destination,
        preferredTime: new Date(formData.preferredTime),
        isOwnerVerified: profile?.isVerified || false,
        universityId: profile?.universityId || 'other',
      };

      if (requestId) {
        await updateDoc(doc(db, 'passenger_requests', requestId), {
          ...requestData,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'passenger_requests'), {
          ...requestData,
          ownerId: user.uid,
          universityDomain: profile?.universityDomain || user.email.split('@')[1].toLowerCase(),
          status: 'seeking',
          joinerIds: [],
          acceptedIds: [],
          createdAt: serverTimestamp()
        });
      }
      onComplete();
    } catch (error) {
      handleFirestoreError(error, requestId ? OperationType.UPDATE : OperationType.CREATE, 'passenger_requests');
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-slate-400 font-bold uppercase tracking-widest text-xs">Preparing form...</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <button 
        onClick={onComplete}
        className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold text-xs uppercase tracking-widest mb-8 transition-colors"
      >
        <ChevronLeft size={16} />
        Back
      </button>

      <div className="card shadow-none p-10">
        <div className="mb-10 text-center">
          <h2 className="text-4xl font-extrabold tracking-tighter text-[#0F172A] leading-none">
            {requestId ? 'Edit Request' : 'Request a Ride'}
          </h2>
          <p className="text-[#64748B] mt-4 font-medium">
            {requestId ? 'Update your pool request details.' : 'Post a request and build your student pool.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="flex items-start gap-4 p-5 bg-[#EEF2FF] border border-[#E0E7FF] rounded-[16px] text-[#4F46E5] text-sm">
            <Info size={20} className="mt-0.5 shrink-0" />
            <p className="leading-relaxed font-medium">
              <strong>Pool Match:</strong> Once you post, other students see your route and can request to join. You must approve each joiner manually.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] ml-1">From</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-[#CBD5E1]" size={18} />
                <input
                  type="text"
                  required
                  placeholder="e.g. South Dorms"
                  value={formData.origin}
                  onChange={(e) => setFormData({...formData, origin: e.target.value})}
                  className="w-full pl-12 pr-5 py-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[16px] focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] outline-none transition-all font-semibold"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] ml-1">To</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4F46E5]" size={18} />
                <input
                  type="text"
                  required
                  placeholder="e.g. Downtown Mall"
                  value={formData.destination}
                  onChange={(e) => setFormData({...formData, destination: e.target.value})}
                  className="w-full pl-12 pr-5 py-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[16px] focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] outline-none transition-all font-semibold"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] ml-1">Preferred Time</label>
            <div className="relative">
              <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#CBD5E1]" size={18} />
              <input
                type="datetime-local"
                required
                value={formData.preferredTime}
                onChange={(e) => setFormData({...formData, preferredTime: e.target.value})}
                className="w-full pl-12 pr-5 py-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[16px] focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] outline-none transition-all font-semibold"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full py-5 rounded-[16px] text-lg font-extrabold uppercase tracking-tight shadow-xl shadow-indigo-100 mt-4 h-auto"
          >
            {isSubmitting ? (requestId ? 'Updating...' : 'Posting...') : (requestId ? 'Update Pool' : 'Request Pool')}
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </form>
      </div>
    </div>
  );
};
