import React from 'react';
import { 
  Bot, 
  Sparkles,
  MessageCircle,
  ShieldAlert,
  Sliders
} from 'lucide-react';

const AISettings = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Configuração da IA Financeira</h2>
        <p className="text-slate-500">Personalize como a inteligência artificial interage com seus clientes.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Behavior Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
           <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Bot className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Comportamento</h3>
           </div>
           
           <div className="space-y-4">
              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Tom de Voz</label>
                  <select className="w-full border-slate-200 rounded-lg text-sm">
                      <option>Formal e Respeitoso</option>
                      <option>Amigável e Casual</option>
                      <option>Objetivo e Direto</option>
                  </select>
              </div>
              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Permissões de Negociação</label>
                  <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm text-slate-600">
                          <input type="checkbox" defaultChecked className="rounded border-slate-300 text-brand-600" />
                          Gerar novos boletos atualizados
                      </label>
                       <label className="flex items-center gap-2 text-sm text-slate-600">
                          <input type="checkbox" className="rounded border-slate-300 text-brand-600" />
                          Oferecer parcelamento (requer aprovação)
                      </label>
                  </div>
              </div>
           </div>
        </div>

        {/* Handoff Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
           <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-rose-100 rounded-lg">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Transbordo (Humano)</h3>
           </div>
           <p className="text-sm text-slate-500 mb-4">A IA irá transferir a conversa para um atendente humano automaticamente se:</p>
           
           <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-sm text-slate-700">Cliente solicitar ("falar com atendente")</span>
                  <div className="w-10 h-6 bg-emerald-500 rounded-full flex items-center justify-end px-1"><div className="w-4 h-4 bg-white rounded-full"></div></div>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-sm text-slate-700">Sentimento negativo detectado</span>
                   <div className="w-10 h-6 bg-emerald-500 rounded-full flex items-center justify-end px-1"><div className="w-4 h-4 bg-white rounded-full"></div></div>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-sm text-slate-700">Assunto não financeiro</span>
                   <div className="w-10 h-6 bg-emerald-500 rounded-full flex items-center justify-end px-1"><div className="w-4 h-4 bg-white rounded-full"></div></div>
              </div>
           </div>
        </div>

        {/* Prompt Preview */}
        <div className="md:col-span-2 bg-gradient-to-r from-slate-900 to-slate-800 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center gap-3 mb-4">
                <Sparkles className="w-5 h-5 text-yellow-400" />
                <h3 className="text-lg font-bold">Teste de Classificação (Simulação)</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Mensagem do Cliente</label>
                    <div className="bg-white/10 p-3 rounded-lg text-sm italic text-slate-200 border border-white/10">
                        "Oi, recebi o boleto mas o valor está errado, cancelei o serviço mês passado."
                    </div>
                </div>
                <div>
                     <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Ação da IA</label>
                     <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-emerald-400">
                            <span className="bg-emerald-500/20 px-2 py-0.5 rounded text-xs">FINANCEIRO</span>
                            <span className="bg-rose-500/20 px-2 py-0.5 rounded text-xs text-rose-300">DISPUTA</span>
                        </div>
                        <p className="text-sm text-slate-300">→ Transferindo para humano (Motivo: Disputa de valor)</p>
                     </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AISettings;