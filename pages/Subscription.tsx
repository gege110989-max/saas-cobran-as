import React, { useState, useEffect } from 'react';
import { CreditCard, Check, Sparkles, Loader2, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { stripeService } from '../services/stripe';
import { Plan } from '../types';

interface PlanCardProps {
  plan: Plan;
  current: boolean;
  onSubscribe: () => void;
  loading: boolean;
}

const PlanCard: React.FC<PlanCardProps> = ({ plan, current, onSubscribe, loading }) => {
    const isRecommended = plan.isRecommended && !current;
    
    return (
    <div className={`relative p-8 rounded-3xl border flex flex-col h-full transition-all duration-300 ${
        current 
            ? 'border-emerald-500 bg-emerald-50/30 ring-2 ring-emerald-500 shadow-xl' 
            : isRecommended 
                ? 'border-indigo-500 bg-white shadow-2xl scale-105 z-10 ring-1 ring-indigo-100' 
                : 'border-slate-200 bg-white shadow-sm hover:shadow-xl hover:-translate-y-1'
    }`}>
        {isRecommended && (
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-6 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg flex items-center gap-1 ring-4 ring-white">
                <Sparkles className="w-3 h-3 fill-current" /> Recomendado
            </div>
        )}
        
        {current && (
            <div className="absolute top-0 right-0 p-5">
                <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border border-emerald-200 shadow-sm">
                    <Check className="w-3 h-3" /> Plano Atual
                </span>
            </div>
        )}

        <div className="mb-8 mt-2">
            <h3 className={`text-lg font-bold uppercase tracking-wide mb-4 ${
                current ? 'text-emerald-700' : isRecommended ? 'text-indigo-600' : 'text-slate-500'
            }`}>{plan.name}</h3>
            
            <div className="flex items-baseline text-slate-900">
                <span className="text-5xl font-extrabold tracking-tight">
                    {plan.price === 0 ? 'Grátis' : `R$ ${plan.price}`}
                </span>
                {plan.price > 0 && (
                    <span className="ml-2 text-lg font-medium text-slate-400">/{plan.interval === 'year' ? 'ano' : 'mês'}</span>
                )}
            </div>
            <p className="mt-4 text-sm text-slate-500 leading-relaxed min-h-[40px]">
                {plan.description || "Plano ideal para o crescimento da sua empresa."}
            </p>
        </div>

        <div className="flex-1 mb-8">
            <div className="h-px bg-slate-100 mb-6"></div>
            <ul className="space-y-4">
                {plan.features?.map((feature: string, idx: number) => (
                    <li key={idx} className="flex items-start">
                        <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5 ${
                            current ? 'bg-emerald-100 text-emerald-600' : isRecommended ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'
                        }`}>
                            <Check className="h-3.5 w-3.5" />
                        </div>
                        <p className="ml-3 text-sm text-slate-600 font-medium">{feature}</p>
                    </li>
                ))}
            </ul>
        </div>

        <button 
            onClick={onSubscribe}
            disabled={current || loading}
            className={`w-full py-4 px-6 rounded-xl text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2 group ${
                current 
                    ? 'bg-white border-2 border-emerald-500 text-emerald-600 cursor-default opacity-100'
                    : isRecommended
                        ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:to-indigo-700 text-white hover:shadow-xl hover:scale-[1.02]'
                        : 'bg-slate-900 hover:bg-slate-800 text-white hover:shadow-lg'
            }`}
        >
            {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
            ) : current ? (
                <>Plano Ativo <CheckCircle2 className="w-5 h-5" /></>
            ) : (
                <>Assinar Agora <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
            )}
        </button>
    </div>
)};

const Subscription = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentPlanName, setCurrentPlanName] = useState<string>('free'); // Using Plan Name as identifier for simplicity or use Plan ID in real app
  const [loading, setLoading] = useState(true);
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);

  useEffect(() => {
      loadData();
  }, []);

  const loadData = async () => {
      try {
          const [plansData, subData] = await Promise.all([
              stripeService.getAvailablePlans(),
              stripeService.getCurrentSubscription()
          ]);
          setPlans(plansData || []);
          if (subData) setCurrentPlanName(subData.plan);
      } catch (error) {
          console.error("Erro ao carregar planos", error);
      } finally {
          setLoading(false);
      }
  };

  const handleSubscribe = async (planId: string) => {
      setProcessingPlanId(planId);
      try {
          await stripeService.createCheckoutSession(planId);
      } catch (error) {
          alert("Erro ao processar pagamento. Tente novamente.");
      } finally {
          setProcessingPlanId(null);
      }
  };

  const handleManage = async () => {
      setProcessingPlanId('manage');
      try {
        await stripeService.createPortalSession();
      } catch(e) {
          alert("Erro ao abrir portal.");
      } finally {
        setProcessingPlanId(null);
      }
  };

  if (loading) {
      return (
          <div className="flex justify-center items-center h-96">
              <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
          </div>
      );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold text-slate-900">Escolha o plano ideal para sua empresa</h2>
        <p className="text-slate-500 mt-4 text-lg">
            Automatize suas cobranças e recupere receita com o poder da Inteligência Artificial.
            Cancele a qualquer momento.
        </p>
      </div>

      {plans.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200 mx-4">
              <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500">Nenhum plano disponível no momento.</p>
          </div>
      ) : (
          <div className="grid md:grid-cols-3 gap-8 px-4 items-start pt-8">
              {plans.map((plan) => (
                  <PlanCard 
                    key={plan.id}
                    plan={plan}
                    // Comparison logic: If plan name matches current subscription name. 
                    // ideally use plan IDs, but legacy uses names.
                    current={plan.name.toLowerCase() === currentPlanName?.toLowerCase()}
                    onSubscribe={() => handleSubscribe(plan.id)}
                    loading={processingPlanId === plan.id}
                  />
              ))}
          </div>
      )}

      {currentPlanName !== 'free' && (
          <div className="bg-slate-900 rounded-2xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl mx-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 translate-y-1/2 -translate-x-1/2"></div>
              
              <div className="relative z-10">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                      <CreditCard className="w-6 h-6 text-indigo-400" />
                      Gerenciar Assinatura
                  </h3>
                  <p className="text-slate-400 mt-2 max-w-lg">
                      Acesse o portal do cliente seguro para baixar notas fiscais, trocar cartão de crédito ou alterar seu plano.
                  </p>
              </div>
              <button 
                onClick={handleManage}
                disabled={!!processingPlanId}
                className="relative z-10 bg-white text-slate-900 px-6 py-3 rounded-xl font-bold hover:bg-slate-100 transition-colors shadow-lg flex items-center gap-2 disabled:opacity-70 group"
              >
                  {processingPlanId === 'manage' ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Acessar Portal <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>}
              </button>
          </div>
      )}

      <div className="border-t border-slate-200 pt-10 mx-4">
          <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Perguntas Frequentes
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                  <h4 className="font-bold text-slate-800 mb-2">Preciso pagar pelo WhatsApp a parte?</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">Não! A conexão com a API oficial está inclusa na tecnologia. Você paga apenas as taxas de conversação padrão da Meta (se houver) diretamente para eles, sem ágio.</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                  <h4 className="font-bold text-slate-800 mb-2">Como funciona a garantia?</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">Oferecemos 7 dias de garantia incondicional. Se não gostar, devolvemos seu dinheiro sem perguntas. Basta cancelar no portal.</p>
              </div>
          </div>
      </div>
    </div>
  );
};

export default Subscription;