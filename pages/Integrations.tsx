
import React, { useState, useEffect, useRef } from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  Key, 
  RefreshCcw,
  MessageSquare,
  Loader2,
  Save,
  Smartphone,
  Building,
  Wifi,
  Globe,
  ShieldCheck,
  CreditCard,
  X,
  Eye,
  EyeOff,
  FlaskConical,
  Terminal,
  Play,
  UserPlus,
  Users,
  FileText,
  RefreshCw,
  ExternalLink,
  Clock,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { validateAsaasToken, validateWhatsAppConnection, getIntegrationStatus, asaasService as asaasConfigService, whatsAppService } from '../services/integrations';
import { asaasService } from '../services/asaas'; // Logic service
import { authService } from '../services/auth';
import { getWebhookUrl } from '../services/functions';
import { SandboxLog, AsaasConfig } from '../types';

const WebhookUrlBox = ({ provider, companyId }: { provider: string, companyId: string }) => {
    const baseUrl = getWebhookUrl(provider === 'asaas' ? 'asaas-webhook' : 'whatsapp-webhook');
    const url = companyId 
        ? `${baseUrl}?company_id=${companyId}`
        : 'Carregando URL...';
    
    return (
        <div className="bg-slate-900 rounded-lg p-3 flex flex-col gap-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <Globe className="w-3 h-3" /> URL de Webhook (Backend Seguro)
            </span>
            <div className="flex items-center justify-between">
                <code className="text-xs text-emerald-400 font-mono truncate">{url}</code>
                <button 
                   onClick={() => { if(companyId) navigator.clipboard.writeText(url); }}
                   disabled={!companyId}
                   className="text-xs text-slate-400 hover:text-white font-medium transition-colors disabled:opacity-50"
                >
                    Copiar
                </button>
            </div>
        </div>
    );
};

const ConsoleLog = ({ logs }: { logs: SandboxLog[] }) => {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    return (
        <div className="bg-[#1e1e1e] rounded-lg p-4 font-mono text-xs h-64 overflow-y-auto border border-slate-700 shadow-inner">
            {logs.length === 0 && (
                <div className="text-slate-500 italic text-center mt-20">Aguardando eventos...</div>
            )}
            {logs.map((log) => (
                <div key={log.id} className="mb-1.5 flex gap-2">
                    <span className="text-slate-500 shrink-0">[{log.timestamp.split(' ')[1]}]</span>
                    <span className={`${
                        log.type === 'success' ? 'text-emerald-400' : 
                        log.type === 'error' ? 'text-rose-400' : 
                        log.type === 'warning' ? 'text-amber-400' : 'text-slate-300'
                    }`}>
                        {log.type === 'success' && '✓ '}
                        {log.type === 'error' && '✕ '}
                        {log.message}
                    </span>
                </div>
            ))}
            <div ref={bottomRef} />
        </div>
    );
};

