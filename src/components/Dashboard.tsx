import React, { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { Ride, PassengerRequest } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, Car, User, ArrowRight, Clock, Users, Star, Filter, RotateCcw, Plus } from 'lucide-react';
import { cn, formatDate } from '../lib/utils';

interface DashboardProps {
  onSelectRide: (id: string, type: 'ride' | 'request') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onSelectRide }) => {
  const { profile } = useAuth();
  const [rides, setRides] = useState<Ride[]>([]);
  const [requests, setRequests] = useState<PassengerRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'rides' | 'requests'>('rides');

  useEffect(() => {
    if (!profile?.universityId) return;

    // Sync Rides
    const ridesQuery = query(
      collection(db, 'rides'),
      where('status', '==', 'active'),
      where('universityId', '==', profile.universityId),
      orderBy('departureTime', 'asc'),
      limit(20)
    );
    const unsubscribeRides = onSnapshot(ridesQuery, (snapshot) => {
      setRides(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ride)));
    }, (err) => console.warn("Rides sync:", err));

    // Sync Requests
    const requestsQuery = query(
      collection(db, 'passenger_requests'),
      where('status', '==', 'seeking'),
      where('universityId', '==', profile.universityId),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const unsubscribeRequests = onSnapshot(requestsQuery, (snapshot) => {
      setRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PassengerRequest)));
    }, (err) => console.warn("Requests sync:", err));

    return () => {
      unsubscribeRides();
      unsubscribeRequests();
    };
  }, [profile?.universityId]);

  return (
    <div className="space-y-8">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tighter text-[#0F172A] leading-none">Uni Grid</h2>
          <p className="text-[#64748B] mt-2 font-medium">Real-time mobility network for students.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="bg-white p-1 rounded-[16px] border border-[#E2E8F0] flex shadow-sm">
            <button 
              onClick={() => setActiveTab('rides')}
              className={cn(
                "px-5 py-2 text-sm font-bold rounded-[12px] transition-all",
                activeTab === 'rides' ? "bg-[#0F172A] text-white" : "text-[#64748B] hover:text-[#0F172A]"
              )}
            >
              Ride Offers
            </button>
            <button 
              onClick={() => setActiveTab('requests')}
              className={cn(
                "px-5 py-2 text-sm font-bold rounded-[12px] transition-all",
                activeTab === 'requests' ? "bg-[#0F172A] text-white" : "text-[#64748B] hover:text-[#0F172A]"
              )}
            >
              Requests
            </button>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {activeTab === 'rides' ? (
            rides.map((ride, idx) => (
              <RideCard key={ride.id} ride={ride} index={idx} onClick={() => onSelectRide(ride.id, 'ride')} />
            ))
          ) : (
            requests.map((request, idx) => (
              <RequestCard key={request.id} request={request} index={idx} onClick={() => onSelectRide(request.id, 'request')} />
            ))
          )}
        </AnimatePresence>

        {((activeTab === 'rides' && rides.length === 0) || (activeTab === 'requests' && requests.length === 0)) && (
          <div className="col-span-full py-20 text-center bg-white rounded-[2rem] border border-dashed border-[#CBD5E1]">
            <div className="w-16 h-16 bg-[#F8FAFC] rounded-full flex items-center justify-center mx-auto mb-4 text-[#94A3B8]">
              {activeTab === 'rides' ? <Car size={32} /> : <User size={32} />}
            </div>
            <h3 className="text-lg font-bold text-[#0F172A]">No active {activeTab}</h3>
            <p className="text-[#64748B] max-w-xs mx-auto mt-2">Check back later or be the first to create one!</p>
          </div>
        )}
      </div>
    </div>
  );
};

