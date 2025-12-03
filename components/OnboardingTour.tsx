
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ChevronRight, Check } from 'lucide-react';

const TOUR_STEPS = [
  {
    targetId: 'welcome-modal', // Special ID for initial modal
    title: 'Bem-vindo ao Movicobrança!',
    content: 'Vamos configurar sua máquina de recuperação de crédito automática em 3 passos simples.',
    position: 'center'
  },
  {
    targetId: 'tour-integrations',
    title: '1. Conecte seus Canais',
    content: 'Aqui você vincula sua conta do Asaas (para ler os boletos) e seu WhatsApp (para enviar as mensagens). Sem isso, o sistema não funciona.',
    position: 'right',
    path: '/integrations'
  },
  {
    targetId: 'tour-billing',
    title: '2. Régua de Cobrança',
    content: 'Defina QUANDO as mensagens serão enviadas: 2 dias antes? No dia do vencimento? Configure a frequência aqui.',
    position: 'right',
    path: '/billing'
  },
  {
    targetId: 'tour-ai',
    title: '3. Inteligência Artificial',
    content: 'Ajuste como a IA deve responder seus clientes. Defina o tom de voz e os limites de negociação.',
    position: 'right',
    path: '/ai-config'
  },
  {
    targetId: 'tour-dashboard',
    title: 'Tudo pronto!',
    content: 'Acompanhe seus resultados, MRR e clientes recuperados diretamente no seu Dashboard.',
    position: 'right',
    path: '/'
  }
];

const OnboardingTour = () => {
  const [stepIndex, setStepIndex] = useState(-1); // -1 = not started/loading check
  const [coords, setCoords] = useState<{top: number, left: number, width: number, height: number} | null>(null);
  const navigate = useNavigate();
  const tourRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const isCompleted = localStorage.getItem('movicobranca_onboarding_completed');
    if (!isCompleted) {
      // Start tour
      setTimeout(() => setStepIndex(0), 1000);
    }
  }, []);

  useEffect(() => {
    if (stepIndex >= 0 && stepIndex < TOUR_STEPS.length) {
      const step = TOUR_STEPS[stepIndex];
      
      // If specific path needed, navigate
      if (step.path && window.location.hash !== `#${step.path}`) {
          navigate(step.path);
      }

      // Wait for navigation/render then calculate position
      setTimeout(() => {
          if (step.targetId === 'welcome-modal') {
              setCoords(null); // Center modal
          } else {
              const el = document.getElementById(step.targetId);
              if (el) {
                  const rect = el.getBoundingClientRect();
                  setCoords({
                      top: rect.top,
                      left: rect.left,
                      width: rect.width,
                      height: rect.height
                  });
              }
          }
      }, 300);
    }
  }, [stepIndex, navigate]);

  const handleNext = () => {
    if (stepIndex < TOUR_STEPS.length - 1) {
      setStepIndex(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = () => {
    localStorage.setItem('movicobranca_onboarding_completed', 'true');
    setStepIndex(-1); // Close
  };

  const handleSkip = () => {
    if (window.confirm("Deseja pular o tutorial? Você pode não descobrir recursos importantes.")) {
        handleFinish();
    }
  };

  if (stepIndex === -1) return null;

  const currentStep = TOUR_STEPS[stepIndex];
  const isCenter = !coords;

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden">
      {/* Backdrop with Hole (Spotlight) or Full Dim */}
      {isCenter ? (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-all duration-500"></div>
      ) : (
          <div 
            className="absolute inset-0 bg-slate-900/50 transition-all duration-300"
            style={{
                clipPath: coords ? `polygon(
                    0% 0%, 
                    0% 100%, 
                    100% 100%, 
                    100% 0%, 
                    0% 0%, 
                    ${coords.left}px ${coords.top}px, 
                    ${coords.left + coords.width}px ${coords.top}px, 
                    ${coords.left + coords.width}px ${coords.top + coords.height}px, 
                    ${coords.left}px ${coords.top + coords.height}px, 
                    ${coords.left}px ${coords.top}px
                )` : 'none'
            }}
          ></div>
      )}

      {/* Spotlight Border (Visual Cue) */}
      {!isCenter && coords && (
          <div 
            className="absolute border-2 border-white rounded-lg shadow-[0_0_0_4px_rgba(59,130,246,0.5)] transition-all duration-300 animate-pulse pointer-events-none"
            style={{
                top: coords.top - 4,
                left: coords.left - 4,
                width: coords.width + 8,
                height: coords.height + 8
            }}
          />
      )}

      {/* Card/Tooltip */}
      <div 
        ref={tourRef}
        className={`absolute bg-white rounded-2xl shadow-2xl p-6 w-[350px] transition-all duration-500 flex flex-col gap-4 animate-in zoom-in-95 fade-in ${isCenter ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' : ''}`}
        style={!isCenter && coords ? {
            top: coords.top,
            left: coords.left + coords.width + 20
        } : {}}
      >
        <button onClick={handleSkip} className="absolute top-4 right-4 text-slate-300 hover:text-slate-500">
            <X className="w-5 h-5" />
        </button>

        <div className="space-y-2">
            <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 font-bold mb-2">
                {stepIndex + 1}
            </div>
            <h3 className="text-xl font-bold text-slate-900">{currentStep.title}</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
                {currentStep.content}
            </p>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-2">
            <div className="flex gap-1">
                {TOUR_STEPS.map((_, idx) => (
                    <div 
                        key={idx} 
                        className={`w-2 h-2 rounded-full transition-colors ${idx === stepIndex ? 'bg-brand-600' : 'bg-slate-200'}`}
                    />
                ))}
            </div>
            <button 
                onClick={handleNext}
                className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2 rounded-lg text-sm font-bold shadow-md shadow-brand-100 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
            >
                {stepIndex === TOUR_STEPS.length - 1 ? 'Começar' : 'Próximo'}
                {stepIndex === TOUR_STEPS.length - 1 ? <Check className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTour;