const Integrations = () => {
  const [status, setStatus] = useState({ asaas: false, whatsapp: false });
  const [companyId, setCompanyId] = useState<string>('');
  
  // Feedback State
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  
  // Asaas State
  const [activeTab, setActiveTab] = useState<'config' | 'lab'>('config');
  const [asaasConfig, setAsaasConfig] = useState<AsaasConfig>({
      apiKey: '',
      sandboxKey: '',
      mode: 'production',
      autoSync: false,
      syncTime: '08:00'
  });
  const [isAsaasLoading, setIsAsaasLoading] = useState(false);
  const [isAsaasTesting, setIsAsaasTesting] = useState(false);
  
  // Asaas Sync States
  const [isSyncingCustomers, setIsSyncingCustomers] = useState(false);
  const [isSyncingInvoices, setIsSyncingInvoices] = useState(false);

  // Sandbox State
  const [logs, setLogs] = useState<SandboxLog[]>([]);
  const [activeCustomer, setActiveCustomer] = useState<{id: string, name: string} | null>(null);
  const [activeInvoice, setActiveInvoice] = useState<{id: string, value: number} | null>(null);

  // WhatsApp State
  const [waConfig, setWaConfig] = useState({
    phoneNumberId: '',
    businessAccountId: '',
    accessToken: '',
    verifyToken: 'movicobranca_token_secure_123'
  });
  const [isWaLoading, setIsWaLoading] = useState(false);
  const [isWaTesting, setIsWaTesting] = useState(false);
  const [showWaToken, setShowWaToken] = useState(false);

  useEffect(() => {
    // Async load all configs
    const loadAll = async () => {
        const currentStatus = await getIntegrationStatus();
        setStatus(currentStatus);
        
        const savedAsaas = await asaasConfigService.getConfig();
        if (savedAsaas) setAsaasConfig(prev => ({...prev, ...savedAsaas}));

        const savedWa = await whatsAppService.getConfig();
        if (savedWa) setWaConfig(prev => ({ ...prev, ...savedWa }));

        const id = await authService.getCompanyId();
        if (id) setCompanyId(id);
    };
    loadAll();
  }, []);

  const addLog = (message: string, type: SandboxLog['type'] = 'info') => {
      const newLog: SandboxLog = {
          id: Date.now().toString(),
          timestamp: new Date().toLocaleString(),
          message,
          type
      };
      setLogs(prev => [...prev, newLog]);
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
      setNotification({ type, message });
      setTimeout(() => setNotification(null), 4000);
  };

  // --- Asaas Actions ---

  const handleTestAsaas = async () => {
    const key = asaasConfig.mode === 'sandbox' ? asaasConfig.sandboxKey : asaasConfig.apiKey;
    if (!key) {
        showNotification('error', `Insira a chave de ${asaasConfig.mode === 'sandbox' ? 'Sandbox' : 'Produção'}.`);
        return;
    }
    setIsAsaasTesting(true);
    try {
        await validateAsaasToken(key, asaasConfig.mode);
        showNotification('success', "Conexão com Asaas estabelecida com sucesso!");
    } catch (e: any) {
        showNotification('error', e.message || "Falha na conexão Asaas. Verifique sua chave de API.");
    } finally {
        setIsAsaasTesting(false);
    }
  };

  const handleSaveAsaas = async () => {
    const key = asaasConfig.mode === 'sandbox' ? asaasConfig.sandboxKey : asaasConfig.apiKey;
    if (!key) return;
    setIsAsaasLoading(true);
    try {
        await validateAsaasToken(key, asaasConfig.mode);
        // Save to DB via new Service
        await asaasConfigService.saveConfig(asaasConfig);
        setStatus(prev => ({ ...prev, asaas: true }));
        showNotification('success', `Integração Asaas (${asaasConfig.mode}) salva e sincronizada na nuvem!`);
    } catch (e: any) {
        showNotification('error', e.message || "Chave inválida. Não foi possível salvar.");
    } finally {
        setIsAsaasLoading(false);
    }
  };

  const handleSyncCustomers = async () => {
      setIsSyncingCustomers(true);
      try {
          const customers = await asaasService.syncCustomers();
          const count = Array.isArray(customers) ? customers.length : 0;
          showNotification('success', `Sucesso! ${count} clientes sincronizados.`);
      } catch (e: any) {
          showNotification('error', `Erro na sincronização: ${e.message}`);
      } finally {
          setIsSyncingCustomers(false);
      }
  };

  const handleSyncInvoices = async () => {
      setIsSyncingInvoices(true);
      try {
          const count = await asaasService.syncInvoices();
          showNotification('success', `Sincronização concluída! ${count} faturas processadas.`);
      } catch (e: any) {
          showNotification('error', `Erro ao buscar faturas: ${e.message}`);
      } finally {
          setIsSyncingInvoices(false);
      }
  };

  const handleFullSync = async () => {
      if (isSyncingCustomers || isSyncingInvoices) return;
      
      setIsSyncingCustomers(true);
      setIsSyncingInvoices(true);
      
      try {
          const [customers, invoicesCount] = await Promise.all([
              asaasService.syncCustomers(),
              asaasService.syncInvoices()
          ]);
          
          const custCount = Array.isArray(customers) ? customers.length : 0;
          showNotification('success', `Sincronização completa: ${custCount} clientes e ${invoicesCount} faturas.`);
      } catch (e: any) {
          showNotification('error', `Erro na sincronização: ${e.message}`);
      } finally {
          setIsSyncingCustomers(false);
          setIsSyncingInvoices(false);
      }
  };

  // --- Sandbox Actions ---

  const handleCreateFakeCustomer = async () => {
      addLog("Iniciando criação de cliente fake...", 'info');
      try {
          const customer = await asaasService.createSandboxCustomer();
          setActiveCustomer({ id: customer.id, name: customer.name });
          addLog(`Cliente criado: ${customer.name} (ID: ${customer.id})`, 'success');
          addLog(`Dados salvos no Supabase.`, 'info');
      } catch (e: any) {
          addLog(`Erro ao criar cliente: ${e.message}`, 'error');
      }
  };

  const handleCreateFakeCharge = async () => {
      if (!activeCustomer) {
          addLog("Erro: Crie um cliente primeiro.", 'warning');
          return;
      }
      addLog(`Gerando cobrança para ${activeCustomer.name}...`, 'info');
      try {
          const charge = await asaasService.createSandboxCharge(activeCustomer.id);
          setActiveInvoice({ id: charge.id, value: charge.value });
          addLog(`Fatura gerada: ${charge.id}`, 'success');
          addLog(`Valor: R$ ${charge.value.toFixed(2)} | Venc: ${charge.dueDate}`, 'info');
      } catch (e: any) {
          addLog(`Erro ao gerar fatura: ${e.message}`, 'error');
      }
  };

  const handleSimulatePayment = async () => {
      if (!activeInvoice || !activeCustomer) {
          addLog("Erro: Nenhuma fatura pendente selecionada.", 'warning');
          return;
      }
      addLog(`Simulando pagamento da fatura ${activeInvoice.id}...`, 'info');
      try {
          const result = await asaasService.triggerSandboxPayment(activeInvoice.id, activeCustomer.id, activeInvoice.value);
          addLog(`Webhook disparado: PAYMENT_RECEIVED`, 'success');
          addLog(`Resposta do backend: ${result.message}`, 'success');
          setActiveInvoice(null); // Clear invoice as paid
      } catch (e: any) {
          addLog(`Erro no processamento do webhook: ${e.message}`, 'error');
      }
  };

  // --- WhatsApp Actions ---

  const handleTestWhatsApp = async () => {
      if (!waConfig.phoneNumberId || !waConfig.businessAccountId || !waConfig.accessToken) {
        showNotification('error', "Preencha todos os campos do WhatsApp para testar.");
        return;
      }
      setIsWaTesting(true);
      try {
        await validateWhatsAppConnection(waConfig);
        showNotification('success', "Conexão com WhatsApp API válida!");
      } catch (e: any) {
        showNotification('error', e.message || "Falha na conexão WhatsApp. Verifique IDs e Token.");
      } finally {
        setIsWaTesting(false);
      }
  };

  const handleSaveWhatsApp = async () => {
    if (!waConfig.phoneNumberId || !waConfig.businessAccountId || !waConfig.accessToken) {
        showNotification('error', "Preencha todos os campos obrigatórios.");
        return;
    }
    setIsWaLoading(true);
    try {
        await validateWhatsAppConnection(waConfig);
        await whatsAppService.saveConfig(waConfig);
        setStatus(prev => ({ ...prev, whatsapp: true }));
        showNotification('success', "Integração WhatsApp salva e segura no banco de dados!");
    } catch (e: any) {
        showNotification('error', e.message || "Erro ao salvar configuração do WhatsApp.");
    } finally {
        setIsWaLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10 relative">
      {/* Toast Notification */}
      {notification && (
          <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl border animate-in slide-in-from-top-5 fade-in duration-300 ${notification.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
              {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-rose-600" />}
              <span className="font-medium text-sm">{notification.message}</span>
              <button onClick={() => setNotification(null)} className="ml-2 hover:opacity-70"><X className="w-4 h-4" /></button>
          </div>
      )}

      <div>
        <h2 className="text-2xl font-bold text-slate-900">Integrações</h2>
        <p className="text-slate-500">Conecte suas contas do Asaas e WhatsApp para automatizar as cobranças.</p>
      </div>

      <div className="grid gap-8">
        
        {/* ASAAS CARD */}
        <div className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-all ${status.asaas ? 'border-emerald-100 ring-1 ring-emerald-50' : 'border-slate-200'}`}>
            <div className="p-6 border-b border-slate-50 flex justify-between items-start">
                <div className="flex gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center border ${status.asaas ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                        <span className="font-bold text-blue-800 text-xl tracking-tighter">asaas</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 text-lg">Integração Asaas</h3>
                        <p className="text-sm text-slate-500 max-w-sm">Sincronização financeira e emissão de boletos.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {status.asaas && (
                        <button 
                            onClick={handleFullSync}
                            disabled={isSyncingCustomers || isSyncingInvoices}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100"
                            title="Sincronizar Tudo Agora"
                        >
                            <RefreshCw className={`w-4 h-4 ${(isSyncingCustomers || isSyncingInvoices) ? 'animate-spin' : ''}`} />
                        </button>
                    )}
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${status.asaas ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {status.asaas ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                        {status.asaas ? 'Conectado' : 'Inativo'}
                    </div>
                </div>
            </div>

            {/* Asaas Tabs */}
            <div className="border-b border-slate-100 flex">
                <button 
                    onClick={() => setActiveTab('config')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'config' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
                >
                    <Key className="w-4 h-4" /> Configuração
                </button>
                <button 
                    onClick={() => setActiveTab('lab')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'lab' ? 'border-amber-500 text-amber-600 bg-amber-50/50' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
                >
                    <FlaskConical className="w-4 h-4" /> Laboratório (Sandbox)
                </button>
            </div>

            <div className="p-6 bg-slate-50/30">
                {activeTab === 'config' ? (
                    <div className="space-y-6">
                        {/* Mode Selector */}
                        <div className="flex items-center gap-4">
                            <label className="text-sm font-bold text-slate-700">Ambiente:</label>
                            <div className="flex bg-slate-100 rounded-lg p-1">
                                <button 
                                    onClick={() => setAsaasConfig({...asaasConfig, mode: 'production'})}
                                    className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${asaasConfig.mode === 'production' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Produção
                                </button>
                                <button 
                                    onClick={() => setAsaasConfig({...asaasConfig, mode: 'sandbox'})}
                                    className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${asaasConfig.mode === 'sandbox' ? 'bg-amber-100 text-amber-800' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Sandbox (Teste)
                                </button>
                            </div>
                        </div>

                        {/* Keys Inputs */}
                        {asaasConfig.mode === 'production' ? (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Chave de API (Produção)</label>
                                <div className="relative">
                                    <Key className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                    <input 
                                        type="password" 
                                        value={asaasConfig.apiKey}
                                        onChange={(e) => setAsaasConfig({...asaasConfig, apiKey: e.target.value})}
                                        placeholder="$aact_..."
                                        className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Chave de API (Sandbox)</label>
                                <div className="relative">
                                    <Key className="absolute left-3 top-2.5 w-4 h-4 text-amber-500" />
                                    <input 
                                        type="text" 
                                        value={asaasConfig.sandboxKey}
                                        onChange={(e) => setAsaasConfig({...asaasConfig, sandboxKey: e.target.value})}
                                        placeholder="$aact_..."
                                        className="w-full pl-9 pr-4 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-amber-500 text-amber-800"
                                    />
                                </div>
                                <p className="text-xs text-amber-700 mt-1">
                                    Use uma chave iniciada em <code>$</code> do ambiente de sandbox do Asaas.
                                </p>
                            </div>
                        )}

                        <div className="flex gap-2">
                            <button 
                                onClick={handleTestAsaas}
                                disabled={isAsaasTesting || isAsaasLoading}
                                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors disabled:opacity-70 flex items-center gap-2 shadow-sm"
                            >
                                {isAsaasTesting ? <Loader2 className="w-4 h-4 animate-spin text-blue-600" /> : <Wifi className="w-4 h-4" />}
                                Testar Conexão
                            </button>
                            <button 
                                onClick={handleSaveAsaas}
                                disabled={isAsaasLoading || isAsaasTesting}
                                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-70 flex items-center gap-2 shadow-sm"
                            >
                                {isAsaasLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Salvar
                            </button>
                        </div>

                        {/* Automação de Sincronização */}
                        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5">
                            <h4 className="font-bold text-indigo-900 text-sm mb-3 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-indigo-600" /> 
                                Automação de Sincronização
                            </h4>
                            <div className="flex items-center justify-between">
                                <div className="text-xs text-indigo-800 mr-4">
                                    O sistema buscará automaticamente novos clientes, faturas criadas e atualizará status de inadimplência todos os dias.
                                </div>
                                <div className="flex items-center gap-3 bg-white px-3 py-2 rounded-lg border border-indigo-100 shadow-sm">
                                    <button 
                                        onClick={() => setAsaasConfig(prev => ({ ...prev, autoSync: !prev.autoSync }))}
                                        className={`text-2xl transition-colors ${asaasConfig.autoSync ? 'text-emerald-500' : 'text-slate-300'}`}
                                    >
                                        {asaasConfig.autoSync ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                                    </button>
                                    
                                    <div className="w-px h-6 bg-slate-200"></div>
                                    
                                    <input 
                                        type="time" 
                                        value={asaasConfig.syncTime || '08:00'}
                                        onChange={(e) => setAsaasConfig(prev => ({ ...prev, syncTime: e.target.value }))}
                                        disabled={!asaasConfig.autoSync}
                                        className="text-sm font-bold text-slate-700 bg-transparent focus:outline-none disabled:opacity-50"
                                    />
                                </div>
                            </div>
                        </div>
                        
                        {/* Sincronização Manual */}
                        <div className="border-t border-slate-100 pt-6">
                            <h4 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-2">
                                <RefreshCcw className="w-4 h-4 text-slate-500" /> 
                                Sincronização Manual
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 border border-slate-200 rounded-lg bg-slate-50/50 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-white rounded-md border border-slate-200 text-slate-500">
                                            <Users className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-700 text-sm">Clientes</p>
                                            <p className="text-xs text-slate-500">Busque novos cadastros do Asaas</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={handleSyncCustomers} 
                                        disabled={isSyncingCustomers}
                                        className="w-full mt-2 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider rounded hover:border-indigo-300 hover:text-indigo-600 transition-all flex items-center justify-center gap-2"
                                    >
                                        {isSyncingCustomers ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                                        Sincronizar Clientes
                                    </button>
                                </div>

                                <div className="p-4 border border-slate-200 rounded-lg bg-slate-50/50 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-white rounded-md border border-slate-200 text-slate-500">
                                            <FileText className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-700 text-sm">Faturas</p>
                                            <p className="text-xs text-slate-500">Atualize status de pagamentos</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={handleSyncInvoices}
                                        disabled={isSyncingInvoices}
                                        className="w-full mt-2 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider rounded hover:border-indigo-300 hover:text-indigo-600 transition-all flex items-center justify-center gap-2"
                                    >
                                        {isSyncingInvoices ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                                        Sincronizar Faturas
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div className="mt-6">
                            <WebhookUrlBox provider="asaas" companyId={companyId} />
                        </div>
                    </div>
                ) : (
                    /* SANDBOX LAB UI */
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                                <h4 className="font-bold text-amber-900 text-sm flex items-center gap-2 mb-2">
                                    <FlaskConical className="w-4 h-4" /> Ambiente de Teste Ativo
                                </h4>
                                <p className="text-xs text-amber-800 mb-4">
                                    Use este painel para gerar dados falsos e testar a automação sem gastar dinheiro real.
                                    Os dados criados aqui aparecerão no seu banco de dados.
                                </p>
                                
                                <div className="space-y-2">
                                    <button 
                                        onClick={handleCreateFakeCustomer}
                                        disabled={!asaasConfig.sandboxKey}
                                        className="w-full flex items-center justify-between px-3 py-2 bg-white border border-amber-200 hover:bg-amber-100 rounded text-sm text-amber-900 transition-colors disabled:opacity-50"
                                    >
                                        <span className="flex items-center gap-2"><UserPlus className="w-4 h-4"/> Criar Cliente Fake</span>
                                        <Play className="w-3 h-3 opacity-50" />
                                    </button>
                                    
                                    <button 
                                        onClick={handleCreateFakeCharge}
                                        disabled={!activeCustomer}
                                        className="w-full flex items-center justify-between px-3 py-2 bg-white border border-amber-200 hover:bg-amber-100 rounded text-sm text-amber-900 transition-colors disabled:opacity-50"
                                    >
                                        <span className="flex items-center gap-2"><CreditCard className="w-4 h-4"/> Gerar Cobrança Pendente</span>
                                        <Play className="w-3 h-3 opacity-50" />
                                    </button>

                                    <button 
                                        onClick={handleSimulatePayment}
                                        disabled={!activeInvoice}
                                        className="w-full flex items-center justify-between px-3 py-2 bg-white border border-amber-200 hover:bg-amber-100 rounded text-sm text-amber-900 transition-colors disabled:opacity-50"
                                    >
                                        <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4"/> Simular Pagamento (Webhook)</span>
                                        <Play className="w-3 h-3 opacity-50" />
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                                <p className="text-xs font-bold text-slate-500 uppercase mb-2">Estado Atual</p>
                                <div className="text-xs space-y-1">
                                    <div className="flex justify-between">
                                        <span>Cliente Ativo:</span>
                                        <span className="font-mono text-slate-700">{activeCustomer ? activeCustomer.name : 'Nenhum'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Fatura Atual:</span>
                                        <span className="font-mono text-slate-700">{activeInvoice ? `R$ ${activeInvoice.value.toFixed(2)}` : 'Nenhuma'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col h-full">
                            <div className="flex items-center gap-2 mb-2">
                                <Terminal className="w-4 h-4 text-slate-500" />
                                <span className="text-xs font-bold text-slate-500 uppercase">Console de Logs</span>
                            </div>
                            <ConsoleLog logs={logs} />
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* WhatsApp Integration (Existing) */}
        <div className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-all ${status.whatsapp ? 'border-emerald-100 ring-1 ring-emerald-50' : 'border-slate-200'}`}>
            <div className="p-6 border-b border-slate-50 flex justify-between items-start">
                <div className="flex gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center border ${status.whatsapp ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                        <MessageSquare className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 text-lg">WhatsApp Cloud API</h3>
                        <p className="text-sm text-slate-500 max-w-sm">Envio de mensagens oficiais da Meta. Requer conta Business verificada.</p>
                        <a href="https://developers.facebook.com/apps/" target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline flex items-center gap-1 mt-1">
                            <ExternalLink className="w-3 h-3" /> Gerenciar na Meta
                        </a>
                    </div>
                </div>
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${status.whatsapp ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {status.whatsapp ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    {status.whatsapp ? 'Conectado' : 'Inativo'}
                </div>
            </div>
            
            <div className="p-6 bg-slate-50/30 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number ID</label>
                        <div className="relative">
                            <Smartphone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                            <input 
                            type="text" 
                            value={waConfig.phoneNumberId}
                            onChange={(e) => setWaConfig({...waConfig, phoneNumberId: e.target.value})}
                            placeholder="Ex: 1029384756" 
                            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 transition-all font-mono"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp Business Account ID</label>
                        <div className="relative">
                            <Building className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                            <input 
                            type="text" 
                            value={waConfig.businessAccountId}
                            onChange={(e) => setWaConfig({...waConfig, businessAccountId: e.target.value})}
                            placeholder="Ex: 192837465" 
                            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 transition-all font-mono"
                            />
                        </div>
                    </div>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Token de Acesso Permanente</label>
                    <div className="relative">
                        <Key className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input 
                            type={showWaToken ? "text" : "password"}
                            value={waConfig.accessToken}
                            onChange={(e) => setWaConfig({...waConfig, accessToken: e.target.value})}
                            placeholder="EAAG..." 
                            className="w-full pl-9 pr-10 py-2 bg-white border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-500 transition-all"
                        />
                        <button 
                            type="button"
                            onClick={() => setShowWaToken(!showWaToken)}
                            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                        >
                            {showWaToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                    <button 
                        onClick={handleTestWhatsApp}
                        disabled={isWaTesting || isWaLoading}
                        className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm disabled:opacity-70"
                    >
                    {isWaTesting ? <Loader2 className="w-4 h-4 animate-spin text-emerald-600" /> : <Wifi className="w-4 h-4" />}
                    Testar Conexão
                    </button>

                    <button 
                        onClick={handleSaveWhatsApp}
                        disabled={isWaLoading || isWaTesting}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm disabled:opacity-70"
                    >
                    {isWaLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Salvar
                    </button>
                </div>

                {/* Configuração de Webhook do WhatsApp */}
                <div className="mt-6 bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-indigo-600" /> Configuração do Webhook (Meta)
                    </h4>
                    
                    <div className="grid gap-3">
                        <WebhookUrlBox provider="whatsapp" companyId={companyId} />
                        
                        <div className="bg-white rounded-lg p-3 border border-slate-200">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Verify Token (Token de Verificação)</label>
                            <div className="flex justify-between items-center">
                                <code className="text-sm font-mono text-slate-700">{waConfig.verifyToken}</code>
                                <button className="text-xs text-indigo-600 font-medium hover:underline">Regerar</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Integrations;