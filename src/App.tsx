import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthPage } from './components/AuthPage';
import { Dashboard } from './components/Dashboard';
import { Navbar } from './components/Navbar';
import { OfferRide } from './components/OfferRide';
import { RequestRide } from './components/RequestRide';
import { RideDetail } from './components/RideDetail';
import { RideHistory } from './components/RideHistory';
import { MyRides } from './components/MyRides';
import { ProfilePage } from './components/ProfilePage';
import { motion, AnimatePresence } from 'motion/react';

function AppContent() {
  const { user, profile, loading } = useAuth();
  const [view, setView] = useState<'dashboard' | 'offer' | 'request' | 'history' | 'detail' | 'my-rides' | 'profile'>('dashboard');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<'ride' | 'request'>('ride');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user || !profile) {
    return <AuthPage />;
  }

  const navigateToDetail = (id: string, type: 'ride' | 'request') => {
    setSelectedId(id);
    setSelectedType(type);
    setView('detail');
  };

  const navigateToEdit = (id: string, type: 'ride' | 'request') => {
    setSelectedId(id);
    setSelectedType(type);
    setView(type === 'ride' ? 'offer' : 'request');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <Navbar currentView={view} onViewChange={setView} />
      
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <AnimatePresence mode="wait">
          {view === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Dashboard onSelectRide={navigateToDetail} />
            </motion.div>
          )}

          {view === 'offer' && (
            <motion.div
              key="offer"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <OfferRide 
                rideId={selectedId && selectedType === 'ride' ? selectedId : undefined}
                onComplete={() => {
                  setSelectedId(null);
                  setView('dashboard');
                }} 
              />
            </motion.div>
          )}

          {view === 'request' && (
            <motion.div
              key="request"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <RequestRide 
                requestId={selectedId && selectedType === 'request' ? selectedId : undefined}
                onComplete={() => {
                  setSelectedId(null);
                  setView('dashboard');
                }} 
              />
            </motion.div>
          )}

          {view === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <RideHistory onSelectRide={navigateToDetail} />
            </motion.div>
          )}

          {view === 'my-rides' && (
            <motion.div
              key="my-rides"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <MyRides 
                onSelectRide={navigateToDetail} 
                onEditRide={navigateToEdit}
              />
            </motion.div>
          )}

          {view === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <ProfilePage />
            </motion.div>
          )}

          {view === 'detail' && selectedId && (
            <motion.div
              key="detail"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <RideDetail 
                id={selectedId} 
                type={selectedType} 
                onBack={() => setView('dashboard')} 
                onEdit={navigateToEdit}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