const RideCard: React.FC<{ ride: Ride, index: number, onClick: () => void }> = ({ ride, index, onClick }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className="card group hover:shadow-xl hover:border-[#EEF2FF] cursor-pointer"
    >
      <div className="flex justify-between mb-4">
        <span className="badge badge-indigo">Offer</span>
        <span className="font-bold text-[#4F46E5]">Rs{ride.price.toFixed(2)}</span>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex flex-col items-center gap-1 pt-1 opacity-50">
          <div className="w-2.5 h-2.5 border-2 border-[#4F46E5] rounded-full" />
          <div className="w-[2px] h-8 bg-[#E2E8F0]" />
          <div className="w-2.5 h-2.5 bg-[#0F172A] rounded-[2px]" />
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="font-semibold text-[0.9rem] text-[#0F172A] truncate">{ride.origin}</div>
          <div className="text-[0.8rem] text-[#64748B] mb-4 truncate italic">Departure {formatDate(ride.departureTime)}</div>
          <div className="font-semibold text-[0.9rem] text-[#0F172A] truncate">{ride.destination}</div>
          <div className="text-[0.8rem] text-[#64748B] truncate italic">Expected arrival soon</div>
        </div>
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-[#F1F5F9]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#F1F5F9] flex items-center justify-center font-bold text-[#64748B] text-[0.75rem]">
            {ride.driverId.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="text-[0.85rem] font-bold text-[#0F172A] leading-none">Student Driver</span>
            <div className="flex items-center gap-1 mt-0.5">
              <CheckCircle size={10} className={cn("transition-colors", ride.isDriverVerified ? "text-[#10B981] fill-[#10B981]/10" : "text-slate-300")} />
              <span className={cn("text-[9px] font-bold uppercase tracking-wider", ride.isDriverVerified ? "text-[#10B981]" : "text-slate-400")}>
                {ride.isDriverVerified ? 'Protocol Verified' : 'Community User'}
              </span>
            </div>
          </div>
        </div>
        <div className="badge badge-slate">
          {ride.availableSeats} of {ride.seats}
        </div>
      </div>
    </motion.div>
  );
};

const RequestCard: React.FC<{ request: PassengerRequest, index: number, onClick: () => void }> = ({ request, index, onClick }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className="card group hover:shadow-xl hover:border-[#EEF2FF] cursor-pointer"
    >
      <div className="flex justify-between mb-4">
        <span className="badge badge-slate">Request</span>
        <span className="text-[0.75rem] font-bold text-[#64748B] uppercase tracking-tighter flex items-center gap-1">
          <Users size={12} /> {(request.acceptedIds?.length || 0) + 1} Pooled
        </span>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex flex-col items-center gap-1 pt-1 opacity-50">
          <div className="w-2.5 h-2.5 border-2 border-[#64748B] rounded-full" />
          <div className="w-[2px] h-8 bg-[#E2E8F0]" />
          <div className="w-2.5 h-2.5 bg-[#0F172A] rounded-[2px]" />
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="font-semibold text-[0.9rem] text-[#0F172A] truncate">{request.origin}</div>
          <div className="text-[0.8rem] text-[#64748B] mb-4 truncate italic">Needed by {formatDate(request.preferredTime)}</div>
          <div className="font-semibold text-[0.9rem] text-[#0F172A] truncate">{request.destination}</div>
          <div className="text-[0.8rem] text-[#64748B] truncate italic">Group travel</div>
        </div>
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-[#F1F5F9]">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 rounded-full bg-[#F1F5F9] flex items-center justify-center font-bold text-[#64748B] text-[0.75rem]">
            {request.ownerId.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="text-[0.85rem] font-bold text-[#0F172A] leading-none">Student Pooler</span>
            <div className="flex items-center gap-1 mt-0.5">
              <CheckCircle size={10} className={cn("transition-colors", request.isOwnerVerified ? "text-[#10B981] fill-[#10B981]/10" : "text-slate-300")} />
              <span className={cn("text-[9px] font-bold uppercase tracking-wider", request.isOwnerVerified ? "text-[#10B981]" : "text-slate-400")}>
                {request.isOwnerVerified ? 'Protocol Verified' : 'Community User'}
              </span>
            </div>
          </div>
        </div>
        <div className={cn("badge", (request.joinerIds?.length || 0) > 0 ? "badge-indigo" : "badge-slate")}>
          {request.joinerIds?.length || 0} Applicants
        </div>
      </div>
    </motion.div>
  );
};
