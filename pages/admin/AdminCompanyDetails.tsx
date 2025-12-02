import React, { useState, useEffect } from 'react';
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
  FileText,
  Loader2,
  DollarSign,
  Download,
  Send,
  Plus,
  Edit2,
  X,
  Save
} from 'lucide-react';
import { Company, SaasInvoice, Plan } from '../../types';
import { adminService } from '../../services/admin';

// --- MOCK DATA PARA EXEMPLO ---
const MOCK_COMPANY_INVOICES: SaasInvoice[] = [
  { id: 'INV-001', companyId: '1', companyName: 'Tech Solutions', planName: 'Pro', amount: 297.90, status: 'paid', issueDate: '01/10/2024', dueDate: '15/10/2024', paidAt: '14/10/2024' },
  { id: 'INV-004', companyId: '1', companyName: 'Tech Solutions', planName: 'Pro', amount: 297.90, status: 'pending', issueDate: '01/11/2024', dueDate: '15/11/2024' },
  { id: 'INV-006', companyId: '1', companyName: 'Tech Solutions', planName: 'Adicional', amount: 50.00, status: 'overdue', issueDate: '20/10/2024', dueDate: '25/10/2024' },
];

const StatusBadge = ({ status, activeText, errorText, inactiveText }: any) => {
    if (status === 'active') return <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded"><CheckCircle2 className="w-3 h-3"/> {activeText || 'Ativo'}</span>;
    if (status === 'error') return <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded"><XCircle className="w-3 h-3"/> {errorText || 'Erro'}</span>;
    return <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded"><Clock className="w-3 h-3"/> {inactiveText || 'Inativo'}</span>;
};

const InvoiceStatusBadge = ({ status }: { status: string }) => {
    switch(status) {
        case 'paid': return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200"><CheckCircle2 className="w-3 h-3"/> Pago</span>;
        case 'pending': return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200"><Clock className="w-3 h-3"/> Pendente</span>;
        case 'overdue': return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200"><AlertTriangle className="w-3 h-3"/> Atrasado</span>;
        default: return null;
    }
};

const AdminCompanyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'finance'>('overview');
  
  // Finance State
  const [invoices, setInvoices] = useState<SaasInvoice[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Edit Plan State
  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const [availablePlans, setAvailablePlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [isUpdatingPlan, setIsUpdatingPlan] = useState(false);

  useEffect(() => {
    if (id) {
        loadDetails(id);
        loadPlans();
    }
  }, [id]);

  const loadDetails = async (companyId: string) => {
      setIsLoading(true);
      try {
          const data = await adminService.getCompanyDetails(companyId);
          setCompany(data);
          // Simulate fetching invoices for this company
          setInvoices(MOCK_COMPANY_INVOICES); 
      } catch (error) {
          console.error("Error loading details:", error);
      } finally {
          setIsLoading(false);
      }
  };

  const loadPlans = async () => {
      try {
          const plansData = await adminService.getPlans();
          setAvailablePlans(plansData);
      } catch (error) {
          console.error("Erro ao carregar planos:", error);
      }
  };

  const handleAction = (id: string) => {
      setProcessingId(id);
      setTimeout(() => setProcessingId(null), 1000);
  };

  const openPlanModal = () => {
      if (company) {
          setSelectedPlanId(company.planId || '');
          setIsEditingPlan(true);
      }
  };

  const handleUpdatePlan = async () => {
      if (!company || !selectedPlanId) return;
      setIsUpdatingPlan(true);
      try {
          await adminService.updateCompanyPlan(company.id, selectedPlanId);
          
          // Encontrar nome do plano selecionado para atualizar a UI localmente
          const planName = availablePlans.find(p => p.id === selectedPlanId)?.name || 'Custom';
          
          setCompany({ ...company, plan: planName, planId: selectedPlanId });
          setIsEditingPlan(false);
          alert(`Plano atualizado para ${planName} com sucesso!`);
      } catch (error) {
          console.error(error);
          alert("Erro ao atualizar o plano.");
      } finally {
          setIsUpdatingPlan(false);
      }
  };

  if (isLoading) {
      return (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
              Carregando detalhes...
          </div>
      );
  }

  if (!company) {
      return (
          <div className="p-8 text-center text-slate-500">
              Empresa não encontrada.
              <br/>
              <button onClick={() => navigate('/admin/companies')} className="mt-4 text-indigo-600 hover:underline">Voltar para lista</button>
          </div>
      );
  }

  return (
    <div className="space-y-6 relative">
      
      {/* Edit Plan Modal */}
      {isEditingPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm animate-in fade-in zoom-in duration-200">
                  <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
                      <h3 className="text-lg font-bold text-slate-900">Alterar Plano</h3>
                      <button onClick={() => setIsEditingPlan(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                          <X className="w-5 h-5" />
                      </button>
                  </div>
                  <div className="p-6 space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Selecione o Novo Plano</label>
                          <select 
                              value={selectedPlanId} 
                              onChange={(e) => setSelectedPlanId(e.target.value)}
                              className="w-full border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 bg-white p-2"
                          >
                              <option value="">Selecione...</option>
                              {availablePlans.map(p => (
                                  <option key={p.id} value={p.id}>
                                      {p.name} - R$ {p.price.toFixed(2)}/{p.interval === 'month' ? 'mês' : 'ano'}
                                  </option>
                              ))}
                          </select>
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                          <button 
                              onClick={() => setIsEditingPlan(false)} 
                              className="px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors text-sm"
                          >
                              Cancelar
                          </button>
                          <button 
                              onClick={handleUpdatePlan}
                              disabled={isUpdatingPlan || !selectedPlanId}
                              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-sm transition-colors text-sm flex items-center gap-2 disabled:opacity-70"
                          >
                              {isUpdatingPlan ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                              Salvar
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      <button onClick={() => navigate('/admin/companies')} className="flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Voltar para lista
      </button>

      {/* Header Profile */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 flex items-start justify-between">
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
                    <div className="flex gap-2 mt-3 items-center">
                        <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs font-bold uppercase border border-indigo-200">{company.plan}</span>
                        <button 
                            onClick={openPlanModal}
                            className="px-2 py-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border border-indigo-200 rounded-lg transition-colors"
                        >
                            Alterar Plano
                        </button>
                        <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs font-bold uppercase border border-emerald-200">{company.status}</span>
                    </div>
                </div>
            </div>
            <div className="text-right">
                <p className="text-sm text-slate-500">MRR Atual</p>
                <p className="text-3xl font-bold text-slate-900">R$ {company.mrr.toFixed(2)}</p>
            </div>
          </div>
          
          {/* Tabs Navigation */}
          <div className="flex border-t border-slate-100 bg-slate-50/50 px-6">
              <button 
                onClick={() => setActiveTab('overview')}
                className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'overview' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                  <Activity className="w-4 h-4" /> Visão Geral
              </button>
              <button 
                onClick={() => setActiveTab('finance')}
                className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'finance' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                  <CreditCard className="w-4 h-4" /> Financeiro
              </button>
          </div>
      </div>

      {activeTab === 'overview' ? (
          /* --- ABA VISÃO GERAL --- */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-left-4">
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
                                <p className="text-2xl font-bold text-slate-900">{Math.floor(Math.random() * 1500)}</p>
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
      ) : (
          /* --- ABA FINANCEIRO --- */
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              {/* Financial Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                      <div>
                          <p className="text-sm font-medium text-slate-500">Total Pago</p>
                          <h3 className="text-2xl font-bold text-emerald-600">R$ 1.290,00</h3>
                      </div>
                      <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600"><CheckCircle2 className="w-6 h-6"/></div>
                  </div>
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                      <div>
                          <p className="text-sm font-medium text-slate-500">Em Aberto</p>
                          <h3 className="text-2xl font-bold text-amber-600">R$ 297,90</h3>
                      </div>
                      <div className="p-3 bg-amber-50 rounded-lg text-amber-600"><Clock className="w-6 h-6"/></div>
                  </div>
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                      <div>
                          <p className="text-sm font-medium text-slate-500">Ticket Médio</p>
                          <h3 className="text-2xl font-bold text-indigo-600">R$ 297,00</h3>
                      </div>
                      <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600"><DollarSign className="w-6 h-6"/></div>
                  </div>
              </div>

              {/* Invoice List */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                      <h3 className="font-bold text-slate-900 flex items-center gap-2">
                          <FileText className="w-5 h-5 text-slate-400" />
                          Histórico de Faturas
                      </h3>
                      <button className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2">
                          <Plus className="w-4 h-4" /> Nova Cobrança
                      </button>
                  </div>
                  
                  <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold tracking-wider">
                              <tr>
                                  <th className="px-6 py-4">ID</th>
                                  <th className="px-6 py-4">Emissão</th>
                                  <th className="px-6 py-4">Vencimento</th>
                                  <th className="px-6 py-4">Valor</th>
                                  <th className="px-6 py-4">Status</th>
                                  <th className="px-6 py-4 text-right">Ações</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                              {invoices.map((inv) => (
                                  <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                                      <td className="px-6 py-4 font-mono text-slate-600">{inv.id}</td>
                                      <td className="px-6 py-4 text-slate-600">{inv.issueDate}</td>
                                      <td className="px-6 py-4 font-medium text-slate-900">{inv.dueDate}</td>
                                      <td className="px-6 py-4 font-medium text-slate-900">
                                          {inv.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                      </td>
                                      <td className="px-6 py-4">
                                          <InvoiceStatusBadge status={inv.status} />
                                      </td>
                                      <td className="px-6 py-4 text-right">
                                          <div className="flex justify-end gap-2">
                                              <button 
                                                  onClick={() => handleAction(inv.id)}
                                                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                                  title="Baixar PDF"
                                              >
                                                  {processingId === inv.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Download className="w-4 h-4" />}
                                              </button>
                                              <button 
                                                  onClick={() => handleAction(inv.id)}
                                                  className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                                                  title="Reenviar por E-mail"
                                              >
                                                  <Send className="w-4 h-4" />
                                              </button>
                                          </div>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default AdminCompanyDetails;