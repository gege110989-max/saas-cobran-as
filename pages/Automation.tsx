import React from 'react';
import { Workflow, Play, Plus, Zap, ArrowRight } from 'lucide-react';

const AutomationCard = ({ title, trigger, action, active }: any) => (
    <div className={`p-5 rounded-xl border ${active ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-100 opacity-70'}`}>
        <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${active ? 'bg-brand-100 text-brand-600' : 'bg-slate-200 text-slate-500'}`}>
                    <Zap className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900">{title}</h3>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked={active} className="sr-only peer" />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
            <div className="flex-1 bg-slate-50 border border-slate-200 p-2 rounded text-slate-600 text-xs font-mono">
                SE: {trigger}
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
             <div className="flex-1 bg-slate-50 border border-slate-200 p-2 rounded text-slate-600 text-xs font-mono">
                ENTÃO: {action}
            </div>
        </div>
    </div>
);

const Automation = () => {
    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex justify-between items-end">
                <div>
                <h2 className="text-2xl font-bold text-slate-900">Automação de Atendimento</h2>
                <p className="text-slate-500">Fluxos automáticos para triagem e transferência de chamados.</p>
                </div>
                <button className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg font-medium shadow-md transition-all">
                    <Plus className="w-4 h-4" />
                    Nova Regra
                </button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                <AutomationCard 
                    title="Triagem Financeira" 
                    trigger="IA detecta intenção '2ª via' ou 'boleto'" 
                    action="Consultar Asaas e enviar PDF"
                    active={true}
                />
                <AutomationCard 
                    title="Transbordo Humano" 
                    trigger="Usuário digita 'falar com atendente'" 
                    action="Mudar status p/ HUMANO e notificar equipe"
                    active={true}
                />
                <AutomationCard 
                    title="Anti-Spam" 
                    trigger="Usuário envia > 5 msgs em 1 min" 
                    action="Responder 'Aguarde um momento' e pausar IA"
                    active={true}
                />
                <AutomationCard 
                    title="Horário Comercial" 
                    trigger="Msg recebida fora do horário (18h-08h)" 
                    action="Responder msg de ausência"
                    active={false}
                />
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center">
                 <Workflow className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                 <h3 className="text-slate-900 font-medium">Precisa de fluxos mais complexos?</h3>
                 <p className="text-slate-500 text-sm mt-1 max-w-md mx-auto">Em breve lançaremos o editor visual de fluxos (drag-and-drop) para você criar árvores de decisão personalizadas.</p>
            </div>
        </div>
    );
}

export default Automation;