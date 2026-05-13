import React, { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy, onSnapshot } from 'firebase/firestore';
import { Ride, PassengerRequest } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';
import { History, ChevronRight, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { cn, formatDate } from '../lib/utils';

interface RideHistoryProps {
  onSelectRide: (id: string, type: 'ride' | 'request') => void;
}

export const RideHistory: React.FC<RideHistoryProps> = ({ onSelectRide }) => {
  const { user } = useAuth();
  const [history, setHistory] = useState<(Ride | PassengerRequest)[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Fetch both rides and requests that are not active/seeking
    const qRides = query(
      collection(db, 'rides'),
      where('status', '!=', 'active'),
      orderBy('status'),
      orderBy('createdAt', 'desc')
    );

    const qRequests = query(
      collection(db, 'passenger_requests'),
      where('status', '!=', 'seeking'),
      orderBy('status'),
      orderBy('createdAt', 'desc')
    );

    const unsubRides = onSnapshot(qRides, (snap) => {
      const rides = snap.docs.map(d => ({ id: d.id, ...d.data(), _type: 'ride' } as any));
      updateHistory(rides, 'rides');
    });

    const unsubReqs = onSnapshot(qRequests, (snap) => {
      const reqs = snap.docs.map(d => ({ id: d.id, ...d.data(), _type: 'request' } as any));
      updateHistory(reqs, 'requests');
    });

    let currentRides: any[] = [];
    let currentReqs: any[] = [];

    const updateHistory = (data: any[], source: 'rides' | 'requests') => {
      if (source === 'rides') currentRides = data;
      else currentReqs = data;

      const combined = [...currentRides, ...currentReqs]
        .filter(item => {
          if (item._type === 'ride') {
            return item.driverId === user.uid || (item.passengerIds || []).includes(user.uid);
          } else {
            return item.ownerId === user.uid || (item.acceptedIds || []).includes(user.uid);
          }
        })
        .sort((a, b) => {
          const timeA = a.createdAt?.toDate?.()?.getTime() || 0;
          const timeB = b.createdAt?.toDate?.()?.getTime() || 0;
          return timeB - timeA;
        });

      setHistory(combined);
      setLoading(false);
    };

    return () => {
      unsubRides();
      unsubReqs();
    };
  }, [user]);

  if (loading) return <div className="text-center py-20 text-slate-400">Loading history...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Ride History</h2>
        <p className="text-slate-500 mt-1">Review your past trips and transactions.</p>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        {history.length === 0 ? (
          <div className="p-20 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
              <History size={32} />
            </div>
            <p className="font-bold text-slate-900">No past activities</p>
            <p className="text-slate-500 text-sm mt-1">Your journey starts with your first ride share.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {history.map((item: any, idx) => (
              <div 
                key={item.id}
                onClick={() => onSelectRide(item.id, item._type)}
                className="group flex flex-col md:flex-row md:items-center justify-between p-6 hover:bg-slate-50/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center",
                    item.status === 'completed' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                  )}>
                    {item.status === 'completed' ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{item.origin} → {item.destination}</h4>
                    <div className="flex items-center gap-3 text-xs font-semibold text-slate-400 uppercase tracking-widest mt-1">
                      <Clock size={12} />
                      {formatDate(item._type === 'ride' ? item.departureTime : item.preferredTime)}
                    </div>
                    {item.status === 'cancelled' && item.cancelledBy === (item._type === 'ride' ? item.driverId : item.ownerId) && (
                      <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tight mt-1">Creator deleted ride</p>
                    )}
                  </div>
                </div>

                <div className="mt-4 md:mt-0 flex items-center gap-6">
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item._type === 'ride' ? 'Fee' : 'Pool'}</p>
                    <p className="font-bold text-slate-900">{item._type === 'ride' ? `Rs${item.price}` : 'Group'}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-300 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-all">
                    <ChevronRight size={18} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
