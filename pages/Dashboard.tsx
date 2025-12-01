import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Users, 
  MessageCircle, 
  Activity,
  Building2,
  Loader2,
  TrendingUp,
  UserCheck,
  Edit2,
  X,
  Save,
  Image as ImageIcon,
  Crown,
  Zap,
  Shield,
  CalendarRange,
  Settings
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
import StatCard from '../components/StatCard';
import SystemHealth from '../components/SystemHealth';
import { companyService } from '../services/company';
import { Company } from '../types';

const data = [
  { name: 'Seg', value: 4000 },
  { name: 'Ter', value: 3000 },
  { name: 'Qua', value: 2000 },
  { name: 'Qui', value: 2780 },
  { name: 'Sex', value: 1890 },
  { name: 'Sab', value: 2390 },
  { name: 'Dom', value: 3490 },
];

const acquisitionData = [
  { name: 'Jan', new: 12, churn: 1 },
  { name: 'Fev', new: 15, churn: 2 },
  { name: 'Mar', new: 18, churn: 2 },
  { name: 'Abr', new: 25, churn: 1 },
  { name: 'Mai', new: 22, churn: 3 },
  { name: 'Jun', new: 30, churn: 2 },
];

const Dashboard = () => {
  const [company, setCompany] = useState<Company | null>(null);
  const [metrics, setMetrics] = useState({ mrr: 0, activeCustomers: 0, churnRate: 0, totalCustomers: 0 });
  const [loading, setLoading] = useState(true);
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', logoUrl: '' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [companyData, metricsData] = await Promise.all([
          companyService.getCurrentCompany(),
          companyService.getDashboardMetrics()
      ]);
      
      setCompany(companyData);
      setMetrics(metricsData);
      
      if (companyData) {
          setEditForm({ 
              name: companyData.name, 
              logoUrl: companyData.logoUrl || '' 
          });
      }
    } catch (error) {
      console.error("Erro ao carregar dados do dashboard", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCompany = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSaving(true);
      try {
          await companyService.updateCompany({ 
              name: editForm.name, 
              logoUrl: editForm.logoUrl 
          });
          
          setCompany(prev => prev ? ({ ...prev, name: editForm.name, logoUrl: editForm.logoUrl }) : null);
          setIsEditing(false);
      } catch (error) {
          alert("Erro ao atualizar dados da empresa.");
      } finally {
          setIsSaving(false);
      }
  };

  const getPlanIcon = (plan?: string) => {
      switch(plan) {
          case 'enterprise': return <Crown className="w-3 h-3 text-amber-500" />;
          case 'pro': return <Zap className="w-3 h-3 text-indigo-500" />;
          default: return <Shield className="w-3 h-3 text-slate-500" />;
      }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative pb-20">
      
      {/* Edit Company Modal */}
      {isEditing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-200">
                  <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
                      <h3 className="text-lg font-bold text-slate-900">Editar Empresa</h3>
                      <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                          <X className="w-5 h-5" />
                      </button>
                  </div>
                  <form onSubmit={handleUpdateCompany} className="p-6 space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Empresa</label>
                          <div className="relative">
                              <Building2 className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                              <input 
                                  type="text" 
                                  required
                                  value={editForm.name}
                                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500"
                              />
                          </div>
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">URL da Logomarca</label>
                          <div className="relative">
                              <ImageIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                              <input 
                                  type="url" 
                                  value={editForm.logoUrl}
                                  onChange={(e) => setEditForm({...editForm, logoUrl: e.target.value})}
                                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500"
                                  placeholder="https://..."
                              />
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1">Cole o link direto da imagem (PNG/JPG).</p>
                      </div>
                      <div className="pt-4 flex gap-3">
                          <button 
                              type="button" 
                              onClick={() => setIsEditing(false)}
                              className="flex-1 px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors text-sm"
                          >
                              Cancelar
                          </button>
                          <button 
                              type="submit"
                              disabled={isSaving}
                              className="flex-1 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium shadow-sm transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-70"
                          >
                              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                              Salvar
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* Modern Company Header Card */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden group">
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-indigo-50/80 via-white to-transparent pointer-events-none" />
        
        {loading ? (
             <div className="flex items-center gap-4 animate-pulse relative z-10">
                <div className="w-20 h-20 bg-slate-200 rounded-2xl"></div>
                <div className="space-y-3">
                    <div className="h-6 w-48 bg-slate-200 rounded"></div>
                    <div className="h-4 w-32 bg-slate-200 rounded"></div>
                </div>
             </div>
        ) : (
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                <div className="flex items-center gap-5">
                    {/* Logo Section */}
                    <div className="relative group/logo">
                        {company?.logoUrl ? (
                            <img 
                                src={company.logoUrl} 
                                alt={company.name} 
                                className="w-20 h-20 rounded-2xl object-cover border-2 border-white shadow-lg ring-1 ring-slate-100"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                }}
                            />
                        ) : null}
                        
                        <div className={`w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400 rounded-2xl flex items-center justify-center border-2 border-white shadow-lg ring-1 ring-slate-100 ${company?.logoUrl ? 'hidden' : ''}`}>
                            <Building2 className="w-8 h-8" />
                        </div>
                    </div>

                    {/* Info Section */}
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">{company?.name || 'Minha Empresa'}</h2>
                            <button 
                                onClick={() => setIsEditing(true)}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                title="Editar nome e logo"
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                            <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                company?.plan === 'enterprise' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                                company?.plan === 'pro' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 
                                'bg-slate-100 text-slate-600 border-slate-200'
                            }`}>
                                {getPlanIcon(company?.plan)}
                                {company?.plan || 'Free'}
                            </div>
                        </div>
                        <p className="text-slate-500 text-sm flex items-center gap-2">
                            Bem-vindo ao seu painel financeiro inteligente.
                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                            <span className="text-emerald-600 font-medium text-xs flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                Sistema Operacional
                            </span>
                        </p>
                    </div>
                </div>

                {/* Actions Section */}
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button 
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 rounded-xl text-sm font-medium transition-all shadow-sm flex items-center gap-2 group/edit"
                    >
                        <Settings className="w-4 h-4 text-slate-400 group-hover/edit:text-indigo-500 transition-colors" />
                        Configurar
                    </button>
                    
                    <div className="h-8 w-px bg-slate-200 mx-1 hidden md:block"></div>

                    <div className="relative flex-1 md:flex-none">
                        <CalendarRange className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <select className="w-full md:w-auto pl-9 pr-8 py-2.5 bg-slate-50 hover:bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-sm rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 shadow-sm transition-all appearance-none cursor-pointer font-medium">
                            <option>Últimos 30 dias</option>
                            <option>Últimos 7 dias</option>
                            <option>Este Mês</option>
                            <option>Este Ano</option>
                        </select>
                    </div>
                </div>
             </div>
        )}
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="MRR (Receita)" 
          value={metrics.mrr.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} 
          subtext="Receita Recorrente" 
          trend="up" 
          icon={DollarSign} 
          color="bg-emerald-500"
        />
        <StatCard 
          title="Clientes Ativos" 
          value={metrics.activeCustomers.toString()} 
          subtext={`De um total de ${metrics.totalCustomers}`} 
          trend="up" 
          icon={UserCheck} 
          color="bg-brand-500"
        />
        <StatCard 
          title="Churn Rate" 
          value={`${metrics.churnRate}%`} 
          subtext="Taxa de cancelamento" 
          trend={metrics.churnRate > 5 ? 'up' : 'down'} // Up is bad for churn usually, but using color logic
          icon={Activity} 
          color="bg-rose-500"
        />
        <StatCard 
          title="Atendimentos IA" 
          value="856" 
          subtext="Resolvidos automaticamente" 
          trend="up" 
          icon={MessageCircle} 
          color="bg-indigo-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* MRR Area Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
             <TrendingUp className="w-5 h-5 text-brand-600" />
             Recuperação Diária
          </h3>
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
                  formatter={(value: any) => [`R$ ${value}`, 'Recuperado']}
                />
                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity List */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Atividade Recente</h3>
          <div className="space-y-4 flex-1 overflow-y-auto max-h-[300px] pr-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg transition-colors border-b border-slate-50 last:border-0 group cursor-default">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs group-hover:bg-white group-hover:shadow-sm transition-all border border-transparent group-hover:border-slate-200">
                  JD
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">João da Silva</p>
                  <p className="text-xs text-slate-500">Pagou boleto de <span className="font-semibold text-emerald-600">R$ 150,00</span></p>
                </div>
                <span className="text-xs text-slate-400">2min</span>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 py-2.5 text-sm text-brand-600 bg-brand-50 hover:bg-brand-100 font-medium rounded-lg transition-colors">
            Ver todo histórico
          </button>
        </div>
      </div>

      {/* Advanced Metrics & System Health */}
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

        {/* System Health */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <SystemHealth />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;