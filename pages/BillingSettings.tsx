import React from 'react';
import { 
  Clock, 
  CalendarDays, 
  MessageSquare,
  Save,
  AlertTriangle
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
          <p className="text-slate-500">Defina as regras para o envio automático de mensagens.</p>
        </div>
        <button className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-md transition-all hover:shadow-lg">
            <Save className="w-4 h-4" />
            Salvar Alterações
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
      <ConfigSection title="Regras de Envio" icon={CalendarDays}>
        <div className="space-y-6">
            {/* Before Due */}
            <div className="flex items-start gap-4 p-4 rounded-lg border border-slate-100 bg-slate-50/50">
                <input type="checkbox" defaultChecked className="mt-1 w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500" />
                <div className="flex-1 space-y-3">
                    <div className="flex justify-between">
                         <label className="font-semibold text-slate-900">Lembrete de Vencimento</label>
                         <span className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded">Antes do Vencimento</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-600">Enviar</span>
                        <input type="number" defaultValue="2" className="w-16 px-2 py-1 border border-slate-200 rounded text-center text-sm" />
                        <span className="text-sm text-slate-600">dias antes do vencimento</span>
                    </div>
                    <div className="relative">
                        <textarea 
                            rows={3} 
                            className="w-full text-sm border-slate-200 rounded-lg p-3 focus:ring-brand-500 focus:border-brand-500"
                            defaultValue="Olá %name%, sua fatura de R$ %value% vence em breve. Segue o link: %link%"
                        ></textarea>
                        <div className="absolute bottom-2 right-2 flex gap-1">
                            <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded cursor-help" title="Nome do Cliente">%name%</span>
                            <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded cursor-help" title="Valor da Fatura">%value%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* On Due Date */}
            <div className="flex items-start gap-4 p-4 rounded-lg border border-slate-100 bg-slate-50/50">
                <input type="checkbox" defaultChecked className="mt-1 w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500" />
                <div className="flex-1 space-y-3">
                     <div className="flex justify-between">
                         <label className="font-semibold text-slate-900">Cobrança no Dia</label>
                         <span className="text-xs bg-brand-100 text-brand-700 px-2 py-1 rounded">No Vencimento</span>
                    </div>
                    <p className="text-sm text-slate-600">Envia a mensagem na data exata do vencimento.</p>
                    <textarea 
                        rows={3} 
                        className="w-full text-sm border-slate-200 rounded-lg p-3 focus:ring-brand-500 focus:border-brand-500"
                        defaultValue="Hoje é o dia! Sua fatura %invoice% vence hoje. Acesse: %link%"
                    ></textarea>
                </div>
            </div>

            {/* After Due */}
            <div className="flex items-start gap-4 p-4 rounded-lg border border-slate-100 bg-slate-50/50">
                <input type="checkbox" defaultChecked className="mt-1 w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500" />
                <div className="flex-1 space-y-3">
                    <div className="flex justify-between">
                         <label className="font-semibold text-slate-900">Cobrança de Atrasados</label>
                         <span className="text-xs bg-rose-100 text-rose-700 px-2 py-1 rounded">Após Vencimento</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-600">Enviar</span>
                        <input type="text" defaultValue="1, 3, 7" className="w-32 px-2 py-1 border border-slate-200 rounded text-center text-sm" />
                        <span className="text-sm text-slate-600">dias após vencimento (separar por vírgula)</span>
                    </div>
                    <textarea 
                        rows={3} 
                        className="w-full text-sm border-slate-200 rounded-lg p-3 focus:ring-brand-500 focus:border-brand-500"
                        defaultValue="Olá %name%, não identificamos o pagamento da fatura %invoice%. Evite juros, pague agora: %pix%"
                    ></textarea>
                </div>
            </div>
        </div>
      </ConfigSection>

    </div>
  );
};

export default BillingSettings;