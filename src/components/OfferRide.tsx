import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';
import { MapPin, Clock, Banknote, Car, ChevronLeft, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { Ride } from '../types';

interface OfferRideProps {
  onComplete: () => void;
  rideId?: string;
}

export const OfferRide: React.FC<OfferRideProps> = ({ onComplete, rideId }) => {
  const { profile, user } = useAuth();
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    departureTime: '',
    price: '',
    vehicle: '',
    seats: '4'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(!!rideId);

  useEffect(() => {
    if (rideId) {
      const fetchRide = async () => {
        try {
          const docRef = doc(db, 'rides', rideId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data() as Ride;
            // Format date for datetime-local input
            const date = data.departureTime?.toDate?.() || new Date(data.departureTime);
            const formattedDate = date.toISOString().slice(0, 16);
            
            setFormData({
              origin: data.origin,
              destination: data.destination,
              departureTime: formattedDate,
              price: data.price.toString(),
              vehicle: data.vehicle,
              seats: data.seats.toString()
            });
          }
        } catch (error) {
          console.error("Error fetching ride:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchRide();
    }
  }, [rideId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    try {
      const rideData = {
        origin: formData.origin,
        destination: formData.destination,
        departureTime: new Date(formData.departureTime),
        price: parseFloat(formData.price),
        vehicle: formData.vehicle,
        seats: parseInt(formData.seats),
        isDriverVerified: profile?.isVerified || false,
        universityId: profile?.universityId || 'other',
      };

      if (rideId) {
        await updateDoc(doc(db, 'rides', rideId), {
          ...rideData,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'rides'), {
          ...rideData,
          driverId: user.uid,
          universityDomain: profile?.universityDomain || user.email.split('@')[1].toLowerCase(),
          availableSeats: parseInt(formData.seats),
          status: 'active',
          passengerIds: [],
          requestedPassengerIds: [],
          createdAt: serverTimestamp()
        });
      }
      onComplete();
    } catch (error) {
      handleFirestoreError(error, rideId ? OperationType.UPDATE : OperationType.CREATE, 'rides');
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
        <div className="mb-10">
          <h2 className="text-4xl font-extrabold tracking-tighter text-[#0F172A] leading-none text-center">
            {rideId ? 'Edit Offer' : 'Offer a Ride'}
          </h2>
          <p className="text-[#64748B] mt-4 font-medium text-center">
            {rideId ? 'Update your trip details for other students.' : 'Set your route and help students move together.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] ml-1">Pick-up Location</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-[#CBD5E1]" size={18} />
                <input
                  type="text"
                  required
                  placeholder="e.g. Main Library"
                  value={formData.origin}
                  onChange={(e) => setFormData({...formData, origin: e.target.value})}
                  className="w-full pl-12 pr-5 py-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[16px] focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] outline-none transition-all font-semibold"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] ml-1">Destination</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4F46E5]" size={18} />
                <input
                  type="text"
                  required
                  placeholder="e.g. Science Park"
                  value={formData.destination}
                  onChange={(e) => setFormData({...formData, destination: e.target.value})}
                  className="w-full pl-12 pr-5 py-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[16px] focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] outline-none transition-all font-semibold"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] ml-1">Departure Time</label>
            <div className="relative">
              <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#CBD5E1]" size={18} />
              <input
                type="datetime-local"
                required
                value={formData.departureTime}
                onChange={(e) => setFormData({...formData, departureTime: e.target.value})}
                className="w-full pl-12 pr-5 py-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[16px] focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] outline-none transition-all font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] ml-1">Price (Rs)</label>
              <div className="relative">
                <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 text-[#CBD5E1]" size={18} />
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  className="w-full pl-12 pr-5 py-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[16px] focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] outline-none transition-all font-semibold"
                />
              </div>
            </div>
            <div className="space-y-2 col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] ml-1">Vehicle Details</label>
              <div className="relative">
                <Car className="absolute left-4 top-1/2 -translate-y-1/2 text-[#CBD5E1]" size={18} />
                <input
                  type="text"
                  required
                  placeholder="e.g. Silver Honda Civic"
                  value={formData.vehicle}
                  onChange={(e) => setFormData({...formData, vehicle: e.target.value})}
                  className="w-full pl-12 pr-5 py-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[16px] focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] outline-none transition-all font-semibold"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] ml-1">Available Seats (Max 6)</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setFormData({...formData, seats: num.toString()})}
                  className={cn(
                    "flex-1 py-3 font-bold rounded-[12px] border transition-all",
                    formData.seats === num.toString() 
                      ? "bg-[#0F172A] text-white border-[#0F172A]" 
                      : "bg-white border-[#E2E8F0] text-[#64748B] hover:border-[#CBD5E1]"
                  )}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full py-5 rounded-[16px] text-lg font-extrabold uppercase tracking-tight shadow-xl shadow-indigo-100 mt-4 h-auto"
          >
            {isSubmitting ? (rideId ? 'Updating...' : 'Posting...') : (rideId ? 'Update Offer' : 'Create Offer')}
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </form>
      </div>
    </div>
  );
};
