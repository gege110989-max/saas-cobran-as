
import React, { useState } from 'react';
import { 
  Bot, 
  Sparkles,
  ShieldAlert,
  Play,
  Loader2,
  MessageSquareQuote,
  Plus,
  X,
  Settings2,
  AlignLeft
} from 'lucide-react';
import { classifyMessageAI, generateSmartReply } from '../services/ai';

const AISettings = () => {
  const [testMessage, setTestMessage] = useState("Oi, recebi o boleto mas o valor está errado, cancelei o serviço mês passado.");
  const [classification, setClassification] = useState<any>(null);
  const [generatedReply, setGeneratedReply] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Behavior State
  const [maxResponseTokens, setMaxResponseTokens] = useState(150);

  // Custom Triggers State
  const [customTriggers, setCustomTriggers] = useState<string[]>(['reclame aqui', 'procon', 'processo', 'falar com gerente']);
  const [newTrigger, setNewTrigger] = useState('');

  const handleAddTrigger = () => {
    if (newTrigger.trim() && !customTriggers.includes(newTrigger.trim().toLowerCase())) {
        setCustomTriggers([...customTriggers, newTrigger.trim().toLowerCase()]);
        setNewTrigger('');
    }
  };

  const handleRemoveTrigger = (trigger: string) => {
    setCustomTriggers(customTriggers.filter(t => t !== trigger));
  };

  const handleTestClassification = async () => {
    if (!testMessage) return;
    setLoading(true);
    setClassification(null);
    setGeneratedReply(null);
    
    try {
      const [classResult, replyResult] = await Promise.all([
        classifyMessageAI(testMessage),
        generateSmartReply("Empresa de Exemplo (SaaS)", `Cliente: ${testMessage}`, maxResponseTokens)
      ]);

      if (classResult) {
        // Ensure JSON parsing handles potential formatting issues
        let jsonStr = classResult.trim();
        if (jsonStr.startsWith('```json')) {
            jsonStr = jsonStr.replace(/^```json\n/, '').replace(/\n```$/, '');
        } else if (jsonStr.startsWith('```')) {
             jsonStr = jsonStr.replace(/^```\n/, '').replace(/\n```$/, '');
        }
        
        try {
             const parsed = JSON.parse(jsonStr);
             setClassification(parsed);
        } catch (e) {
             console.error("Error parsing classification JSON", e);
        }
      }
      
      if (replyResult) {
        setGeneratedReply(replyResult);
      }

    } catch (error) {
      console.error(error);
      alert("Erro ao conectar com a IA. Verifique se a API Key está configurada.");
    } finally {
      setLoading(false);
    }
  };

  // Estimativa simples: 1 token ~= 4 caracteres
  const estimateTokens = (text: string) => Math.ceil(text.length / 4);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Configuração da IA Financeira</h2>
        <p className="text-slate-500">Personalize como a inteligência artificial interage com seus clientes.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Behavior Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit">
           <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Bot className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Comportamento</h3>
           </div>
           
           <div className="space-y-4">
              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Tom de Voz</label>
                  <select className="w-full border-slate-200 rounded-lg text-sm focus:ring-brand-500 focus:border-brand-500">
                      <option>Formal e Respeitoso</option>
                      <option>Amigável e Casual</option>
                      <option>Objetivo e Direto</option>
                  </select>
              </div>
              
              <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-slate-700">Limite de Tokens (Tamanho)</label>
                    <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">{maxResponseTokens} tokens</span>
                  </div>
                  <input 
                    type="range" 
                    min="50" 
                    max="1000" 
                    step="10" 
                    value={maxResponseTokens}
                    onChange={(e) => setMaxResponseTokens(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
                  />
                  <p className="text-xs text-slate-400 mt-1">Controla o tamanho máximo da resposta gerada.</p>
              </div>

              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Permissões de Negociação</label>
                  <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm text-slate-600">
                          <input type="checkbox" defaultChecked className="rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                          Gerar novos boletos atualizados
                      </label>
                       <label className="flex items-center gap-2 text-sm text-slate-600">
                          <input type="checkbox" className="rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
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
           
           <div className="space-y-3 mb-6">
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

           <div className="pt-4 border-t border-slate-100">
               <div className="flex items-center gap-2 mb-3">
                   <Settings2 className="w-4 h-4 text-slate-400" />
                   <label className="text-sm font-bold text-slate-700">Gatilhos Personalizados (Palavras-chave)</label>
               </div>
               
               <div className="flex gap-2 mb-3">
                   <input 
                      type="text" 
                      value={newTrigger}
                      onChange={(e) => setNewTrigger(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTrigger()}
                      placeholder="Ex: advogado, procon..."
                      className="flex-1 text-sm border-slate-200 rounded-lg focus:ring-brand-500 focus:border-brand-500"
                   />
                   <button 
                      onClick={handleAddTrigger}
                      disabled={!newTrigger.trim()}
                      className="p-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
                   >
                       <Plus className="w-5 h-5" />
                   </button>
               </div>

               <div className="flex flex-wrap gap-2">
                   {customTriggers.map((trigger) => (
                       <span key={trigger} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-rose-50 text-rose-700 border border-rose-100 group">
                           {trigger}
                           <button onClick={() => handleRemoveTrigger(trigger)} className="hover:text-rose-900 focus:outline-none">
                               <X className="w-3 h-3" />
                           </button>
                       </span>
                   ))}
               </div>
           </div>
        </div>

        {/* Prompt Preview */}
        <div className="md:col-span-2 bg-gradient-to-r from-slate-900 to-slate-800 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center gap-3 mb-4">
                <Sparkles className="w-5 h-5 text-yellow-400" />
                <h3 className="text-lg font-bold">Teste de Inteligência (Gemini 3 Pro)</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Mensagem do Cliente</label>
                        <span className="text-[10px] text-slate-500 bg-white/5 px-2 py-0.5 rounded font-mono">
                            ~{estimateTokens(testMessage)} tokens
                        </span>
                    </div>
                    <textarea 
                      value={testMessage}
                      onChange={(e) => setTestMessage(e.target.value)}
                      className="w-full bg-white/10 p-3 rounded-lg text-sm text-white border border-white/10 focus:ring-1 focus:ring-yellow-400 focus:border-yellow-400 outline-none h-32 resize-none"
                      placeholder="Digite uma mensagem como se fosse um cliente..."
                    />
                    <button 
                      onClick={handleTestClassification}
                      disabled={loading}
                      className="mt-4 text-xs bg-yellow-400 text-slate-900 px-4 py-2 rounded font-bold hover:bg-yellow-300 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                      Testar Análise e Resposta
                    </button>
                </div>
                <div>
                     <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Análise da IA</label>
                     {classification ? (
                       <div className="space-y-4 animate-in fade-in slide-in-from-left-2 duration-300">
                          {/* Classification Tags */}
                          <div className="flex flex-wrap gap-2">
                             <span className={`px-2 py-1 rounded text-xs font-bold border ${classification.intent === 'Financeiro' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300' : 'bg-slate-500/20 border-slate-500/30 text-slate-300'}`}>
                                Intenção: {classification.intent?.toUpperCase()}
                             </span>
                             <span className={`px-2 py-1 rounded text-xs font-bold border ${
                                classification.sentiment === 'Negativo' ? 'bg-rose-500/20 border-rose-500/30 text-rose-300' : 
                                classification.sentiment === 'Positivo' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300' : 'bg-blue-500/20 border-blue-500/30 text-blue-300'
                              }`}>
                                Sentimento: {classification.sentiment?.toUpperCase()}
                              </span>
                              <span className={`px-2 py-1 rounded text-xs font-bold border ${classification.handoff ? 'bg-rose-500/20 border-rose-500/30 text-rose-300' : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'}`}>
                                Transbordo: {classification.handoff ? 'SIM' : 'NÃO'}
                              </span>
                          </div>
                          
                          {/* Reason */}
                          <div className="bg-white/5 p-3 rounded border border-white/5">
                            <p className="text-xs text-slate-300 leading-relaxed italic">
                              "{classification.reason}"
                            </p>
                          </div>

                          {/* Generated Reply */}
                          {generatedReply && (
                            <div className="pt-2">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <MessageSquareQuote className="w-4 h-4 text-yellow-400" />
                                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Resposta Sugerida</span>
                                </div>
                                <span className="text-[10px] text-slate-500 bg-white/5 px-2 py-0.5 rounded font-mono">
                                    ~{estimateTokens(generatedReply)} tokens
                                </span>
                              </div>
                              <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 p-3 rounded-lg border border-indigo-500/30">
                                <p className="text-sm text-white">
                                  {generatedReply}
                                </p>
                              </div>
                            </div>
                          )}
                       </div>
                     ) : (
                        <div className="flex flex-col items-center justify-center h-48 text-slate-500 text-sm italic border border-dashed border-slate-600 rounded-lg">
                          {loading ? (
                              <>
                                <Loader2 className="w-6 h-6 animate-spin mb-2 text-yellow-400" />
                                <span>Processando com Gemini 3 Pro...</span>
                              </>
                          ) : (
                              <span>Aguardando teste...</span>
                          )}
                        </div>
                     )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AISettings;
