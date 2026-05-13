import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Car, MapPin, History, LogOut, User as UserIcon, Star } from 'lucide-react';
import { cn } from '../lib/utils';

interface NavbarProps {
  currentView: string;
  onViewChange: (view: any) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onViewChange }) => {
  const { profile, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Explore', icon: MapPin },
    { id: 'my-rides', label: 'My Trips', icon: Star },
    { id: 'offer', label: 'Offer Ride', icon: Car },
    { id: 'request', label: 'Request Ride', icon: UserIcon },
    { id: 'history', label: 'History', icon: History },
    { id: 'profile', label: 'Profile', icon: UserIcon },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-8">
            <div 
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => onViewChange('dashboard')}
            >
              <div className="w-8 h-8 bg-[#4F46E5] rounded-lg grid place-items-center">
                <Car size={20} className="text-white" />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-[#0F172A]">Uni Pool</span>
            </div>
            
            <div className="hidden md:flex gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    id={`nav-${item.id}`}
                    onClick={() => onViewChange(item.id)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-[12px] transition-all duration-200",
                      currentView === item.id 
                        ? "bg-[#EEF2FF] text-[#4F46E5]" 
                        : "text-[#64748B] hover:text-[#4F46E5] hover:bg-[#F1F5F9]"
                    )}
                  >
                    <Icon size={18} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end text-sm">
              <span className="font-semibold text-slate-900">@{profile?.username}</span>
              <div className="flex items-center gap-3 text-slate-500 text-xs">
                <span>{profile?.rideCount} rides</span>
              </div>
            </div>
            
            <button 
              id="logout-button"
              onClick={logout}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
