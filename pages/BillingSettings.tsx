
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
  Info
} from 'lucide-react';
import { BillingConfig } from '../types';
import { billingService } from '../services/billing';

const ConfigSection = ({ title, icon: Icon, children }: any) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2 bg-brand-50 rounded-lg">
        <Icon className="w-5 h-5 text-brand-600" />
      </div>
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>
    </div>
    {children}
  </div>
);

const DAYS_OF_WEEK = [
    { id: 0, label: 'Dom', full: 'Domingo' },
    { id: 1, label: 'Seg', full: 'Segunda-feira' },
    { id: 2, label: 'Ter', full: 'Terça-feira' },
    { id: 3, label: 'Qua', full: 'Quarta-feira' },
    { id: 4, label: 'Qui', full: 'Quinta-feira' },
    { id: 5, label: 'Sex', full: 'Sexta-feira' },
    { id: 6, label: 'Sáb', full: 'Sábado' },
];

const BillingSettings = () => {
  const [config, setConfig] = useState<BillingConfig>({
    dailyCronTime: '09:00',
    daysBefore: 2,
    enableDaysBefore: true,
    sendOnDueDate: true,
    recoveryScheduledDays: [1, 3, 5], // Padrão: Seg, Qua, Sex
    enableDaysAfter: true,
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
      try {
          const saved = await billingService.getConfig();
          if (saved) {
              // Merge saved config with defaults to prevent undefined values
              setConfig(prev => ({ ...prev, ...saved }));
          }
      } catch (error) {
          console.error("Erro ao carregar configurações", error);
      } finally {
          setIsLoading(false);
      }
  };

  const handleSave = async () => {
      setIsSaving(true);
      try {
          await billingService.saveConfig(config);
          setShowToast(true);
          setTimeout(() => setShowToast(false), 3000);
      } catch (error) {
          console.error(error);
          alert("Erro ao salvar configurações.");
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
    <div className="max-w-4xl mx-auto space-y-6 pb-20 relative">
      {showToast && (
        <div className="fixed top-6 right-6 z-50 px-4 py-3 rounded-lg shadow-xl bg-emerald-600 text-white text-sm font-medium animate-in slide-in-from-top-5 fade-in duration-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Configurações salvas na nuvem!
        </div>
       )}

      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Configuração de Cobrança</h2>
          <p className="text-slate-500">Defina os horários e regras para o agendamento automático.</p>
        </div>
        <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-md transition-all hover:shadow-lg disabled:opacity-70"
        >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar Regras
        </button>
      </div>

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
                        Recomendamos horários comerciais (09:00 - 18:00) para evitar bloqueios no WhatsApp por denúncias de spam.
                    </p>
                </div>
            </div>
        </div>
      </ConfigSection>

      {/* Rules */}
      <ConfigSection title="Regras de Ativação" icon={CalendarDays}>
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
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
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
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
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
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
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
  );
};

export default BillingSettings;
