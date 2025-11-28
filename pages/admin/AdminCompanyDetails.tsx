import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Building2, 
  Mail, 
  Calendar, 
  ShieldCheck, 
  Activity, 
  CreditCard, 
  MessageSquare, 
  AlertTriangle,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  AlertOctagon,
  FileText
} from 'lucide-react';
import { Company } from '../../types';

// Mock Data (In a real app, fetch by ID)
const COMPANY_DETAILS: Company = { 
    id: '1', 
    name: 'Tech Solutions Ltda', 
    ownerName: 'João Silva', 
    email: 'joao@tech.com', 
    plan: 'pro', 
    status: 'active', 
    mrr: 297.90, 
    createdAt: '15/01/2024', 
    usersCount: 5, 
    integrationAsaas: 'active', 
    integrationWhatsapp: 'active', 
    churnRisk: 'low' 
};

const StatusBadge = ({ status, activeText, errorText, inactiveText }: any) => {
    if (status === 'active') return <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded"><CheckCircle2 className="w-3 h-3"/> {activeText || 'Ativo'}</span>;
    if (status === 'error') return <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded"><XCircle className="w-3 h-3"/> {errorText || 'Erro'}</span>;
    return <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded"><Clock className="w-3 h-3"/> {inactiveText || 'Inativo'}</span>;
};

const AdminCompanyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const company = COMPANY_DETAILS; // In real app, use id to fetch

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/admin/companies')} className="flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Voltar para lista
      </button>

      {/* Header */}
      <div className="flex items-start justify-between bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex gap-4">
            <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                <Building2 className="w-8 h-8" />
            </div>
            <div>
                <h1 className="text-2xl font-bold text-slate-900">{company.name}</h1>
                <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {company.email}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Cliente desde {company.createdAt}</span>
                </div>
                <div className="flex gap-2 mt-3">
                     <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs font-bold uppercase">{company.plan}</span>
                     <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs font-bold uppercase">{company.status}</span>
                </div>
            </div>
        </div>
        <div className="text-right">
             <p className="text-sm text-slate-500">MRR Atual</p>
             <p className="text-3xl font-bold text-slate-900">R$ {company.mrr.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-6">
               {/* Integrations Health */}
               <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                   <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                       <Activity className="w-5 h-5 text-indigo-600" />
                       Saúde das Integrações
                   </h3>
                   <div className="grid grid-cols-2 gap-4">
                       <div className="p-4 border border-slate-100 rounded-lg bg-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="font-bold text-blue-900">Asaas</div>
                            </div>
                            <StatusBadge status={company.integrationAsaas} activeText="Conectado" />
                       </div>
                       <div className="p-4 border border-slate-100 rounded-lg bg-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="font-bold text-emerald-600">WhatsApp API</div>
                            </div>
                            <StatusBadge status={company.integrationWhatsapp} activeText="Online" />
                       </div>
                   </div>
               </div>

               {/* Usage Stats */}
               <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                   <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                       <Activity className="w-5 h-5 text-indigo-600" />
                       Resumo Operacional (30 dias)
                   </h3>
                   <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 rounded-lg bg-slate-50 text-center">
                            <p className="text-2xl font-bold text-slate-900">1.2k</p>
                            <p className="text-xs text-slate-500 uppercase mt-1">Cobranças Enviadas</p>
                        </div>
                         <div className="p-4 rounded-lg bg-slate-50 text-center">
                            <p className="text-2xl font-bold text-slate-900">85%</p>
                            <p className="text-xs text-slate-500 uppercase mt-1">Taxa de Leitura</p>
                        </div>
                         <div className="p-4 rounded-lg bg-slate-50 text-center">
                            <p className="text-2xl font-bold text-slate-900">R$ 45k</p>
                            <p className="text-xs text-slate-500 uppercase mt-1">Recuperado</p>
                        </div>
                   </div>
               </div>

               {/* Error Logs Section */}
               <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                   <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                       <AlertOctagon className="w-5 h-5 text-rose-600" />
                       Logs de Erros e Falhas (Últimas 24h)
                   </h3>
                   <div className="space-y-3">
                       <div className="flex items-start gap-3 text-sm p-3 bg-rose-50 border border-rose-100 rounded-lg">
                           <XCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                           <div>
                               <p className="font-bold text-rose-800">Falha de Envio WhatsApp (Erro 401)</p>
                               <p className="text-xs text-rose-600 mt-1">Token de acesso expirado ou inválido. Necessário reconectar.</p>
                               <p className="text-[10px] text-rose-400 mt-1 font-mono">27/10/2024 10:30:15</p>
                           </div>
                       </div>
                       <div className="flex items-start gap-3 text-sm p-3 bg-amber-50 border border-amber-100 rounded-lg">
                           <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                           <div>
                               <p className="font-bold text-amber-800">Timeout na Consulta Asaas</p>
                               <p className="text-xs text-amber-600 mt-1">O servidor do Asaas demorou mais de 5s para responder.</p>
                               <p className="text-[10px] text-amber-400 mt-1 font-mono">27/10/2024 09:15:00</p>
                           </div>
                       </div>
                       <div className="flex items-center justify-center pt-2">
                           <button className="text-xs text-slate-500 hover:text-indigo-600 flex items-center gap-1">
                               <FileText className="w-3 h-3" /> Ver todos os logs
                           </button>
                       </div>
                   </div>
               </div>
          </div>

          {/* Right Column - Risk & Actions */}
          <div className="space-y-6">
               <div className={`p-6 rounded-xl border ${company.churnRisk === 'low' ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                   <h3 className={`font-bold mb-2 flex items-center gap-2 ${company.churnRisk === 'low' ? 'text-emerald-800' : 'text-rose-800'}`}>
                       <ShieldCheck className="w-5 h-5" />
                       Risco de Churn: {company.churnRisk === 'low' ? 'Baixo' : 'Alto'}
                   </h3>
                   <p className={`text-sm ${company.churnRisk === 'low' ? 'text-emerald-700' : 'text-rose-700'}`}>
                       Empresa com alta atividade e integrações saudáveis. Sem sinais de cancelamento.
                   </p>
               </div>

               <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                   <h3 className="font-bold text-slate-900 mb-4">Ações Administrativas</h3>
                   <div className="space-y-2">
                       <button className="w-full flex items-center gap-2 p-2 text-sm text-slate-700 hover:bg-slate-50 rounded transition-colors">
                           <ExternalLink className="w-4 h-4" /> Abrir no Asaas
                       </button>
                       <button className="w-full flex items-center gap-2 p-2 text-sm text-slate-700 hover:bg-slate-50 rounded transition-colors">
                           <MessageSquare className="w-4 h-4" /> Enviar E-mail ao Dono
                       </button>
                       <div className="border-t border-slate-100 my-2"></div>
                       <button className="w-full flex items-center gap-2 p-2 text-sm text-rose-600 hover:bg-rose-50 rounded transition-colors">
                           <AlertTriangle className="w-4 h-4" /> Forçar Sincronização
                       </button>
                   </div>
               </div>
          </div>
      </div>
    </div>
  );
};

export default AdminCompanyDetails;