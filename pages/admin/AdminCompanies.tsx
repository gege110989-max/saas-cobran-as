
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Building2, 
  CheckCircle2, 
  AlertTriangle,
  Loader2,
  Trash2,
  Plus,
  DollarSign, 
  TrendingUp, 
  MoreHorizontal,
  Eye,
  FileText,
  ShieldAlert,
  Send,
  Download,
  CreditCard,
  Clock
} from 'lucide-react';
import { Company, SaasInvoice } from '../../types';
import { adminService } from '../../services/admin';
import { CreateCompanyModal } from '../../components/modals/CreateCompanyModal';
import { DeleteConfirmationModal } from '../../components/modals/DeleteConfirmationModal';

// --- COMPONENTS ---

const KPICard = ({ title, value, icon: Icon, trend, trendValue, colorClass }: any) => (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-indigo-100 transition-all">
        <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
            {trend && (
                <div className={`flex items-center gap-1 text-xs font-medium mt-2 ${trend === 'up' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    <TrendingUp className={`w-3 h-3 ${trend === 'down' ? 'rotate-180' : ''}`} />
                    {trendValue} <span className="text-slate-400 font-normal">vs mês anterior</span>
                </div>
            )}
        </div>
        <div className={`p-3 rounded-xl ${colorClass} bg-opacity-10 group-hover:scale-110 transition-transform`}>
            <Icon className={`w-6 h-6 ${colorClass.replace('bg-', 'text-')}`} />
        </div>
    </div>
);

const AdminCompanies = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [invoices, setInvoices] = useState<SaasInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // View State
  const [activeTab, setActiveTab] = useState<'companies' | 'finance' | 'invoices'>('companies');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Action States
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'resend' | 'download' | null>(null);
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  const [invoiceFilter, setInvoiceFilter] = useState('all');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{isOpen: boolean, companyId: string, companyName: string} | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [companiesData, invoicesData] = await Promise.all([
          adminService.getAllCompanies(),
          adminService.getSaasInvoices()
      ]);
      setCompanies(companiesData);
      setInvoices(invoicesData);
    } catch (error) {
      console.error("Erro ao carregar:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Actions ---

  const handleCreateCompany = async (data: any) => {
      await adminService.createCompany(data);
      loadData();
      setIsCreateModalOpen(false);
      showToast("Empresa criada com sucesso!");
  };

  const confirmDelete = async () => {
      if (deleteModal) {
          await adminService.deleteCompany(deleteModal.companyId);
          setCompanies(prev => prev.filter(c => c.id !== deleteModal.companyId));
          setDeleteModal(null);
          showToast("Empresa excluída.");
      }
  };

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
      setToast({ msg, type });
      setTimeout(() => setToast(null), 3000);
  };

  const handleDownloadPdf = (id: string) => {
    setProcessingId(id);
    setActionType('download');
    setTimeout(() => {
        showToast(`PDF da Fatura ${id} baixado.`);
        setProcessingId(null);
        setActionType(null);
    }, 1200);
  };

  const handleResendInvoice = (id: string) => {
    setProcessingId(id);
    setActionType('resend');
    setTimeout(() => {
        showToast(`Cobrança reenviada para o cliente.`);
        setProcessingId(null);
        setActionType(null);
    }, 1200);
  };

  // --- Helpers & Renderers ---

  const getInvoiceStatusStyle = (status: string) => {
      switch(status) {
          case 'paid': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
          case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
          case 'overdue': return 'bg-rose-100 text-rose-700 border-rose-200';
          default: return 'bg-slate-100 text-slate-700';
      }
  };

  // Filter Logic
  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredInvoices = invoices.filter(inv => {
      const matchesSearch = inv.companyName.toLowerCase().includes(searchTerm.toLowerCase()) || inv.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = invoiceFilter === 'all' ? true : inv.status === invoiceFilter;
      return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 pb-20 relative">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[100] px-4 py-3 rounded-lg shadow-xl text-white text-sm font-medium animate-in slide-in-from-top-5 fade-in duration-300 flex items-center gap-2 ${toast.type === 'success' ? 'bg-slate-900' : 'bg-rose-600'}`}>
            {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4" />}
            {toast.msg}
        </div>
      )}

      {/* Modals */}
      <CreateCompanyModal 
          isOpen={isCreateModalOpen} 
          onClose={() => setIsCreateModalOpen(false)} 
          onSave={handleCreateCompany} 
          isLoading={false} 
      />
      <DeleteConfirmationModal 
          isOpen={!!deleteModal} 
          onClose={() => setDeleteModal(null)} 
          onConfirm={confirmDelete}
          title="Excluir Empresa"
          description={`Tem certeza que deseja excluir ${deleteModal?.companyName}? Todos os dados serão perdidos.`}
      />

      {/* Header & Global KPIs */}
      <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row justify-between items-end gap-4">
              <div>
                  <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Gestão de Carteira</h2>
                  <p className="text-slate-500 mt-1">Administre empresas, acompanhe receitas e gerencie cobranças.</p>
              </div>
              <button 
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-200 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
              >
                  <Plus className="w-5 h-5" />
                  Nova Empresa
              </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <KPICard title="MRR (Receita)" value="R$ 42.500" icon={DollarSign} trend="up" trendValue="+12%" colorClass="bg-emerald-500" />
              <KPICard title="Total Empresas" value={companies.length.toString()} icon={Building2} colorClass="bg-indigo-500" />
              <KPICard title="Faturas Pendentes" value={invoices.filter(i => i.status === 'pending').length.toString()} icon={Clock} colorClass="bg-amber-500" />
              <KPICard title="Inadimplência" value={invoices.filter(i => i.status === 'overdue').length.toString()} icon={AlertTriangle} trend="down" trendValue="-2%" colorClass="bg-rose-500" />
          </div>
      </div>

      {/* Unified Main Content */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
          
          {/* Navigation Bar */}
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex bg-slate-200/60 p-1 rounded-xl w-full md:w-auto">
                  <button 
                      onClick={() => setActiveTab('companies')}
                      className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                          activeTab === 'companies' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                      }`}
                  >
                      <Building2 className="w-4 h-4" /> Empresas
                  </button>
                  <button 
                      onClick={() => setActiveTab('finance')}
                      className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                          activeTab === 'finance' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                      }`}
                  >
                      <TrendingUp className="w-4 h-4" /> Financeiro
                  </button>
                  <button 
                      onClick={() => setActiveTab('invoices')}
                      className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                          activeTab === 'invoices' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                      }`}
                  >
                      <FileText className="w-4 h-4" /> Cobranças
                  </button>
              </div>

              {/* Filters */}
              <div className="flex flex-1 w-full md:w-auto justify-end gap-3">
                  <div className="relative w-full md:w-64">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={activeTab === 'companies' ? "Buscar empresa..." : "Buscar fatura ou empresa..."}
                        className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all" 
                      />
                  </div>
                  
                  {activeTab === 'invoices' && (
                      <select 
                          value={invoiceFilter}
                          onChange={(e) => setInvoiceFilter(e.target.value)}
                          className="bg-white border border-slate-200 rounded-xl text-sm px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                      >
                          <option value="all">Todas</option>
                          <option value="pending">Pendentes</option>
                          <option value="overdue">Atrasadas</option>
                          <option value="paid">Pagas</option>
                      </select>
                  )}
              </div>
          </div>

          {/* Content Body */}
          <div className="flex-1 overflow-x-auto bg-white">
              
              {/* --- TAB: EMPRESAS --- */}
              {activeTab === 'companies' && (
                  <table className="w-full text-left border-collapse animate-in fade-in">
                      <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold tracking-wider">
                          <tr>
                              <th className="px-6 py-4">Empresa</th>
                              <th className="px-6 py-4">Plano</th>
                              <th className="px-6 py-4">Status</th>
                              <th className="px-6 py-4">Saúde (Churn)</th>
                              <th className="px-6 py-4 text-right">Ações</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {isLoading ? (
                              <tr><td colSpan={5} className="px-6 py-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" /></td></tr>
                          ) : filteredCompanies.length === 0 ? (
                              <tr><td colSpan={5} className="px-6 py-16 text-center text-slate-500">Nenhuma empresa encontrada.</td></tr>
                          ) : (
                              filteredCompanies.map((company) => (
                              <tr key={company.id} className="group hover:bg-slate-50 transition-colors">
                                  <td className="px-6 py-4">
                                      <div className="flex items-center gap-3">
                                          <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg">
                                              {company.name.charAt(0).toUpperCase()}
                                          </div>
                                          <div>
                                              <div className="font-bold text-slate-900">{company.name}</div>
                                              <div className="text-xs text-slate-500">{company.ownerName}</div>
                                          </div>
                                      </div>
                                  </td>
                                  <td className="px-6 py-4">
                                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase border ${company.plan === 'enterprise' ? 'bg-purple-50 text-purple-700 border-purple-200' : company.plan === 'pro' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                          {company.plan}
                                      </span>
                                  </td>
                                  <td className="px-6 py-4">
                                      <div className="flex items-center gap-2">
                                          <span className={`w-2 h-2 rounded-full ${company.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                                          <span className="text-sm font-medium text-slate-700 capitalize">{company.status === 'active' ? 'Ativo' : 'Suspenso'}</span>
                                      </div>
                                  </td>
                                  <td className="px-6 py-4">
                                      {company.churnRisk === 'high' ? (
                                          <div className="flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded w-fit">
                                              <ShieldAlert className="w-3 h-3" /> Risco Alto
                                          </div>
                                      ) : (
                                          <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded w-fit">
                                              <CheckCircle2 className="w-3 h-3" /> Estável
                                          </div>
                                      )}
                                  </td>
                                  <td className="px-6 py-4 text-right relative">
                                      <button onClick={() => setOpenMenuId(openMenuId === company.id ? null : company.id)} className="p-2 text-slate-400 hover:bg-white hover:shadow-sm hover:text-indigo-600 rounded-lg transition-all">
                                          <MoreHorizontal className="w-5 h-5" />
                                      </button>
                                      
                                      {openMenuId === company.id && (
                                          <div className="absolute right-8 top-10 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                                              <button onClick={() => navigate(`/admin/companies/${company.id}`)} className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                                                  <Eye className="w-4 h-4 text-slate-400" /> Ver Detalhes
                                              </button>
                                              <button onClick={() => { setSearchTerm(company.name); setActiveTab('finance'); }} className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                                                  <FileText className="w-4 h-4 text-slate-400" /> Ver Faturas
                                              </button>
                                              <div className="border-t border-slate-100"></div>
                                              <button onClick={() => setDeleteModal({isOpen: true, companyId: company.id, companyName: company.name})} className="w-full text-left px-4 py-3 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2">
                                                  <Trash2 className="w-4 h-4" /> Excluir
                                              </button>
                                          </div>
                                      )}
                                  </td>
                              </tr>
                          )))
                          }
                      </tbody>
                  </table>
              )}

              {activeTab === 'finance' && (
                  /* FINANCE TABLE (Compact) */
                  <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold tracking-wider">
                          <tr>
                              <th className="px-6 py-4">Fatura / Empresa</th>
                              <th className="px-6 py-4">Valor</th>
                              <th className="px-6 py-4">Status</th>
                              <th className="px-6 py-4">Emissão/Venc.</th>
                              <th className="px-6 py-4 text-right">Ações</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {filteredInvoices.length === 0 ? (
                              <tr><td colSpan={5} className="px-6 py-16 text-center text-slate-500">Nenhuma fatura encontrada.</td></tr>
                          ) : (
                            filteredInvoices.map((inv) => (
                              <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="px-6 py-4">
                                      <div className="font-bold text-slate-900">{inv.id}</div>
                                      <div className="text-xs text-slate-500">{inv.companyName}</div>
                                  </td>
                                  <td className="px-6 py-4 font-medium text-slate-900">
                                      {inv.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                  </td>
                                  <td className="px-6 py-4">
                                      <span className={`px-2 py-0.5 rounded text-xs font-bold border ${getInvoiceStatusStyle(inv.status)}`}>
                                          {inv.status === 'paid' ? 'Pago' : inv.status === 'pending' ? 'Pendente' : 'Atrasado'}
                                      </span>
                                  </td>
                                  <td className="px-6 py-4 text-xs">
                                      <div className="text-slate-900">Emissão: {inv.issueDate}</div>
                                      <div className="text-slate-500">Venc: {inv.dueDate}</div>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                      <div className="flex justify-end gap-2">
                                          <button 
                                              onClick={() => handleResendInvoice(inv.id)}
                                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                              title="Reenviar"
                                          >
                                              {processingId === inv.id && actionType === 'resend' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                          </button>
                                          <button 
                                              onClick={() => handleDownloadPdf(inv.id)}
                                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                              title="Download PDF"
                                          >
                                              {processingId === inv.id && actionType === 'download' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                          </button>
                                      </div>
                                  </td>
                              </tr>
                          )))}
                      </tbody>
                  </table>
              )}

              {activeTab === 'invoices' && (
                  /* NEW INVOICES TABLE (Expanded) */
                  <table className="w-full text-left text-sm border-collapse">
                      <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold tracking-wider">
                          <tr>
                              <th className="px-6 py-4">ID da Fatura</th>
                              <th className="px-6 py-4">Empresa</th>
                              <th className="px-6 py-4">Valor</th>
                              <th className="px-6 py-4">Status</th>
                              <th className="px-6 py-4">Data de Vencimento</th>
                              <th className="px-6 py-4 text-right">Ações</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {filteredInvoices.length === 0 ? (
                              <tr><td colSpan={6} className="px-6 py-16 text-center text-slate-500">Nenhuma fatura encontrada.</td></tr>
                          ) : (
                            filteredInvoices.map((inv) => (
                              <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="px-6 py-4 font-mono text-slate-700 font-medium">{inv.id}</td>
                                  <td className="px-6 py-4 text-slate-900">{inv.companyName}</td>
                                  <td className="px-6 py-4 font-medium text-slate-900">
                                      {inv.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                  </td>
                                  <td className="px-6 py-4">
                                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getInvoiceStatusStyle(inv.status)}`}>
                                          {inv.status === 'paid' ? 'Pago' : inv.status === 'pending' ? 'Pendente' : 'Atrasado'}
                                      </span>
                                  </td>
                                  <td className="px-6 py-4 text-slate-500">
                                      {inv.dueDate}
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                      <div className="flex justify-end gap-2">
                                          <button 
                                              onClick={() => handleResendInvoice(inv.id)}
                                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                              title="Reenviar Cobrança"
                                          >
                                              {processingId === inv.id && actionType === 'resend' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                          </button>
                                          <button 
                                              onClick={() => handleDownloadPdf(inv.id)}
                                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                              title="Download PDF"
                                          >
                                              {processingId === inv.id && actionType === 'download' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                          </button>
                                      </div>
                                  </td>
                              </tr>
                          )))}
                      </tbody>
                  </table>
              )}
          </div>
      </div>
    </div>
  );
};

export default AdminCompanies;
