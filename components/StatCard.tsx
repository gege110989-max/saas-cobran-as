import React from 'react';
import { LucideIcon, ArrowUpRight, ArrowDownRight, ChevronRight } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  badge?: string;
  badgeColor?: string;
  subtext?: string;
  trend?: 'up' | 'down' | string;
  icon: LucideIcon;
  color: string;
  onClick?: () => void;
}

const StatCard = ({ title, value, badge, badgeColor, subtext, trend, icon: Icon, color, onClick }: StatCardProps) => {
  // Extract color classes safely
  const bgClass = color.split(' ')[0] || 'bg-brand-500';
  const textClass = color.split(' ')[1] || 'text-white';
  // If only one class provided (old usage like 'bg-brand-500'), default text to white, else use provided text class
  const iconColorClass = color.includes(' ') ? textClass : 'text-white';

  return (
    <div 
      onClick={onClick}
      className={`bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-all relative group overflow-hidden ${onClick ? 'cursor-pointer hover:border-indigo-300' : ''}`}
    >
      {onClick && (
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-slate-50 to-slate-100 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110 -z-0"></div>
      )}

      {/* Navigation Indicator */}
      {onClick && (
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0 z-20">
              <div className="bg-white/80 backdrop-blur p-1.5 rounded-full shadow-sm border border-slate-100 text-indigo-600">
                  <ChevronRight className="w-4 h-4" />
              </div>
          </div>
      )}

      <div className="relative z-10">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">{title}</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-2">{value}</h3>
          </div>
          <div className={`p-3 rounded-lg ${bgClass} ${color.includes('bg-opacity-10') ? '' : 'bg-opacity-10 md:bg-opacity-100'} transition-transform group-hover:scale-105`}>
            {/* If using bg-opacity-10 style (admin), ensure text has color. If solid style (dashboard), ensure text is white */}
            <Icon className={`w-5 h-5 ${color.includes('bg-opacity') ? iconColorClass : 'text-white'}`} />
          </div>
        </div>
        
        <div className="mt-4 flex items-center gap-2">
          {badge ? (
             <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${badgeColor}`}>
                {badge.includes('+') ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                {badge}
             </span>
          ) : trend ? (
             <span className={`flex items-center text-xs font-medium px-2 py-1 rounded-full ${String(trend).includes('-') || trend === 'down' ? 'text-rose-600 bg-rose-50' : 'text-emerald-600 bg-emerald-50'}`}>
                {String(trend).includes('-') || trend === 'down' ? <ArrowDownRight className="w-3 h-3 mr-1" /> : <ArrowUpRight className="w-3 h-3 mr-1" />} 
                {trend === 'up' || trend === 'down' ? (trend === 'up' ? '+12.5%' : '-2.4%') : trend}
             </span>
          ) : null}
          <span className="text-xs text-slate-400">{subtext}</span>
        </div>
      </div>
    </div>
  );
};

export default StatCard;