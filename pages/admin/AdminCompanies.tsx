
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  MoreVertical, 
  Building2, 
  ExternalLink, 
  CheckCircle2, 
  Ban,
  Filter,
  LogIn,
  Eye,
  ArrowRight,
  MessageSquare,
  Zap,
  AlertTriangle,
  Calendar
} from 'lucide-react';
import { Company } from '../../types';

const MOCK_COMPANIES: Company[] = [
  { id: '1', name: 'Tech Solutions Ltda', ownerName: 'João Silva', email: 'joao@tech.com', plan: 'pro', status: 'active', mrr: 297.90, createdAt: '15/01/2024', usersCount: 5, integrationAsaas: 'active', integrationWhatsapp: 'active', churnRisk: 'low' },
  { id: '2', name: 'Advocacia Santos', ownerName: 'Maria Santos', email: 'maria@adv.com', plan: 'enterprise', status: 'active', mrr: 497.90, createdAt: '20/02/2024', usersCount: 12, integrationAsaas: 'active', integrationWhatsapp: 'error', churnRisk: 'medium' },
  { id: '3', name: 'Mercado Express', ownerName: 'Carlos Lima', email: 'carlos@mercado.com', plan: 'free', status: 'trial', mrr: 0, createdAt: '10/03/2024', usersCount: 1, integrationAsaas: 'inactive', integrationWhatsapp: 'inactive', churnRisk: 'high' },
  { id: '4', name: 'Consultoria Digital', ownerName: 'Ana Paula', email: 'ana@digital.com', plan: 'pro', status: 'suspended', mrr: 297.90, createdAt: '05/11/2023', usersCount: 3, integrationAsaas: 'error', integrationWhatsapp: 'active', churnRisk: 'low' },
];

const AdminCompanies = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>(MOCK_COMPANIES);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const toggleStatus = (id: string, currentStatus: string) => {
    setCompanies(companies.map(c => {
        if (c.id === id) {
            return { ...c, status: currentStatus === 'active' ? 'suspended' : 'active' };
        }
        return c;
    }));
    setOpenMenuId(null);
  };

  const handleImpersonate = (company: Company) => {
    const confirm = window.confirm(`ATENÇÃO: Você vai acessar o painel como "${company.name}". Deseja continuar?`);
    if (confirm) {
        localStorage.setItem('movicobranca_auth', 'true');
        window.location.href = '/#/'; 
    }
  };

  const getStatusBadge = (status: string) => {
      switch(status) {
          case 'active': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700"><CheckCircle2 className="w-3 h-3"/> Ativo</span>;
          case 'suspended': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700"><Ban className="w-3 h-3"/> Suspenso</span>;
          case 'trial': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700"><ExternalLink className="w-3 h-3"/> Trial</span>;
          default: return null;
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Gerenciar Empresas</h2>
          <p className="text-slate-500">Controle total sobre os inquilinos (tenants) do SaaS.</p>
        </div>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-md transition-colors flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Nova Empresa Manual
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-visible">
        {/* Filtros */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex gap-4">
            <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Buscar por empresa, e-mail ou dono..." 
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                />
            </div>
            <button className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">
                <Filter className="w-4 h-4" />
                Filtrar Status
            </button>
        </div>

        {/* Tabela */}
        <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 uppercase text-xs font-bold text-slate-500">
                <tr>
                    <th className="px-6 py-4">Empresa</th>
                    <th className="px-6 py-4">Plano</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Criado em</th>
                    <th className="px-6 py-4">Saúde (Integr.)</th>
                    <th className="px-6 py-4">Receita (MRR)</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {companies.map((company) => (
                    <tr key={company.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4 cursor-pointer" onClick={() => navigate(`/admin/companies/${company.id}`)}>
                            <div className="font-bold text-slate-900 flex items-center gap-2">
                                {company.name}
                                <ArrowRight className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <div className="text-xs text-slate-500">{company.email}</div>
                        </td>
                        <td className="px-6 py-4">
                            <span className={`uppercase font-bold text-[10px] px-2 py-0.5 rounded ${company.plan === 'enterprise' ? 'bg-purple-100 text-purple-700' : company.plan === 'pro' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                                {company.plan}
                            </span>
                        </td>
                        <td className="px-6 py-4">
                            {getStatusBadge(company.status)}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {company.createdAt}
                        </td>
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                                {/* Asaas Indicator */}
                                <div title="Asaas" className={`flex items-center justify-center w-6 h-6 rounded-full border ${company.integrationAsaas === 'active' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : company.integrationAsaas === 'error' ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                                   <Zap className="w-3 h-3" />
                                </div>
                                {/* WhatsApp Indicator */}
                                <div title="WhatsApp" className={`flex items-center justify-center w-6 h-6 rounded-full border ${company.integrationWhatsapp === 'active' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : company.integrationWhatsapp === 'error' ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                                   <MessageSquare className="w-3 h-3" />
                                </div>
                                {/* Churn Risk */}
                                {company.churnRisk === 'high' && (
                                    <div title="Risco de Churn Alto" className="flex items-center gap-1 px-1.5 py-0.5 bg-rose-50 text-rose-600 text-[10px] font-bold rounded border border-rose-100 animate-pulse">
                                        <AlertTriangle className="w-3 h-3" />
                                        RISCO
                                    </div>
                                )}
                            </div>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-900">
                            R$ {company.mrr.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right relative">
                            <button 
                                onClick={() => setOpenMenuId(openMenuId === company.id ? null : company.id)}
                                className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg"
                            >
                                <MoreVertical className="w-4 h-4" />
                            </button>

                            {openMenuId === company.id && (
                                <div className="absolute right-8 top-8 w-56 bg-white rounded-lg shadow-xl border border-slate-100 z-50 py-1 text-left animate-in fade-in zoom-in-95 duration-100">
                                     <button 
                                        onClick={() => navigate(`/admin/companies/${company.id}`)}
                                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                    >
                                        <Eye className="w-4 h-4 text-slate-500" />
                                        Ver Detalhes
                                    </button>
                                     <button 
                                        onClick={() => handleImpersonate(company)}
                                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                    >
                                        <LogIn className="w-4 h-4 text-indigo-600" />
                                        Login como Empresa
                                    </button>
                                    <div className="border-t border-slate-100 my-1"></div>
                                    <button 
                                        onClick={() => toggleStatus(company.id, company.status)}
                                        className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${company.status === 'active' ? 'text-rose-600 hover:bg-rose-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                                    >
                                        {company.status === 'active' ? (
                                            <>
                                                <Ban className="w-4 h-4" /> Suspender
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="w-4 h-4" /> Reativar
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminCompanies;
