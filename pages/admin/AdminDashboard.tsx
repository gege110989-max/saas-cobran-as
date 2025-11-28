
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  Users, 
  Building2, 
  DollarSign,
  AlertCircle,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Moon
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import SystemHealth from '../../components/SystemHealth';

// Mock Data
const mrrGrowthData = [
  { name: 'Jan', value: 12500 },
  { name: 'Fev', value: 15200 },
  { name: 'Mar', value: 18900 },
  { name: 'Abr', value: 24500 },
  { name: 'Mai', value: 29800 },
  { name: 'Jun', value: 35000 },
];

const acquisitionData = [
  { name: 'Jan', new: 12, churn: 1 },
  { name: 'Fev', new: 15, churn: 2 },
  { name: 'Mar', new: 18, churn: 2 },
  { name: 'Abr', new: 25, churn: 1 },
  { name: 'Mai', new: 22, churn: 3 },
  { name: 'Jun', new: 30, churn: 2 },
];

const StatCard = ({ title, value, badge, badgeColor, subtext, icon: Icon, color, onClick }: any) => (
  <div 
    onClick={onClick}
    className={`bg-white p-6 rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 relative overflow-hidden group ${onClick ? 'cursor-pointer hover:border-indigo-200 transition-colors' : ''}`}
  >
    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-slate-50 to-slate-100 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
    <div className="relative z-10">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-lg ${color} bg-opacity-10`}>
          <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
        </div>
        {badge && (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${badgeColor}`}>
            {badge.includes('+') ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
            {badge}
          </span>
        )}
      </div>
      <div>
        <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{value}</h3>
        <p className="text-sm font-medium text-slate-500 uppercase tracking-wide mt-1">{title}</p>
        {subtext && <p className="text-xs text-slate-400 mt-2">{subtext}</p>}
      </div>
    </div>
  </div>
);

const AdminDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Visão Geral do Negócio</h2>
          <p className="text-slate-500">Acompanhe a saúde e o crescimento do Movicobrança SaaS.</p>
        </div>
        <div className="flex gap-2">
            <select className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg p-2.5 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm">
                <option>Últimos 30 dias</option>
                <option>Últimos 3 meses</option>
                <option>Este Ano</option>
            </select>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="MRR (Mensal)" 
          value="R$ 35.000" 
          badge="+15%" 
          badgeColor="bg-emerald-100 text-emerald-700"
          subtext="Receita Recorrente Mensal" 
          icon={DollarSign} 
          color="bg-emerald-500 text-emerald-600"
          onClick={() => navigate('/admin/finance')}
        />
        <StatCard 
          title="Empresas Ativas" 
          value="145" 
          badge="+12" 
          badgeColor="bg-indigo-100 text-indigo-700"
          subtext="Total de clientes pagantes" 
          icon={Building2} 
          color="bg-indigo-500 text-indigo-600"
          onClick={() => navigate('/admin/companies')}
        />
        <StatCard 
          title="Usuários Totais" 
          value="482" 
          badge="+24" 
          badgeColor="bg-blue-100 text-blue-700"
          subtext="Membros das equipes" 
          icon={Users} 
          color="bg-blue-500 text-blue-600"
          onClick={() => navigate('/admin/companies')}
        />
        <StatCard 
          title="Churn Rate" 
          value="2.1%" 
          badge="-0.5%" 
          badgeColor="bg-emerald-100 text-emerald-700"
          subtext="Cancelamentos no período" 
          icon={Activity} 
          color="bg-rose-500 text-rose-600"
          onClick={() => navigate('/admin/finance')}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* MRR Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            Crescimento de Receita (MRR)
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mrrGrowthData}>
                <defs>
                  <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value/1000}k`} />
                <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [`R$ ${value.toLocaleString()}`, 'MRR']}
                />
                <Area type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorMrr)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* System Health Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col h-full">
            <div className="flex-1">
                {/* Use the new SystemHealth component here or just the alerts if SystemHealth is large */}
                 <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-600" />
                    Alertas e Saúde
                </h3>
                <div className="space-y-4">
                    <div className="flex items-start gap-3 p-3 bg-rose-50 border border-rose-100 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-bold text-rose-800">API WhatsApp Instável</p>
                            <p className="text-xs text-rose-600 mt-1">3 empresas reportaram falha de token nas últimas 2h.</p>
                        </div>
                    </div>
                     <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                        <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-bold text-amber-800">Job CRON Atrasado</p>
                            <p className="text-xs text-amber-600 mt-1">Fila de processamento maior que o normal.</p>
                        </div>
                    </div>
                    
                    {/* Inactivity Alert */}
                    <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                        <Moon className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-bold text-slate-800">Inatividade Detectada</p>
                            <p className="text-xs text-slate-600 mt-1">
                                <strong>5 empresas</strong> sem login ou envio de cobrança há mais de 10 dias.
                            </p>
                            <button className="text-[10px] font-bold text-indigo-600 hover:underline mt-1">
                                Ver lista de risco
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-slate-100">
                <button 
                  onClick={() => navigate('/admin/activity')}
                  className="w-full py-2 text-sm text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg font-medium transition-colors"
                >
                    Ver Status Detalhado
                </button>
            </div>
        </div>
      </div>

      {/* System Health Grid */}
      <SystemHealth />

      {/* Advanced Metrics & Acquisition */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Acquisition Chart */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Aquisição vs Churn</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={acquisitionData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}/>
                <Legend />
                <Bar dataKey="new" name="Novos" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="churn" name="Cancelados" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-center">
                <p className="text-sm font-medium text-slate-500">ARPU (Ticket Médio)</p>
                <h4 className="text-2xl font-bold text-slate-900 mt-1">R$ 241,00</h4>
                <p className="text-xs text-emerald-600 mt-2 font-medium flex items-center"><ArrowUpRight className="w-3 h-3"/> +2.4% este mês</p>
            </div>
             <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-center">
                <p className="text-sm font-medium text-slate-500">LTV (Lifetime Value)</p>
                <h4 className="text-2xl font-bold text-slate-900 mt-1">R$ 3.250</h4>
                <p className="text-xs text-emerald-600 mt-2 font-medium flex items-center"><ArrowUpRight className="w-3 h-3"/> +5.1% este mês</p>
            </div>
             <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-center">
                <p className="text-sm font-medium text-slate-500">CAC Estimado</p>
                <h4 className="text-2xl font-bold text-slate-900 mt-1">R$ 580,00</h4>
                <p className="text-xs text-rose-600 mt-2 font-medium flex items-center"><ArrowDownRight className="w-3 h-3"/> -1.2% (Melhorou)</p>
            </div>
             <div className="col-span-full bg-indigo-900 p-6 rounded-xl text-white flex items-center justify-between relative overflow-hidden">
                <div className="relative z-10">
                    <h4 className="font-bold text-lg">Forecast (Previsão)</h4>
                    <p className="text-indigo-200 text-sm mt-1">Baseado no crescimento atual, atingiremos <strong className="text-white">R$ 50k MRR</strong> em 3 meses.</p>
                </div>
                <div className="relative z-10 bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                    <TrendingUp className="w-6 h-6 text-white" />
                </div>
                {/* Decoration */}
                <div className="absolute right-0 bottom-0 w-32 h-32 bg-indigo-600 rounded-full blur-3xl opacity-50 -mr-10 -mb-10"></div>
             </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
