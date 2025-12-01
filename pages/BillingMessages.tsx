
import React, { useState, useEffect } from 'react';
import { Save, MessageSquareCode, FileText, Image, Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import { improveTemplateAI } from '../services/ai';

// Interface for props
interface TemplateCardProps {
    title: string;
    badge: string;
    badgeColor: string;
    value: string;
    onChange: (val: string) => void;
}

const TemplateCard = ({ title, badge, badgeColor, value, onChange }: TemplateCardProps) => {
    const [isImproving, setIsImproving] = useState(false);

    const handleImproveAI = async () => {
      setIsImproving(true);
      try {
        // Determine type based on title for better AI context
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
}

const BillingMessages = () => {
  const [messages, setMessages] = useState({
      preventive: "Olá %name%, não deixe para a última hora! 🕒 Sua fatura de R$ %valor% vence em breve. Evite correrias e garanta seu serviço em dia acessando agora: %link%",
      due_date: "Hoje é o dia! A fatura %invoice% vence hoje. Evite multas pagando pelo Pix: %pix%",
      overdue: "Oi %name%, não identificamos o pagamento da fatura %invoice%. O serviço pode ser suspenso. Pague agora: %link%"
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
      const saved = localStorage.getItem('movicobranca_billing_messages');
      if (saved) {
          try {
              setMessages(JSON.parse(saved));
          } catch (e) {
              console.error("Error parsing saved messages", e);
          }
      }
  }, []);

  const handleSave = () => {
      setIsSaving(true);
      localStorage.setItem('movicobranca_billing_messages', JSON.stringify(messages));
      
      setTimeout(() => {
          setIsSaving(false);
          setShowToast(true);
          setTimeout(() => setShowToast(false), 3000);
      }, 800);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 relative">
       {showToast && (
        <div className="fixed top-6 right-6 z-50 px-4 py-3 rounded-lg shadow-xl bg-emerald-600 text-white text-sm font-medium animate-in slide-in-from-top-5 fade-in duration-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Modelos salvos com sucesso!
        </div>
       )}

       <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Mensagens Automáticas</h2>
          <p className="text-slate-500">Personalize os textos enviados pelo WhatsApp e use variáveis dinâmicas.</p>
        </div>
        <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-md transition-all hover:shadow-lg disabled:opacity-70"
        >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar Modelos
        </button>
      </div>

      <div className="grid gap-6">
        <TemplateCard 
            title="Lembrete Preventivo" 
            badge="Antes do Vencimento" 
            badgeColor="bg-sky-100 text-sky-700"
            value={messages.preventive}
            onChange={(val) => setMessages({...messages, preventive: val})}
        />

        <TemplateCard 
            title="Cobrança no Dia" 
            badge="Dia do Vencimento" 
            badgeColor="bg-emerald-100 text-emerald-700"
            value={messages.due_date}
            onChange={(val) => setMessages({...messages, due_date: val})}
        />

        <TemplateCard 
            title="Cobrança de Atrasados" 
            badge="Após Vencimento" 
            badgeColor="bg-rose-100 text-rose-700"
            value={messages.overdue}
            onChange={(val) => setMessages({...messages, overdue: val})}
        />
      </div>

      <div className="bg-slate-900 text-white p-6 rounded-xl shadow-lg mt-8">
          <div className="flex items-center gap-3 mb-4">
              <MessageSquareCode className="w-5 h-5 text-brand-400" />
              <h3 className="font-bold">Legenda de Variáveis</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-slate-300">
              <div><span className="font-mono text-brand-300">%name%</span> - Nome do Cliente</div>
              <div><span className="font-mono text-brand-300">%invoice%</span> - Número da Fatura</div>
              <div><span className="font-mono text-brand-300">%valor%</span> - Valor (R$)</div>
              <div><span className="font-mono text-brand-300">%link%</span> - Link do Boleto/Fatura</div>
              <div><span className="font-mono text-brand-300">%pix%</span> - Código Copia e Cola</div>
          </div>
      </div>
    </div>
  );
};

export default BillingMessages;
