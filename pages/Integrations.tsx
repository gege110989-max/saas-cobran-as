import React from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  Key, 
  RefreshCcw,
  ExternalLink
} from 'lucide-react';

const IntegrationCard = ({ title, description, connected, logo, children }: any) => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
    <div className="p-6 border-b border-slate-100 flex justify-between items-start">
      <div className="flex gap-4">
        <div className="w-12 h-12 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
          {logo}
        </div>
        <div>
          <h3 className="font-bold text-slate-900 text-lg">{title}</h3>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
      </div>
      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${connected ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
        {connected ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
        {connected ? 'Conectado' : 'Desconectado'}
      </div>
    </div>
    <div className="p-6 bg-slate-50/50 space-y-4">
      {children}
    </div>
  </div>
);

const Integrations = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Integrações</h2>
        <p className="text-slate-500">Conecte suas contas do Asaas e WhatsApp para automatizar as cobranças.</p>
      </div>

      <div className="grid gap-6">
        {/* Asaas Integration */}
        <IntegrationCard
          title="Asaas"
          description="Sincronização de clientes, faturas e baixa automática de pagamentos."
          connected={true}
          logo={<span className="font-bold text-blue-800">asaas</span>}
        >
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Chave de API (Produção)</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Key className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input 
                  type="password" 
                  value="sk_prod_89237489237489237489" 
                  readOnly
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-500 font-mono"
                />
              </div>
              <button className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm font-medium transition-colors">
                Alterar
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500 flex items-center gap-1">
               Webhook configurado automaticamente: <span className="font-mono bg-slate-100 px-1 rounded">/webhook/asaas?company_id=xxx</span>
            </p>
          </div>
          <div className="flex justify-end pt-2">
            <button className="text-brand-600 text-sm font-medium flex items-center gap-1 hover:underline">
              <RefreshCcw className="w-3 h-3" /> Sincronizar Clientes Agora
            </button>
          </div>
        </IntegrationCard>

        {/* WhatsApp Integration */}
        <IntegrationCard
          title="WhatsApp Cloud API"
          description="Envio de mensagens oficiais da Meta. Requer conta Business."
          connected={false}
          logo={<span className="font-bold text-green-600">WA</span>}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number ID</label>
                <input 
                  type="text" 
                  placeholder="Ex: 1029384756" 
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500"
                />
             </div>
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp Business Account ID</label>
                <input 
                  type="text" 
                  placeholder="Ex: 192837465" 
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500"
                />
             </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Token de Acesso Permanente</label>
            <div className="relative">
                <Key className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input 
                  type="password" 
                  placeholder="EAAG..." 
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-brand-500"
                />
            </div>
             <p className="mt-2 text-xs text-slate-500">
              Obtenha estes dados no <a href="#" className="text-brand-600 hover:underline inline-flex items-center">Meta for Developers <ExternalLink className="w-3 h-3 ml-0.5"/></a>
            </p>
          </div>
          <div className="pt-2 border-t border-slate-200 mt-2">
             <button className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full md:w-auto">
               Salvar e Conectar
             </button>
          </div>
        </IntegrationCard>
      </div>
    </div>
  );
};

export default Integrations;