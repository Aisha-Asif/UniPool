import React, { useEffect, useState } from 'react';
import { Sparkles, MapPin, Shield, MessageCircle, RefreshCw } from 'lucide-react';
import { getRideSuggestions, RideSuggestion } from '../services/geminiService';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface AIInsightsProps {
  origin: string;
  destination: string;
  type: 'ride' | 'request';
}

export const AIInsights: React.FC<AIInsightsProps> = ({ origin, destination, type }) => {
  const [suggestions, setSuggestions] = useState<RideSuggestion | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchSuggestions = async () => {
    setLoading(true);
    const data = await getRideSuggestions(origin, destination, type);
    setSuggestions(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchSuggestions();
  }, [origin, destination, type]);

  if (loading) {
    return (
      <div className="bg-indigo-50/50 border border-indigo-100 rounded-[2rem] p-8 animate-pulse">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 bg-indigo-200 rounded-full" />
          <div className="h-4 w-32 bg-indigo-200 rounded" />
        </div>
        <div className="space-y-3">
          <div className="h-3 w-full bg-indigo-100 rounded" />
          <div className="h-3 w-3/4 bg-indigo-100 rounded" />
        </div>
      </div>
    );
  }

  if (!suggestions) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-[2rem] p-8 shadow-sm relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <Sparkles size={120} className="text-indigo-600" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2 px-3 py-1 bg-indigo-600 rounded-full text-white">
            <Sparkles size={14} className="fill-white" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Co-pilot Insights</span>
          </div>
          <button 
            onClick={fetchSuggestions}
            className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 flex items-center gap-2">
              <MapPin size={12} /> Proposed Pathway
            </h4>
            <div className="relative pl-6 space-y-4">
              <div className="absolute left-[7px] top-2 bottom-2 w-0.5 border-l-2 border-dashed border-indigo-100" />
              
              <div className="relative">
                <div className="absolute -left-[23px] top-1 w-3 h-3 rounded-full border-2 border-indigo-600 bg-white" />
                <p className="text-[10px] font-bold text-indigo-600 uppercase">Start</p>
                <p className="text-xs font-bold text-slate-800">{origin}</p>
              </div>

              {suggestions.possibleStops.map((stop, i) => (
                <div key={i} className="relative">
                  <div className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-indigo-300" />
                  <p className="text-xs font-semibold text-slate-600">{stop}</p>
                </div>
              ))}

              <div className="relative">
                <div className="absolute -left-[23px] top-1 w-3 h-3 rounded-full bg-slate-900" />
                <p className="text-[10px] font-bold text-slate-900 uppercase">End</p>
                <p className="text-xs font-bold text-slate-800">{destination}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Sparkles size={12} className="text-indigo-400" /> Smart Coordination
            </h4>
            <div className="grid gap-2">
              {suggestions.points.map((point, i) => (
                <div key={i} className="flex items-start gap-2 p-3 bg-white/60 rounded-xl text-xs font-semibold text-slate-700 border border-white">
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full mt-1.5 shrink-0" />
                  {point}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 flex items-center gap-2">
              <Shield size={12} /> Safety Alert
            </h4>
            <p className="text-xs font-medium text-slate-600 leading-relaxed italic">
              "{suggestions.safetyTip}"
            </p>
          </div>

          <div className="p-4 bg-indigo-600/5 border border-indigo-600/10 rounded-2xl">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 flex items-center gap-2 mb-3">
              <MessageCircle size={12} /> Chat Starter
            </h4>
            <p className="text-sm font-bold text-slate-800 leading-relaxed">
              {suggestions.coordinationMessage}
            </p>
            <button 
               onClick={() => {
                 navigator.clipboard.writeText(suggestions.coordinationMessage);
                 alert("Copied to clipboard! Paste it in the Tribe Chat.");
               }}
               className="mt-3 text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-1"
            >
              Copy Template
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
