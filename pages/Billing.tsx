import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  CalendarDays, 
  Save,
  AlertTriangle,
  Zap,
  Loader2,
  CheckCircle2,
  Calendar,
  Info,
  MessageSquareCode,
  FileText,
  Image,
  Sparkles,
  Settings2,
  Mail
} from 'lucide-react';
import { BillingConfig } from '../types';
import { billingService } from '../services/billing';
import { improveTemplateAI } from '../services/ai';

// --- Sub-components (Merged from previous files) ---

const ConfigSection = ({ title, icon: Icon, children }: any) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2 bg-brand-50 rounded-lg">
        <Icon className="w-5 h-5 text-brand-600" />
      </div>
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>
    </div>
    {children}
  </div>
);

const TemplateCard = ({ title, badge, badgeColor, value, onChange }: any) => {
    const [isImproving, setIsImproving] = useState(false);

    const handleImproveAI = async () => {
      setIsImproving(true);
      try {
        let type = 'collection';
        if (title.includes('Preventivo')) type = 'informational';
        const improved = await improveTemplateAI(value, type);
        if (improved) onChange(improved.trim());
      } catch (error) {
        alert("Erro ao melhorar texto.");
      } finally {
        setIsImproving(false);
      }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="font-bold text-slate-900">{title}</h3>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${badgeColor}`}>
                        {badge}
                    </span>
                </div>
                <div className="flex gap-2">
                     <button className="p-2 text-slate-400 hover:bg-slate-50 rounded transition-colors" title="Anexar Boleto PDF">
                        <FileText className="w-4 h-4" />
                     </button>
                     <button className="p-2 text-slate-400 hover:bg-slate-50 rounded transition-colors" title="Anexar QR Code Pix">
                        <Image className="w-4 h-4" />
                     </button>
                </div>
            </div>
            <div className="relative">
                <textarea 
                    rows={4}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full text-sm border-slate-200 rounded-lg p-3 focus:ring-brand-500 focus:border-brand-500 bg-slate-50/50"
                ></textarea>
                
                <button 
                  onClick={handleImproveAI}
                  disabled={isImproving}
                  className="absolute right-2 bottom-12 text-[10px] bg-white/80 backdrop-blur border border-indigo-100 text-indigo-600 px-2 py-1 rounded-md shadow-sm hover:bg-indigo-50 transition-colors flex items-center gap-1 disabled:opacity-70"
                >
                  {isImproving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  Melhorar com IA
                </button>

                <div className="mt-2 flex flex-wrap gap-2">
                    {['%name%', '%invoice%', '%valor%', '%link%', '%pix%'].map(v => (
                        <button 
                            key={v}
                            onClick={() => onChange(value + ' ' + v)}
                            className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded border border-indigo-100 hover:bg-indigo-100 transition-colors"
                        >
                            {v}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

const DAYS_OF_WEEK = [
    { id: 0, label: 'Dom', full: 'Domingo' },
    { id: 1, label: 'Seg', full: 'Segunda-feira' },
    { id: 2, label: 'Ter', full: 'Terça-feira' },
    { id: 3, label: 'Qua', full: 'Quarta-feira' },
    { id: 4, label: 'Qui', full: 'Quinta-feira' },
    { id: 5, label: 'Sex', full: 'Sexta-feira' },
    { id: 6, label: 'Sáb', full: 'Sábado' },
];

const Billing = () => {
  const [activeTab, setActiveTab] = useState<'settings' | 'messages'>('settings');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Settings State
  const [config, setConfig] = useState<BillingConfig>({
    dailyCronTime: '09:00',
    daysBefore: 2,
    enableDaysBefore: true,
    sendOnDueDate: true,
    recoveryScheduledDays: [1, 3, 5],
    enableDaysAfter: true,
  });

  // Messages State
  const [messages, setMessages] = useState({
      preventive: "Olá %name%, sua fatura de R$ %valor% vence em breve. Link: %link%",
      due_date: "Hoje é o dia! A fatura %invoice% vence hoje. Pix: %pix%",
      overdue: "Oi %name%, não identificamos o pagamento. Evite suspensão: %link%"
  });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
      try {
          // 1. Load Settings from DB
          const savedConfig = await billingService.getConfig();
          if (savedConfig) {
              setConfig(prev => ({ ...prev, ...savedConfig }));
          }

          // 2. Load Messages from LocalStorage (Simulated DB)
          const savedMessages = localStorage.getItem('movicobranca_billing_messages');
          if (savedMessages) {
              setMessages(JSON.parse(savedMessages));
          }
      } catch (error) {
          console.error("Erro ao carregar dados", error);
      } finally {
          setIsLoading(false);
      }
  };

  const handleSave = async () => {
      setIsSaving(true);
      try {
          // Save Config
          await billingService.saveConfig(config);
          
          // Save Messages
          localStorage.setItem('movicobranca_billing_messages', JSON.stringify(messages));

          setShowToast(true);
          setTimeout(() => setShowToast(false), 3000);
      } catch (error) {
          alert("Erro ao salvar dados.");
      } finally {
          setIsSaving(false);
      }
  };

  const toggleDay = (dayId: number) => {
      setConfig(prev => {
          const currentDays = prev.recoveryScheduledDays || [];
          if (currentDays.includes(dayId)) {
              return { ...prev, recoveryScheduledDays: currentDays.filter(d => d !== dayId) };
          } else {
              return { ...prev, recoveryScheduledDays: [...currentDays, dayId].sort() };
          }
      });
  };

  if (isLoading) {
      return (
          <div className="flex items-center justify-center min-h-[400px]">
              <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
          </div>
      );
  }

  return (
    <div className="max-w-4xl mx-auto pb-20 relative space-y-6">
      {showToast && (
        <div className="fixed top-6 right-6 z-50 px-4 py-3 rounded-lg shadow-xl bg-emerald-600 text-white text-sm font-medium animate-in slide-in-from-top-5 fade-in duration-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Alterações salvas com sucesso!
        </div>
       )}

      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Gestão de Cobranças</h2>
          <p className="text-slate-500">Configure a régua de cobrança automática e personalize as mensagens.</p>
        </div>
        <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-lg font-medium shadow-md transition-all hover:shadow-lg disabled:opacity-70"
        >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar Tudo
        </button>
      </div>

      {/* Unified Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="flex border-b border-slate-100">
              <button 
                onClick={() => setActiveTab('settings')}
                className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'settings' ? 'border-brand-600 text-brand-600 bg-brand-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
              >
                  <Settings2 className="w-4 h-4" /> Regras & Agendamento
              </button>
              <button 
                onClick={() => setActiveTab('messages')}
                className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'messages' ? 'border-brand-600 text-brand-600 bg-brand-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
              >
                  <MessageSquareCode className="w-4 h-4" /> Mensagens & Templates
              </button>
          </div>

          <div className="p-6 bg-slate-50/30">
              {activeTab === 'settings' ? (
                  <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
                      {/* Scheduler */}
                      <ConfigSection title="Agendamento Diário (CRON)" icon={Clock}>
                        <div className="flex items-start gap-4">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-slate-700 mb-2">Horário de Disparo</label>
                                <p className="text-xs text-slate-500 mb-3">O sistema verificará faturas e enviará mensagens todos os dias neste horário.</p>
                                <input 
                                    type="time" 
                                    value={config.dailyCronTime}
                                    onChange={(e) => setConfig({...config, dailyCronTime: e.target.value})}
                                    className="bg-white border border-slate-200 text-slate-900 rounded-lg p-2.5 focus:ring-brand-500 focus:border-brand-500 w-40" 
                                />
                            </div>
                            <div className="bg-amber-50 border border-amber-100 p-4 rounded-lg max-w-sm">
                                <div className="flex gap-2">
                                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                                    <p className="text-xs text-amber-800 leading-relaxed">
                                        Recomendamos horários comerciais (09:00 - 18:00) para evitar bloqueios no WhatsApp.
                                    </p>
                                </div>
                            </div>
                        </div>
                      </ConfigSection>

                      {/* Rules */}
                      <ConfigSection title="Régua de Cobrança" icon={CalendarDays}>
                        <div className="space-y-4">
                            {/* Before Due */}
                            <div className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${config.enableDaysBefore ? 'border-slate-200 bg-slate-50/50' : 'border-slate-100 bg-slate-50 opacity-70'}`}>
                                <div className="flex items-center gap-3">
                                   <div className="p-2 bg-white rounded border border-slate-200 shadow-sm text-slate-500">
                                     <Zap className="w-4 h-4" />
                                   </div>
                                   <div>
                                       <label className="font-semibold text-slate-900 block">Lembrete Preventivo</label>
                                       <span className="text-xs text-slate-500">Enviar antes do vencimento</span>
                                   </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-slate-600">Enviar</span>
                                        <input 
                                            type="number" 
                                            value={config.daysBefore}
                                            onChange={(e) => setConfig({...config, daysBefore: parseInt(e.target.value) || 0})}
                                            disabled={!config.enableDaysBefore}
                                            className="w-16 px-2 py-1 border border-slate-200 rounded text-center text-sm disabled:bg-slate-100 disabled:text-slate-400" 
                                        />
                                        <span className="text-sm text-slate-600">dias antes</span>
                                    </div>
                                    <div className="h-6 w-px bg-slate-300 mx-2"></div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={config.enableDaysBefore}
                                            onChange={(e) => setConfig({...config, enableDaysBefore: e.target.checked})}
                                            className="sr-only peer" 
                                        />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                                    </label>
                                </div>
                            </div>

                            {/* On Due Date */}
                            <div className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${config.sendOnDueDate ? 'border-slate-200 bg-slate-50/50' : 'border-slate-100 bg-slate-50 opacity-70'}`}>
                                <div className="flex items-center gap-3">
                                   <div className="p-2 bg-white rounded border border-slate-200 shadow-sm text-slate-500">
                                     <CalendarDays className="w-4 h-4" />
                                   </div>
                                   <div>
                                       <label className="font-semibold text-slate-900 block">Cobrança no Dia</label>
                                       <span className="text-xs text-slate-500">Enviar na data do vencimento</span>
                                   </div>
                                </div>
                                <div className="flex items-center gap-3">
                                     <span className="text-sm text-slate-400 italic mr-2">Fixo no dia</span>
                                     <div className="h-6 w-px bg-slate-300 mx-2"></div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={config.sendOnDueDate}
                                            onChange={(e) => setConfig({...config, sendOnDueDate: e.target.checked})}
                                            className="sr-only peer" 
                                        />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                                    </label>
                                </div>
                            </div>

                            {/* After Due - Scheduler */}
                            <div className={`p-4 rounded-lg border transition-colors ${config.enableDaysAfter ? 'border-slate-200 bg-slate-50/50' : 'border-slate-100 bg-slate-50 opacity-70'}`}>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white rounded border border-slate-200 shadow-sm text-slate-500">
                                            <Calendar className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <label className="font-semibold text-slate-900 block">Recuperação de Atrasados</label>
                                            <span className="text-xs text-slate-500">Agendar envio para inadimplentes</span>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={config.enableDaysAfter}
                                            onChange={(e) => setConfig({...config, enableDaysAfter: e.target.checked})}
                                            className="sr-only peer" 
                                        />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                                    </label>
                                </div>

                                {config.enableDaysAfter && (
                                    <div className="space-y-4 pl-12 animate-in fade-in slide-in-from-top-2">
                                        <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm">
                                            <label className="block text-sm font-medium text-slate-700 mb-3">Dias da Semana para Envio</label>
                                            <div className="flex flex-wrap gap-2">
                                                {DAYS_OF_WEEK.map((day) => {
                                                    const isSelected = (config.recoveryScheduledDays || []).includes(day.id);
                                                    return (
                                                        <button
                                                            key={day.id}
                                                            onClick={() => toggleDay(day.id)}
                                                            className={`flex flex-col items-center justify-center w-12 h-12 rounded-lg border transition-all text-xs font-bold ${
                                                                isSelected 
                                                                    ? 'bg-brand-600 border-brand-600 text-white shadow-md transform scale-105' 
                                                                    : 'bg-white border-slate-200 text-slate-500 hover:border-brand-300 hover:text-brand-600'
                                                            }`}
                                                            title={day.full}
                                                        >
                                                            {day.label}
                                                            {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full mt-1"></div>}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                            <p className="text-xs text-slate-500 mt-3 flex items-center gap-1">
                                                <Info className="w-3 h-3" />
                                                O sistema fará uma varredura de todas as faturas vencidas nos dias selecionados acima.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                      </ConfigSection>
                  </div>
              ) : (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                      {/* Templates Grid */}
                      <div className="grid gap-6">
                        <TemplateCard 
                            title="Lembrete Preventivo" 
                            badge="Antes do Vencimento" 
                            badgeColor="bg-sky-100 text-sky-700"
                            value={messages.preventive}
                            onChange={(val: string) => setMessages({...messages, preventive: val})}
                        />

                        <TemplateCard 
                            title="Cobrança no Dia" 
                            badge="Dia do Vencimento" 
                            badgeColor="bg-emerald-100 text-emerald-700"
                            value={messages.due_date}
                            onChange={(val: string) => setMessages({...messages, due_date: val})}
                        />

                        <TemplateCard 
                            title="Cobrança de Atrasados" 
                            badge="Após Vencimento" 
                            badgeColor="bg-rose-100 text-rose-700"
                            value={messages.overdue}
                            onChange={(val: string) => setMessages({...messages, overdue: val})}
                        />
                      </div>

                      {/* Variables Legend */}
                      <div className="bg-slate-900 text-white p-6 rounded-xl shadow-lg">
                          <div className="flex items-center gap-3 mb-4">
                              <MessageSquareCode className="w-5 h-5 text-brand-400" />
                              <h3 className="font-bold">Legenda de Variáveis Dinâmicas</h3>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-slate-300">
                              <div><span className="font-mono text-brand-300 bg-white/10 px-1 rounded">%name%</span> - Nome do Cliente</div>
                              <div><span className="font-mono text-brand-300 bg-white/10 px-1 rounded">%invoice%</span> - ID da Fatura</div>
                              <div><span className="font-mono text-brand-300 bg-white/10 px-1 rounded">%valor%</span> - Valor (R$)</div>
                              <div><span className="font-mono text-brand-300 bg-white/10 px-1 rounded">%link%</span> - Link do Boleto</div>
                              <div><span className="font-mono text-brand-300 bg-white/10 px-1 rounded">%pix%</span> - Código Pix</div>
                          </div>
                      </div>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};

export default Billing;