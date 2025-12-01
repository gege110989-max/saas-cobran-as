
import React, { useState, useEffect } from 'react';
import { 
  Search, 
  FileText, 
  Download, 
  DollarSign, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  TrendingUp, 
  CreditCard, 
  Users,
  Send,
  ShieldAlert,
  Save,
  Loader2,
  Settings2,
  Play
} from 'lucide-react';
import { SaasInvoice } from '../../types';
import StatCard from '../../components/StatCard';
import { adminSettingsService } from '../../services/adminSettings';
import { adminService } from '../../services/admin';

const AdminFinance = () => {
  const [invoices, setInvoices] = useState<SaasInvoice[]>([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Auto Block State
  const [autoBlockConfig, setAutoBlockConfig] = useState({
      enabled: true,
      daysTolerance: 5
  });
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isRunningBlockRoutine, setIsRunningBlockRoutine] = useState(false);

  // Action States
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'resend' | 'download' | null>(null);

  // Toast
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  useEffect(() => {
      loadSettings();
      loadInvoices();
  }, []);

  const loadSettings = async () => {
      try {
          const config = await adminSettingsService.getConfig();
          if (config.autoBlock) {
              setAutoBlockConfig(config.autoBlock);
          }
      } catch (e) {
          console.error("Failed to load settings", e);
      }
  };

  const loadInvoices = async () => {
      setIsLoadingInvoices(true);
      try {
          const data = await adminService.getSaasInvoices();
          setInvoices(data);
      } catch (e) {
          console.error("Failed to load invoices", e);
          showToast("Erro ao carregar faturas.", 'error');
      } finally {
          setIsLoadingInvoices(false);
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
        showToast(`Fatura ${id} baixada com sucesso.`);
        setProcessingId(null);
        setActionType(null);
    }, 1500);
  };

  const handleResendInvoice = (id: string, email: string) => {
    setProcessingId(id);
    setActionType('resend');
    setTimeout(() => {
        showToast(`Cobrança reenviada para o cliente.`);
        setProcessingId(null);
        setActionType(null);
    }, 1500);
  };

  const handleSaveBlockConfig = async () => {
      setIsSavingConfig(true);
      try {
          const currentConfig = await adminSettingsService.getConfig();
          await adminSettingsService.saveConfig({
              ...currentConfig,
              autoBlock: autoBlockConfig
          });
          showToast("Configurações de bloqueio atualizadas e salvas!");
      } catch (error) {
          showToast("Erro ao salvar configurações.", 'error');
      } finally {
          setIsSavingConfig(false);
      }
  };

  const handleRunBlockRoutine = async () => {
      if (!autoBlockConfig.enabled) {
          showToast("Ative o bloqueio primeiro para executar.", 'error');
          return;
      }
      
      if (!window.confirm("Atenção: Isso irá suspender IMEDIATAMENTE todas as empresas que excederam os dias de tolerância. Deseja continuar?")) {
          return;
      }

      setIsRunningBlockRoutine(true);
      try {
          const result = await adminService.runAutoBlockRoutine();
          showToast(result.message, result.suspended > 0 ? 'success' : 'success');
      } catch (error: any) {
          showToast("Erro ao executar rotina: " + error.message, 'error');
      } finally {
          setIsRunningBlockRoutine(false);
      }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.companyName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          invoice.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || invoice.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800"><CheckCircle2 className="w-3 h-3"/> Pago</span>;
      case 'pending':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800"><Clock className="w-3 h-3"/> Pendente</span>;
      case 'overdue':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800"><AlertCircle className="w-3 h-3"/> Atrasado</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 relative">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-lg shadow-xl text-white text-sm font-medium animate-in slide-in-from-top-5 fade-in duration-300 flex items-center gap-2 ${toast.type === 'success' ? 'bg-slate-900' : 'bg-rose-600'}`}>
            {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4" />}
            {toast.msg}
        </div>
      )}

      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Financeiro SaaS</h2>
          <p className="text-slate-500">Métricas de receita e gestão de assinaturas.</p>
        </div>
        <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg font-medium shadow-sm transition-colors">
            <Download className="w-4 h-4" />
            Exportar Relatório
        </button>
      </div>

      {/* Advanced SaaS Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="ARR (Anual)" 
          value="R$ 420k" 
          subtext="Annual Recurring Revenue" 
          trend="+12%"
          icon={TrendingUp} 
          color="bg-indigo-500 text-indigo-600 bg-opacity-10"
        />
        <StatCard 
          title="LTV (Valor Vitalício)" 
          value="R$ 3.250" 
          subtext="Média por cliente" 
          trend="+5%"
          icon={DollarSign} 
          color="bg-emerald-500 text-emerald-600 bg-opacity-10"
        />
        <StatCard 
          title="CAC (Custo Aquisição)" 
          value="R$ 580" 
          subtext="Marketing / Vendas" 
          trend="-2%"
          icon={Users} 
          color="bg-blue-500 text-blue-600 bg-opacity-10"
        />
         <StatCard 
          title="Inadimplência" 
          value="1.8%" 
          subtext="Faturas vencidas > 30d" 
          icon={AlertCircle} 
          color="bg-rose-500 text-rose-600 bg-opacity-10"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table Section */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-slate-400" />
                    Faturas Recentes
                </h3>
            </div>

            {/* Filters */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input 
                type="text" 
                placeholder="Buscar fatura ou empresa..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
                <select 
                className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2 px-3 w-full sm:w-auto"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                >
                <option value="all">Todos os Status</option>
                <option value="paid">Pagos</option>
                <option value="pending">Pendentes</option>
                <option value="overdue">Atrasados</option>
                </select>
            </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto flex-1">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 uppercase text-xs font-bold text-slate-500">
                        <tr>
                            <th className="px-6 py-4">Empresa</th>
                            <th className="px-6 py-4">Valor</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Vencimento</th>
                            <th className="px-6 py-4 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {isLoadingInvoices ? (
                            <tr><td colSpan={5} className="px-6 py-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500"/></td></tr>
                        ) : filteredInvoices.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                    Nenhuma fatura encontrada.
                                </td>
                            </tr>
                        ) : filteredInvoices.map((invoice) => (
                            <tr key={invoice.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-medium text-slate-900">{invoice.companyName}</div>
                                    <div className="text-xs text-slate-500 font-mono mt-0.5">{invoice.id} • {invoice.planName}</div>
                                </td>
                                <td className="px-6 py-4 font-medium text-slate-900">
                                    {invoice.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </td>
                                <td className="px-6 py-4">
                                    {getStatusBadge(invoice.status)}
                                </td>
                                <td className="px-6 py-4 text-slate-500">
                                    {invoice.dueDate}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button 
                                            onClick={() => handleResendInvoice(invoice.id, 'email@teste.com')}
                                            disabled={processingId === invoice.id}
                                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors disabled:opacity-50" 
                                            title="Reenviar Cobrança por E-mail"
                                        >
                                            {processingId === invoice.id && actionType === 'resend' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                        </button>
                                        <button 
                                            onClick={() => handleDownloadPdf(invoice.id)}
                                            disabled={processingId === invoice.id}
                                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors disabled:opacity-50" 
                                            title="Baixar PDF"
                                        >
                                            {processingId === invoice.id && actionType === 'download' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Settings Column */}
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                 <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-rose-600" />
                    Bloqueio Automático
                </h3>
                <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                    Configure a suspensão automática de acesso para empresas inadimplentes.
                </p>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-slate-700">Ativar Bloqueio</label>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={autoBlockConfig.enabled}
                                onChange={(e) => setAutoBlockConfig({...autoBlockConfig, enabled: e.target.checked})}
                                className="sr-only peer" 
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                        </label>
                    </div>

                    <div className={!autoBlockConfig.enabled ? 'opacity-50 pointer-events-none' : ''}>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Dias de tolerância (após vencimento)
                        </label>
                        <div className="flex items-center gap-2">
                            <input 
                                type="number" 
                                value={autoBlockConfig.daysTolerance}
                                onChange={(e) => setAutoBlockConfig({...autoBlockConfig, daysTolerance: parseInt(e.target.value)})}
                                className="w-full border-slate-200 rounded-lg text-sm focus:ring-rose-500 focus:border-rose-500"
                            />
                            <span className="text-sm text-slate-500">dias</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-2">
                            Após <strong>{autoBlockConfig.daysTolerance} dias</strong> de atraso, o acesso ao painel será suspenso automaticamente.
                        </p>
                    </div>

                    <div className="flex flex-col gap-2 mt-4">
                        <button 
                            onClick={handleSaveBlockConfig}
                            disabled={isSavingConfig}
                            className="w-full bg-slate-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                        >
                            {isSavingConfig ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Salvar Regras
                        </button>
                        
                        <button 
                            onClick={handleRunBlockRoutine}
                            disabled={isRunningBlockRoutine || !autoBlockConfig.enabled}
                            className="w-full bg-rose-50 text-rose-700 border border-rose-200 py-2 rounded-lg text-sm font-medium hover:bg-rose-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Executa a verificação manualmente agora"
                        >
                            {isRunningBlockRoutine ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                            Rodar Rotina Agora
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5">
                 <h4 className="font-bold text-indigo-900 flex items-center gap-2 mb-2">
                    <Settings2 className="w-4 h-4" />
                    Gateway de Pagamento
                 </h4>
                 <p className="text-xs text-indigo-700 mb-3">
                     O Movicobrança usa o Stripe para processar as assinaturas do SaaS.
                 </p>
                 <button className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline">
                     Gerenciar chaves do Stripe &rarr;
                 </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AdminFinance;
