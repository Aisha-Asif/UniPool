import React, { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { Ride, PassengerRequest } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Car, User, Clock, Users, Edit3, Trash2, ChevronRight } from 'lucide-react';
import { cn, formatDate } from '../lib/utils';

interface MyRidesProps {
  onSelectRide: (id: string, type: 'ride' | 'request') => void;
  onEditRide: (id: string, type: 'ride' | 'request') => void;
}

export const MyRides: React.FC<MyRidesProps> = ({ onSelectRide, onEditRide }) => {
  const { user } = useAuth();
  const [createdRides, setCreatedRides] = useState<Ride[]>([]);
  const [joinedRides, setJoinedRides] = useState<Ride[]>([]);
  const [createdRequests, setCreatedRequests] = useState<PassengerRequest[]>([]);
  const [joinedRequests, setJoinedRequests] = useState<PassengerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'created' | 'joined'>('created');

  useEffect(() => {
    if (!user) return;

    // Created Rides
    const qCreatedRides = query(
      collection(db, 'rides'),
      where('driverId', '==', user.uid),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    );

    // Joined Rides
    const qJoinedRides = query(
      collection(db, 'rides'),
      where('passengerIds', 'array-contains', user.uid),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    );

    // Created Requests
    const qCreatedRequests = query(
      collection(db, 'passenger_requests'),
      where('ownerId', '==', user.uid),
      where('status', '==', 'seeking'),
      orderBy('createdAt', 'desc')
    );

    // Joined Requests (Pools)
    const qJoinedRequests = query(
      collection(db, 'passenger_requests'),
      where('acceptedIds', 'array-contains', user.uid),
      where('status', '==', 'seeking'),
      orderBy('createdAt', 'desc')
    );

    const unsubCreatedRides = onSnapshot(qCreatedRides, (snap) => {
      setCreatedRides(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ride)));
    });

    const unsubJoinedRides = onSnapshot(qJoinedRides, (snap) => {
      setJoinedRides(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ride)));
    });

    const unsubCreatedReqs = onSnapshot(qCreatedRequests, (snap) => {
      setCreatedRequests(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as PassengerRequest)));
    });

    const unsubJoinedReqs = onSnapshot(qJoinedRequests, (snap) => {
      setJoinedRequests(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as PassengerRequest)));
      setLoading(false);
    });

    return () => {
      unsubCreatedRides();
      unsubJoinedRides();
      unsubCreatedReqs();
      unsubJoinedReqs();
    };
  }, [user]);

  if (loading) return <div className="text-center py-20 text-slate-400 font-bold uppercase tracking-widest text-xs">Loading your trips...</div>;

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tighter text-[#0F172A] leading-none text-center md:text-left">Personal Fleet</h2>
          <p className="text-[#64748B] mt-4 font-medium text-center md:text-left">Manage your active offers and joined pools.</p>
        </div>
        
        <div className="flex items-center justify-center gap-3">
          <div className="bg-white p-1 rounded-[16px] border border-[#E2E8F0] flex shadow-sm">
            <button 
              onClick={() => setActiveTab('created')}
              className={cn(
                "px-5 py-2 text-sm font-bold rounded-[12px] transition-all",
                activeTab === 'created' ? "bg-[#0F172A] text-white" : "text-[#64748B] hover:text-[#0F172A]"
              )}
            >
              Created by Me
            </button>
            <button 
              onClick={() => setActiveTab('joined')}
              className={cn(
                "px-5 py-2 text-sm font-bold rounded-[12px] transition-all",
                activeTab === 'joined' ? "bg-[#0F172A] text-white" : "text-[#64748B] hover:text-[#0F172A]"
              )}
            >
              Joined by Me
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-16">
        {/* RIDES SECTION */}
        <section>
          <div className="flex items-center gap-4 mb-8">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
              <Car size={20} />
            </div>
            <h3 className="text-xl font-extrabold text-[#0F172A]">Ride Offers</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(activeTab === 'created' ? createdRides : joinedRides).map((ride) => (
              <div key={ride.id} className="relative group">
                <div 
                  onClick={() => onSelectRide(ride.id, 'ride')}
                  className="card p-6 bg-white border border-slate-100 hover:border-indigo-100 transition-all cursor-pointer h-full"
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className="badge badge-indigo">Active Offer</span>
                    <span className="font-bold text-indigo-600">Rs{ride.price}</span>
                  </div>
                  <div className="flex flex-col gap-3 mb-6">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">From</p>
                      <p className="font-bold text-slate-900 truncate">{ride.origin}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">To</p>
                      <p className="font-bold text-slate-900 truncate">{ride.destination}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-4 border-t border-slate-50">
                    <Clock size={12} />
                    {formatDate(ride.departureTime)}
                  </div>
                </div>

                {activeTab === 'created' && (
                  <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onEditRide(ride.id, 'ride'); }}
                      className="p-2 bg-white/90 backdrop-blur shadow-sm border border-slate-100 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-white transition-all"
                    >
                      <Edit3 size={16} />
                    </button>
                  </div>
                )}
              </div>
            ))}
            {(activeTab === 'created' ? createdRides : joinedRides).length === 0 && (
              <div className="col-span-full py-12 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                <p className="text-slate-400 font-bold text-sm tracking-tight">No ride offers here yet.</p>
              </div>
            )}
          </div>
        </section>

        {/* REQUESTS SECTION */}
        <section>
          <div className="flex items-center gap-4 mb-8">
            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-600">
              <User size={20} />
            </div>
            <h3 className="text-xl font-extrabold text-[#0F172A]">Passenger Requests</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(activeTab === 'created' ? createdRequests : joinedRequests).map((request) => (
              <div key={request.id} className="relative group">
                <div 
                  onClick={() => onSelectRide(request.id, 'request')}
                  className="card p-6 bg-white border border-slate-100 hover:border-slate-200 transition-all cursor-pointer h-full"
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className="badge badge-slate">Seeking Pool</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Users size={12} /> {request.acceptedIds?.length || 0} pooled
                    </span>
                  </div>
                  <div className="flex flex-col gap-3 mb-6">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">From</p>
                      <p className="font-bold text-slate-900 truncate">{request.origin}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">To</p>
                      <p className="font-bold text-slate-900 truncate">{request.destination}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-4 border-t border-slate-50">
                    <Clock size={12} />
                    {formatDate(request.preferredTime)}
                  </div>
                </div>

                {activeTab === 'created' && (
                  <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onEditRide(request.id, 'request'); }}
                      className="p-2 bg-white/90 backdrop-blur shadow-sm border border-slate-100 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-white transition-all"
                    >
                      <Edit3 size={16} />
                    </button>
                  </div>
                )}
              </div>
            ))}
            {(activeTab === 'created' ? createdRequests : joinedRequests).length === 0 && (
              <div className="col-span-full py-12 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                <p className="text-slate-400 font-bold text-sm tracking-tight">No passenger requests here yet.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
