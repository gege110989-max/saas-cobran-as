import React from 'react';
import { 
  Clock, 
  CalendarDays, 
  Save,
  AlertTriangle,
  Zap
} from 'lucide-react';

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

const BillingSettings = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Configuração de Cobrança</h2>
          <p className="text-slate-500">Defina os horários e regras para o agendamento automático.</p>
        </div>
        <button className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-md transition-all hover:shadow-lg">
            <Save className="w-4 h-4" />
            Salvar Regras
        </button>
      </div>

      {/* Scheduler */}
      <ConfigSection title="Agendamento Diário (CRON)" icon={Clock}>
        <div className="flex items-start gap-4">
            <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-2">Horário de Disparo</label>
                <p className="text-xs text-slate-500 mb-3">O sistema verificará faturas e enviará mensagens todos os dias neste horário.</p>
                <input type="time" defaultValue="09:00" className="bg-white border border-slate-200 text-slate-900 rounded-lg p-2.5 focus:ring-brand-500 focus:border-brand-500 w-40" />
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
            <div className="flex items-center justify-between p-4 rounded-lg border border-slate-100 bg-slate-50/50">
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
                        <input type="number" defaultValue="2" className="w-16 px-2 py-1 border border-slate-200 rounded text-center text-sm" />
                        <span className="text-sm text-slate-600">dias antes</span>
                    </div>
                    <div className="h-6 w-px bg-slate-300 mx-2"></div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                    </label>
                </div>
            </div>

            {/* On Due Date */}
            <div className="flex items-center justify-between p-4 rounded-lg border border-slate-100 bg-slate-50/50">
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
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                    </label>
                </div>
            </div>

            {/* After Due */}
            <div className="flex items-center justify-between p-4 rounded-lg border border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-white rounded border border-slate-200 shadow-sm text-slate-500">
                     <AlertTriangle className="w-4 h-4" />
                   </div>
                   <div>
                       <label className="font-semibold text-slate-900 block">Recuperação de Atrasados</label>
                       <span className="text-xs text-slate-500">Enviar após o vencimento</span>
                   </div>
                </div>
                <div className="flex items-center gap-3">
                     <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-600">Enviar</span>
                        <input type="text" defaultValue="1, 3, 7" className="w-24 px-2 py-1 border border-slate-200 rounded text-center text-sm" />
                        <span className="text-sm text-slate-600">dias após</span>
                    </div>
                    <div className="h-6 w-px bg-slate-300 mx-2"></div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                    </label>
                </div>
            </div>
        </div>
      </ConfigSection>
    </div>
  );
};

export default BillingSettings;