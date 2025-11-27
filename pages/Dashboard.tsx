import React from 'react';
import { 
  DollarSign, 
  Users, 
  MessageCircle, 
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const data = [
  { name: 'Seg', value: 4000 },
  { name: 'Ter', value: 3000 },
  { name: 'Qua', value: 2000 },
  { name: 'Qui', value: 2780 },
  { name: 'Sex', value: 1890 },
  { name: 'Sab', value: 2390 },
  { name: 'Dom', value: 3490 },
];

const StatCard = ({ title, value, subtext, trend, icon: Icon, color }: any) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h3 className="text-2xl font-bold text-slate-900 mt-2">{value}</h3>
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
    </div>
    <div className="mt-4 flex items-center gap-2">
      {trend === 'up' ? (
        <span className="text-emerald-600 flex items-center text-xs font-medium bg-emerald-50 px-2 py-1 rounded-full">
          <ArrowUpRight className="w-3 h-3 mr-1" /> +12.5%
        </span>
      ) : (
        <span className="text-rose-600 flex items-center text-xs font-medium bg-rose-50 px-2 py-1 rounded-full">
          <ArrowDownRight className="w-3 h-3 mr-1" /> -2.4%
        </span>
      )}
      <span className="text-xs text-slate-400">{subtext}</span>
    </div>
  </div>
);

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Visão Geral</h2>
          <p className="text-slate-500">Acompanhe o desempenho das suas cobranças em tempo real.</p>
        </div>
        <div className="flex gap-2">
          <select className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg p-2.5 focus:ring-brand-500 focus:border-brand-500">
            <option>Últimos 7 dias</option>
            <option>Últimos 30 dias</option>
            <option>Este Mês</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Receita Recuperada" 
          value="R$ 48.250,00" 
          subtext="vs. semana anterior" 
          trend="up" 
          icon={DollarSign} 
          color="bg-emerald-500"
        />
        <StatCard 
          title="Cobranças Ativas" 
          value="1.240" 
          subtext="Faturas em aberto" 
          trend="up" 
          icon={Activity} 
          color="bg-brand-500"
        />
        <StatCard 
          title="Atendimentos IA" 
          value="856" 
          subtext="Resolvidos automaticamente" 
          trend="up" 
          icon={MessageCircle} 
          color="bg-indigo-500"
        />
        <StatCard 
          title="Taxa de Inadimplência" 
          value="4.2%" 
          subtext="Redução de 1.5%" 
          trend="down" 
          icon={Users} 
          color="bg-rose-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Recuperação Diária</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => [`R$ ${value}`, 'Recuperado']}
                />
                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Atividade Recente</h3>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg transition-colors border-b border-slate-50 last:border-0">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs">
                  JD
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">João da Silva</p>
                  <p className="text-xs text-slate-500">Pagou boleto de R$ 150,00</p>
                </div>
                <span className="text-xs text-slate-400">2min</span>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 py-2 text-sm text-brand-600 font-medium hover:bg-brand-50 rounded-lg transition-colors">
            Ver todo histórico
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;