import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
    label: string;
    value: string | number;
    icon: LucideIcon;
    color: string;
    sub?: string;
    trend?: string;
    trendUp?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, color, sub, trend, trendUp = true }) => {
    return (
        <div className="relative group p-6 sm:p-8 rounded-[5px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/5 hover:-translate-y-1 overflow-hidden">
            <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}-500/5 dark:bg-${color}-500/10 rounded-[5px] blur-3xl -mr-12 -mt-12 transition-all duration-700 group-hover:scale-150 group-hover:bg-${color}-500/10`} />
            <div className="flex justify-between items-start relative z-10">
                <div className={`p-4 rounded-2xl bg-${color}-50 dark:bg-${color}-900/20 text-${color}-600 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 ring-1 ring-${color}-100 dark:ring-${color}-800/30`}>
                    <Icon size={24} />
                </div>
                {trend && (
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${trendUp ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600'}`}>
                        {trendUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {trend}
                    </div>
                )}
            </div>
            <div className="mt-8 relative z-10">
                <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">{label}</p>
                <div className="flex items-end gap-3 mt-1.5">
                    <h3 className="text-3xl sm:text-4xl font-black text-slate-800 dark:text-white tracking-tighter tabular-nums leading-none">{value}</h3>
                    {sub && <span className="text-[10px] font-bold text-slate-400 uppercase pb-1 tracking-tight">{sub}</span>}
                </div>
            </div>
            
            {/* Bottom Accent Line Hover Effect */}
            <div className={`absolute bottom-0 left-0 right-0 h-1 bg-${color}-500/20 transition-all duration-500`}>
                <div className={`h-full w-full bg-${color}-500 origin-center scale-x-0 group-hover:scale-x-100 transition-transform duration-700 ease-out`} />
            </div>
        </div>
    );
};

export default StatCard;
