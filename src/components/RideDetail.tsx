import React, { useEffect, useState, useRef } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  doc, onSnapshot, updateDoc, arrayUnion, arrayRemove, 
  collection, query, orderBy, addDoc, serverTimestamp, 
  writeBatch, getDoc 
} from 'firebase/firestore';
import { Ride, PassengerRequest, Message, UserProfile } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, Send, Users, MapPin, Clock, Banknote, 
  ShieldCheck, AlertCircle, CheckCircle2, XCircle, Star, MessageSquare,
  Edit3
} from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { AIInsights } from './AIInsights';

interface RideDetailProps {
  id: string;
  type: 'ride' | 'request';
  onBack: () => void;
  onEdit?: (id: string, type: 'ride' | 'request') => void;
}

export const RideDetail: React.FC<RideDetailProps> = ({ id, type, onBack, onEdit }) => {
  const { user, profile } = useAuth();
  const [data, setData] = useState<Ride | PassengerRequest | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [driverProfile, setDriverProfile] = useState<UserProfile | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubDoc = onSnapshot(doc(db, type === 'ride' ? 'rides' : 'passenger_requests', id), async (snap) => {
      if (snap.exists()) {
        const docData = { id: snap.id, ...snap.data() } as any;
        setData(docData);
        
        // Fetch driver/owner profile
        const ownerId = type === 'ride' ? docData.driverId : docData.ownerId;
        const ownerSnap = await getDoc(doc(db, 'users', ownerId));
        if (ownerSnap.exists()) {
          setDriverProfile({ uid: ownerSnap.id, ...ownerSnap.data() } as UserProfile);
        }
      }
      setLoading(false);
    });

    const unsubMsg = onSnapshot(
      query(collection(db, type === 'ride' ? 'rides' : 'passenger_requests', id, 'messages'), orderBy('timestamp', 'asc')),
      (snap) => {
        setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as Message)));
      }
    );

    return () => {
      unsubDoc();
      unsubMsg();
    };
  }, [id, type]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;
    try {
      await addDoc(collection(db, type === 'ride' ? 'rides' : 'passenger_requests', id, 'messages'), {
        senderId: user.uid,
        rideId: id,
        content: newMessage.trim(),
        timestamp: serverTimestamp()
      });
      setNewMessage('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'messages');
    }
  };

  const handleJoinLeave = async () => {
    if (!user || !data || type !== 'ride') return;
    const ride = data as Ride;
    const isPassenger = (ride.passengerIds || []).includes(user.uid);
    const isRequested = (ride.requestedPassengerIds || []).includes(user.uid);

    try {
      if (isPassenger) {
        await updateDoc(doc(db, 'rides', id), {
          passengerIds: arrayRemove(user.uid),
          availableSeats: ride.availableSeats + 1
        });
      } else if (isRequested) {
        await updateDoc(doc(db, 'rides', id), {
          requestedPassengerIds: arrayRemove(user.uid)
        });
      } else {
        if (ride.availableSeats <= 0) throw new Error("No seats available");
        await updateDoc(doc(db, 'rides', id), {
          requestedPassengerIds: arrayUnion(user.uid)
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'rides');
    }
  };

  const handleRideAction = async (action: 'approve' | 'reject', targetUid: string) => {
    if (!user || !data || type !== 'ride') return;
    const ride = data as Ride;
    if (ride.driverId !== user.uid) return;

    try {
      const docRef = doc(db, 'rides', id);
      if (action === 'approve') {
        if (ride.availableSeats <= 0) throw new Error("No seats available");
        await updateDoc(docRef, { 
          requestedPassengerIds: arrayRemove(targetUid),
          passengerIds: arrayUnion(targetUid),
          availableSeats: ride.availableSeats - 1
        });
      } else if (action === 'reject') {
        await updateDoc(docRef, { requestedPassengerIds: arrayRemove(targetUid) });
      }
    } catch (error) {
       handleFirestoreError(error, OperationType.UPDATE, 'rides');
    }
  };

  const handlePoolAction = async (action: 'join' | 'approve' | 'reject' | 'leave', targetUid?: string) => {
    if (!user || !data || type !== 'request') return;
    const req = data as PassengerRequest;
    
    try {
      const docRef = doc(db, 'passenger_requests', id);
      if (action === 'join') {
        await updateDoc(docRef, { joinerIds: arrayUnion(user.uid) });
      } else if (action === 'leave') {
        const isAccepted = (req.acceptedIds || []).includes(user.uid);
        if (isAccepted) {
          await updateDoc(docRef, { acceptedIds: arrayRemove(user.uid) });
        } else {
          await updateDoc(docRef, { joinerIds: arrayRemove(user.uid) });
        }
      } else if (action === 'approve' && targetUid) {
        await updateDoc(docRef, { 
          joinerIds: arrayRemove(targetUid),
          acceptedIds: arrayUnion(targetUid)
        });
      } else if (action === 'reject' && targetUid) {
        await updateDoc(docRef, { joinerIds: arrayRemove(targetUid) });
      }
    } catch (error) {
       handleFirestoreError(error, OperationType.UPDATE, 'passenger_requests');
    }
  };

  const handleCompleteRide = async () => {
    if (!user || !data || type !== 'ride') return;
    const ride = data as Ride;
    
    try {
      const batch = writeBatch(db);
      const rideRef = doc(db, 'rides', id);
      
      // 1. Mark completed
      batch.update(rideRef, { status: 'completed' });
      
      // 2. Increment driver count
      const driverRef = doc(db, 'users', ride.driverId);
      const driverSnap = await getDoc(driverRef);
      if (driverSnap.exists()) {
        batch.update(driverRef, { rideCount: (driverSnap.data().rideCount || 0) + 1 });
      }

      // 3. Increment passenger counts
      for (const pId of ride.passengerIds) {
        const pRef = doc(db, 'users', pId);
        const pSnap = await getDoc(pRef);
        if (pSnap.exists()) {
          batch.update(pRef, { rideCount: (pSnap.data().rideCount || 0) + 1 });
        }
      }

      await batch.commit();
      onBack();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'rides');
    }
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleCancelRide = async () => {
    try {
      const collectionName = type === 'ride' ? 'rides' : 'passenger_requests';
      await updateDoc(doc(db, collectionName, id), {
        status: 'cancelled',
        cancelledBy: user?.uid
      });
      onBack();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, type === 'ride' ? 'rides' : 'passenger_requests');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!data) return <div>Ride not found</div>;

  const isOwner = type === 'ride' ? (data as Ride).driverId === user?.uid : (data as PassengerRequest).ownerId === user?.uid;
  const isParticipant = type === 'ride' 
    ? ((data as Ride).passengerIds || []).includes(user?.uid || '') || ((data as Ride).requestedPassengerIds || []).includes(user?.uid || '') || isOwner
    : ((data as PassengerRequest).acceptedIds || []).includes(user?.uid || '') || ((data as PassengerRequest).joinerIds || []).includes(user?.uid || '') || isOwner;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
      {/* Left: Details */}
      <div className="lg:col-span-2 space-y-6">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold text-xs uppercase tracking-widest mb-4">
          <ChevronLeft size={16} /> Dashboard
        </button>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden relative">
          {data.status !== 'active' && data.status !== 'seeking' && (
             <div className={cn(
               "absolute top-6 right-6 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest",
               data.status === 'completed' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-600 border border-rose-100"
             )}>
               {data.status}
             </div>
          )}

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 text-2xl font-black">
                {driverProfile?.username?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-slate-900">@{driverProfile?.username}</h3>
                  {driverProfile?.isVerified && (
                    <CheckCircle2 size={16} className="text-emerald-500 fill-emerald-50" />
                  )}
                </div>
                <p className="text-slate-500 text-sm">
                  {type === 'ride' ? 'Driver' : 'Group Leader'} • {driverProfile?.rideCount} rides completed
                  {driverProfile?.isVerified ? ' • Verified Student' : ' • Community User'}
                </p>
              </div>
            </div>
            
            {type === 'ride' && (
               <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Total Fee</p>
                  <p className="text-3xl font-black text-slate-900">Rs{(data as Ride).price}</p>
               </div>
            )}
          </div>

          <div className="space-y-8">
            <div className="flex gap-6">
               <div className="flex flex-col items-center gap-2 pt-1">
                  <div className="w-5 h-5 rounded-full border-2 border-indigo-600 p-1 flex items-center justify-center">
                     <div className="w-full h-full bg-indigo-600 rounded-full" />
                  </div>
                  <div className="w-0.5 h-full bg-indigo-50 border-r-2 border-dashed border-indigo-100" />
                  <div className="w-5 h-5 rounded-full border-2 border-slate-200" />
               </div>
               <div className="flex-1 space-y-8">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Departure</p>
                    <p className="text-lg font-bold text-slate-900 leading-tight mt-1">{data.origin}</p>
                    <div className="flex items-center gap-2 text-slate-500 text-sm mt-2 font-medium">
                      <Clock size={16} />
                      {formatDate(type === 'ride' ? (data as Ride).departureTime : (data as PassengerRequest).preferredTime)}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Destination</p>
                    <p className="text-lg font-bold text-slate-900 leading-tight mt-1">{data.destination}</p>
                  </div>
               </div>
            </div>

            {type === 'ride' && (
              <div className="flex items-center gap-8 pt-4 border-t border-slate-50">
                 <div>
                   <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Vehicle</p>
                   <p className="font-bold text-slate-900">{(data as Ride).vehicle}</p>
                 </div>
                 <div>
                   <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Availability</p>
                   <p className={cn("font-bold", (data as Ride).availableSeats === 0 ? "text-rose-500" : "text-emerald-600")}>
                    {(data as Ride).availableSeats} seats left
                   </p>
                 </div>
              </div>
            )}
          </div>

          <div className="mt-12 flex flex-wrap gap-4">
            {type === 'ride' && data.status === 'active' && !isOwner && (
              <button 
                onClick={handleJoinLeave}
                className={cn(
                  "flex-1 md:flex-none px-10 py-5 rounded-2xl font-bold transition-all flex items-center justify-center gap-2",
                  ((data as Ride).passengerIds || []).includes(user?.uid || '') || ((data as Ride).requestedPassengerIds || []).includes(user?.uid || '')
                    ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
                    : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-100"
                )}
              >
                {((data as Ride).passengerIds || []).includes(user?.uid || '') 
                  ? 'Leave Ride' 
                  : ((data as Ride).requestedPassengerIds || []).includes(user?.uid || '')
                    ? 'Cancel Request'
                    : 'Join Ride'}
              </button>
            )}

            {type === 'request' && (data as PassengerRequest).status === 'seeking' && !isOwner && (
              <button 
                onClick={() => {
                  const isParticipant = ((data as PassengerRequest).joinerIds || []).includes(user?.uid || '') || ((data as PassengerRequest).acceptedIds || []).includes(user?.uid || '');
                  handlePoolAction(isParticipant ? 'leave' : 'join');
                }}
                className={cn(
                  "flex-1 md:flex-none px-10 py-5 rounded-2xl font-bold transition-all flex items-center justify-center gap-2",
                  ((data as PassengerRequest).joinerIds || []).includes(user?.uid || '') || ((data as PassengerRequest).acceptedIds || []).includes(user?.uid || '')
                    ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
                    : "bg-slate-900 text-white hover:bg-slate-800"
                )}
              >
                {((data as PassengerRequest).acceptedIds || []).includes(user?.uid || '') 
                  ? 'Leave Pool' 
                  : ((data as PassengerRequest).joinerIds || []).includes(user?.uid || '') 
                    ? 'Cancel Request' 
                    : 'Join Pool'}
              </button>
            )}

            {isOwner && (data.status === 'active' || data.status === 'seeking') && (
              <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                {onEdit && (
                  <button 
                    onClick={() => onEdit(id, type)}
                    className="px-8 py-5 rounded-2xl font-bold bg-[#0F172A] text-white hover:bg-slate-800 shadow-xl shadow-slate-200 transition-all flex-1 md:flex-none flex items-center justify-center gap-2"
                  >
                    <Edit3 size={18} />
                    Edit Details
                  </button>
                )}
                {!showDeleteConfirm ? (
                  <button 
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-8 py-5 rounded-2xl font-bold bg-white text-slate-400 border border-slate-100 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all flex-1 md:flex-none"
                  >
                    Delete Ride
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button 
                      onClick={handleCancelRide}
                      className="px-6 py-5 rounded-2xl font-bold bg-rose-600 text-white hover:bg-rose-700 transition-all flex items-center gap-2"
                    >
                      Confirm Delete
                    </button>
                    <button 
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-4 py-5 rounded-2xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                )}
                {type === 'ride' && (
                  <button 
                    onClick={handleCompleteRide}
                    className="flex-1 px-8 py-5 rounded-2xl font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-xl shadow-emerald-100 transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={18} />
                    Complete Journey
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <AIInsights 
          origin={data.origin} 
          destination={data.destination} 
          type={type} 
        />

        {/* Requests Management for Driver or Pool Leader */}
        {type === 'ride' && isOwner && ((data as Ride).requestedPassengerIds?.length || 0) > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 rounded-[2rem] border border-indigo-100 bg-indigo-50/10"
          >
            <h4 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Users size={16} className="text-indigo-600" />
              Ride Requests
            </h4>
            <div className="space-y-3">
              {((data as Ride).requestedPassengerIds || []).map(uid => (
                <div key={uid} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-indigo-50 shadow-sm">
                   <span className="text-sm font-bold text-slate-700 underline decoration-indigo-200 underline-offset-4">UID: {uid.slice(0, 8)}...</span>
                   <div className="flex gap-2">
                      <button onClick={() => handleRideAction('reject', uid)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                        <XCircle size={20} />
                      </button>
                      <button onClick={() => handleRideAction('approve', uid)} className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all">
                        <CheckCircle2 size={20} />
                      </button>
                   </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {type === 'request' && isOwner && ((data as PassengerRequest).joinerIds?.length || 0) > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 rounded-[2rem] border border-indigo-100 bg-indigo-50/10"
          >
            <h4 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Users size={16} className="text-indigo-600" />
              Incoming Requests
            </h4>
            <div className="space-y-3">
              {((data as PassengerRequest).joinerIds || []).map(uid => (
                <div key={uid} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-indigo-50 shadow-sm">
                   <span className="text-sm font-bold text-slate-700 underline decoration-indigo-200 underline-offset-4">UID: {uid.slice(0, 8)}...</span>
                   <div className="flex gap-2">
                      <button onClick={() => handlePoolAction('reject', uid)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                        <XCircle size={20} />
                      </button>
                      <button onClick={() => handlePoolAction('approve', uid)} className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all">
                        <CheckCircle2 size={20} />
                      </button>
                   </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Right: Chat */}
      <div className="h-[calc(100vh-12rem)] flex flex-col bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden sticky top-24">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
           <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare size={18} className="text-indigo-600" />
              Tribe Chat
           </h4>
           <div className="px-2 py-1 bg-slate-50 rounded-lg text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
             {isParticipant ? 'Live' : 'Read Only'}
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
           {messages.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center opacity-30 text-center px-6">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <Send size={24} />
                </div>
                <p className="text-xs font-bold leading-relaxed">Safety first. Coordination second.<br/>Say hi to your group!</p>
             </div>
           ) : (
             messages.map((m, i) => {
               const isMe = m.senderId === user?.uid;
               return (
                 <div key={m.id} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                    <div className={cn(
                      "max-w-[85%] px-4 py-3 rounded-2xl text-sm font-medium",
                      isMe ? "bg-indigo-600 text-white rounded-tr-none" : "bg-slate-100 text-slate-700 rounded-tl-none"
                    )}>
                      {m.content}
                    </div>
                    <span className="text-[9px] font-bold text-slate-300 mt-1 uppercase tracking-widest">
                      {isMe ? 'You' : m.senderId.slice(0, 4)} • {m.timestamp ? new Date(m.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                    </span>
                 </div>
               );
             })
           )}
           <div ref={chatEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="p-6 pt-0">
          <div className="relative">
            <input
              type="text"
              disabled={!isParticipant || data.status !== 'active' && data.status !== 'seeking'}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={isParticipant ? "Type your message..." : "Only participants can chat"}
              className="w-full pl-5 pr-14 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-sm"
            />
            <button 
              type="submit" 
              disabled={!isParticipant || !newMessage.trim()}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center disabled:opacity-30 transition-all hover:bg-indigo-700"
            >
              <Send size={16} />
            </button>
          </div>
        </form>
      </div>


    </div>
  );
};
