import React, { useState, useEffect, useRef } from 'react';
import { 
    Megaphone, 
    Plus, 
    Users, 
    Send, 
    Clock, 
    CheckCircle2, 
    BarChart3, 
    AlertCircle,
    Calendar,
    ChevronRight,
    Play,
    Loader2,
    X,
    Trash2,
    Save,
    Pause,
    Sparkles,
    AlertTriangle,
    Wand2,
    Bot,
    Lightbulb,
    PauseCircle
} from 'lucide-react';
import { Campaign } from '../types';
import { getCampaigns, createCampaign, updateCampaignStatus, deleteCampaign } from '../services/campaigns';
import { improveTemplateAI, generateSmartReply, generateCampaignStrategy } from '../services/ai';

interface CampaignCardProps {
    campaign: Campaign;
    onAction: (id: string, action: string) => void;
    isLoadingAction: boolean;
}

const CampaignCard: React.FC<CampaignCardProps> = ({ campaign, onAction, isLoadingAction }) => {
    const getStatusColor = (s: string) => {
        switch(s) {
            case 'completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'sending': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'paused': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'scheduled': return 'bg-slate-100 text-slate-700 border-slate-200';
            case 'draft': return 'bg-slate-100 text-slate-600 border-slate-200';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    const getStatusLabel = (s: string) => {
         switch(s) {
            case 'completed': return 'Concluída';
            case 'sending': return 'Enviando...';
            case 'paused': return 'Pausada';
            case 'scheduled': return 'Agendada';
            case 'draft': return 'Rascunho';
            default: return s;
        }
    };

    const percent = campaign.totalTargets > 0 ? Math.round((campaign.sentCount / campaign.totalTargets) * 100) : 0;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow relative group">
            <button 
                onClick={() => {
                    if (window.confirm('Tem certeza que deseja excluir esta campanha?')) {
                        onAction(campaign.id, 'delete');
                    }
                }}
                className="absolute top-4 right-4 p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                title="Excluir Campanha"
            >
                <Trash2 className="w-4 h-4" />
            </button>

            <div className="flex justify-between items-start mb-4 pr-8">
                <div>
                    <h3 className="font-bold text-slate-900 text-lg">{campaign.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${getStatusColor(campaign.status)}`}>
                            {getStatusLabel(campaign.status)}
                        </span>
                        <span className="text-xs text-slate-500">{campaign.createdAt}</span>
                    </div>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                    {campaign.type === 'promotional' && <Megaphone className="w-5 h-5 text-indigo-500" />}
                    {campaign.type === 'informational' && <Calendar className="w-5 h-5 text-blue-500" />}
                    {campaign.type === 'collection' && <AlertCircle className="w-5 h-5 text-rose-500" />}
                </div>
            </div>

            {campaign.status === 'sending' || campaign.status === 'paused' || campaign.status === 'completed' ? (
                <div className="space-y-3">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span className="flex items-center gap-1">
                            Progresso
                            {campaign.status === 'paused' && <span className="text-amber-600 font-bold text-[10px] uppercase flex items-center gap-0.5"><PauseCircle className="w-3 h-3"/> (Pausado)</span>}
                        </span>
                        <span>{percent}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                                campaign.status === 'completed' ? 'bg-emerald-500' : 
                                campaign.status === 'paused' ? 'bg-amber-400' : 
                                'bg-blue-500 animate-pulse'
                            }`} 
                            style={{ width: `${percent}%` }} 
                        />
                    </div>
                    
                    {/* Controls for Active/Paused Campaigns */}
                    {campaign.status !== 'completed' && (
                        <div className="flex justify-center mt-2">
                             {campaign.status === 'sending' ? (
                                 <button 
                                    onClick={() => onAction(campaign.id, 'pause')}
                                    disabled={isLoadingAction}
                                    className="text-xs flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 font-medium hover:bg-amber-100 px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                                 >
                                     {isLoadingAction ? <Loader2 className="w-3 h-3 animate-spin"/> : <Pause className="w-3 h-3" />}
                                     Pausar Envio
                                 </button>
                             ) : (
                                 <button 
                                    onClick={() => onAction(campaign.id, 'resume')}
                                    disabled={isLoadingAction}
                                    className="text-xs flex items-center gap-1 text-blue-700 bg-blue-50 border border-blue-200 font-medium hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                                 >
                                     {isLoadingAction ? <Loader2 className="w-3 h-3 animate-spin"/> : <Play className="w-3 h-3" />}
                                     Retomar Envio
                                 </button>
                             )}
                        </div>
                    )}

                    <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                        <div className="p-2 bg-slate-50 rounded border border-slate-100">
                            <p className="text-lg font-bold text-slate-900">{campaign.sentCount}</p>
                            <p className="text-[10px] text-slate-500 uppercase">Enviados</p>
                        </div>
                         <div className="p-2 bg-slate-50 rounded border border-slate-100">
                            <p className="text-lg font-bold text-emerald-600">{campaign.readCount}</p>
                            <p className="text-[10px] text-slate-500 uppercase">Lidos</p>
                        </div>
                        <div className="p-2 bg-slate-50 rounded border border-slate-100">
                             <p className="text-lg font-bold text-slate-900">{campaign.totalTargets}</p>
                            <p className="text-[10px] text-slate-500 uppercase">Total</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                     <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Users className="w-4 h-4" />
                        <span>Público: {campaign.audienceFilter === 'all' ? 'Todos os contatos' : campaign.audienceFilter === 'overdue' ? 'Apenas Inadimplentes' : 'Apenas Ativos'}</span>
                     </div>
                     <div className="flex items-center gap-2 text-sm text-slate-600">
                         <BarChart3 className="w-4 h-4" />
                         <span>Estimativa: {campaign.totalTargets} mensagens</span>
                     </div>
                     <div className="pt-2">
                        {campaign.status === 'draft' ? (
                             <button 
                                onClick={() => onAction(campaign.id, 'send')}
                                disabled={isLoadingAction}
                                className="w-full py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70 disabled:active:scale-100 shadow-sm"
                            >
                                {isLoadingAction ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                                Iniciar Envio
                             </button>
                        ) : (
                             <div className="w-full py-2 bg-amber-50 text-amber-700 border border-amber-100 rounded-lg text-sm font-medium text-center flex items-center justify-center gap-2">
                                <Clock className="w-3 h-3" /> Aguardando Horário
                             </div>
                        )}
                     </div>
                </div>
            )}
        </div>
    );
};

const Campaigns = () => {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    
    // Action States
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

    // AI States
    const [isImproving, setIsImproving] = useState(false);
    const [isGeneratingVariation, setIsGeneratingVariation] = useState(false);
    const [aiWarning, setAiWarning] = useState<string | null>(null);
    
    // AI Assistant State
    const [isAssistantOpen, setIsAssistantOpen] = useState(false);
    const [assistantObjective, setAssistantObjective] = useState('');
    const [isAssistantThinking, setIsAssistantThinking] = useState(false);

    // UseRef to track active intervals to prevent leaks or duplicates
    const simulationIntervals = useRef<{[key: string]: any}>({});
    
    // Form State
    const [newCampaign, setNewCampaign] = useState({
        name: '',
        type: 'promotional' as Campaign['type'],
        audienceFilter: 'all',
        messageContent: '',
    });
    
    // UI Feedback
    const [step, setStep] = useState(1);
    const [estimatedAudience, setEstimatedAudience] = useState(1240); // Mock

    useEffect(() => {
        loadData();
        return () => {
            // Cleanup all intervals on unmount
            Object.values(simulationIntervals.current).forEach((interval) => clearInterval(interval as any));
        };
    }, []);

    const loadData = async () => {
        try {
            const data = await getCampaigns();
            setCampaigns(data);
            
            // Resume simulation for any campaign currently 'sending'
            data.forEach(c => {
                if (c.status === 'sending') {
                    startSimulation(c.id, Math.round((c.sentCount / c.totalTargets) * 100));
                }
            });
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const startSimulation = (id: string, startProgress: number = 0) => {
        // Prevent multiple intervals for same ID
        if (simulationIntervals.current[id]) {
            clearInterval(simulationIntervals.current[id]);
        }

        let progress = startProgress;
        
        simulationIntervals.current[id] = setInterval(async () => {
            progress += Math.floor(Math.random() * 5) + 1; // Random increment
            if (progress > 100) progress = 100;

            const status = progress >= 100 ? 'completed' : 'sending';
            
            // Update Backend/Service
            const updated = await updateCampaignStatus(id, status, progress);
            
            // Update Frontend
            if (updated) {
                 setCampaigns(prev => prev.map(c => c.id === id ? updated : c));
            }

            if (progress >= 100) {
                clearInterval(simulationIntervals.current[id]);
                delete simulationIntervals.current[id];
            }
        }, 800);
    };

    const stopSimulation = (id: string) => {
        if (simulationIntervals.current[id]) {
            clearInterval(simulationIntervals.current[id]);
            delete simulationIntervals.current[id];
        }
    }

    const handleCreate = async (initialStatus: 'draft' | 'sending') => {
        setLoading(true);
        try {
            const created = await createCampaign({
                ...newCampaign,
                status: initialStatus,
                totalTargets: estimatedAudience
            });
            
            setCampaigns([created, ...campaigns]);
            
            if (initialStatus === 'sending') {
                startSimulation(created.id);
            }

            setIsCreating(false);
            setStep(1);
            setNewCampaign({ name: '', type: 'promotional', audienceFilter: 'all', messageContent: '' });
        } catch (e) {
            alert("Erro ao criar campanha");
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id: string, action: string) => {
        setActionLoadingId(id);
        
        // Simulating a small delay for UI feedback
        await new Promise(resolve => setTimeout(resolve, 600));

        if (action === 'send') {
            const updated = await updateCampaignStatus(id, 'sending', 0);
            if (updated) {
                setCampaigns(prev => prev.map(c => c.id === id ? updated : c));
                startSimulation(id);
            }
        } else if (action === 'pause') {
            const updated = await updateCampaignStatus(id, 'paused');
            if (updated) {
                setCampaigns(prev => prev.map(c => c.id === id ? updated : c));
                stopSimulation(id);
            }
        } else if (action === 'resume') {
            const campaign = campaigns.find(c => c.id === id);
            if (campaign) {
                const updated = await updateCampaignStatus(id, 'sending');
                if (updated) {
                    setCampaigns(prev => prev.map(c => c.id === id ? updated : c));
                    const currentProgress = campaign.totalTargets > 0 ? Math.round((campaign.sentCount / campaign.totalTargets) * 100) : 0;
                    startSimulation(id, currentProgress);
                }
            }
        } else if (action === 'delete') {
            await deleteCampaign(id);
            setCampaigns(prev => prev.filter(c => c.id !== id));
            stopSimulation(id);
        }
        
        setActionLoadingId(null);
    };

    const handleImproveAI = async () => {
        if (!newCampaign.messageContent) return;
        setIsImproving(true);
        setAiWarning(null);

        try {
            // Pass the campaign type to improve logic
            const improved = await improveTemplateAI(newCampaign.messageContent, newCampaign.type);
            if (improved) {
                const trimmed = improved.trim();
                setNewCampaign(prev => ({ ...prev, messageContent: trimmed }));
                
                // Validation checks
                if (trimmed.length > 1000) {
                    setAiWarning("Atenção: O texto gerado é muito longo para uma mensagem de marketing eficaz no WhatsApp. Recomendamos encurtar.");
                } else if (trimmed.length > 4000) {
                     setAiWarning("Erro: O texto excede o limite de caracteres do WhatsApp.");
                }
            }
        } catch (error) {
            alert("Erro ao melhorar texto com IA.");
        } finally {
            setIsImproving(false);
        }
    };

    const handleGenerateVariationAI = async () => {
        setIsGeneratingVariation(true);
        setAiWarning(null);
        try {
            // Using smart reply generator logic to create a variation based on campaign type context
            const context = `Campanha de Marketing tipo ${newCampaign.type}. Público: ${newCampaign.audienceFilter}.`;
            const prompt = newCampaign.messageContent ? 
                `Crie uma variação criativa e persuasiva para esta mensagem de marketing: "${newCampaign.messageContent}". Use emojis adequados ao tom '${newCampaign.type}' (ex: urgência para cobrança, entusiasmo para promoção) para aumentar o engajamento. Mantenha as variáveis (%name%, etc) se existirem.` :
                `Crie uma mensagem curta e persuasiva para uma campanha de marketing do tipo ${newCampaign.type}. Use emojis adequados ao tom para gerar engajamento. Inclua a variável %name% para o nome do cliente.`;

            const variation = await generateSmartReply(context, prompt);
            
            if (variation) {
                if (window.confirm('A IA gerou uma sugestão:\n\n' + variation + '\n\nDeseja substituir o texto atual?')) {
                    setNewCampaign(prev => ({ ...prev, messageContent: variation.trim() }));
                }
            }
        } catch (error) {
            alert("Erro ao gerar sugestão.");
        } finally {
            setIsGeneratingVariation(false);
        }
    };

    const handleAssistantSubmit = async () => {
        if (!assistantObjective.trim()) return;
        setIsAssistantThinking(true);
        
        try {
            const strategy = await generateCampaignStrategy(assistantObjective);
            if (strategy) {
                setNewCampaign({
                    name: strategy.name || 'Nova Campanha IA',
                    type: strategy.type || 'promotional',
                    audienceFilter: strategy.audienceFilter || 'all',
                    messageContent: strategy.messageContent || ''
                });
                updateAudienceEstimate(strategy.audienceFilter || 'all');
                
                setIsAssistantOpen(false);
                setIsCreating(true);
                setStep(1); // Go to step 1 to review
                setAssistantObjective('');
            }
        } catch (error) {
            alert("Não foi possível gerar a campanha. Tente novamente.");
        } finally {
            setIsAssistantThinking(false);
        }
    };

    const updateAudienceEstimate = (filter: string) => {
        setNewCampaign(prev => ({ ...prev, audienceFilter: filter }));
        // Simulate audience calculation
        if (filter === 'all') setEstimatedAudience(1240);
        else if (filter === 'overdue') setEstimatedAudience(145);
        else if (filter === 'active') setEstimatedAudience(980);
        else if (filter === 'whatsapp') setEstimatedAudience(320);
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-20 relative">
            {/* AI Assistant Modal */}
            {isAssistantOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in duration-200 overflow-hidden">
                        <div className="bg-indigo-600 p-6 text-white flex justify-between items-start">
                            <div className="flex gap-3">
                                <div className="p-2 bg-indigo-500 rounded-lg">
                                    <Bot className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">Assistente de Campanhas</h3>
                                    <p className="text-indigo-100 text-sm">Descreva seu objetivo e a IA criará a campanha.</p>
                                </div>
                            </div>
                            <button onClick={() => setIsAssistantOpen(false)} className="text-indigo-200 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="space-y-4">
                                <label className="block text-sm font-bold text-slate-700">Qual é o objetivo desta campanha?</label>
                                <textarea 
                                    value={assistantObjective}
                                    onChange={(e) => setAssistantObjective(e.target.value)}
                                    placeholder="Ex: Quero recuperar clientes inadimplentes com uma oferta de parcelamento sem juros."
                                    className="w-full h-32 border-slate-200 rounded-lg p-3 text-sm focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                                ></textarea>
                                
                                <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-xs text-indigo-800 flex gap-2">
                                    <Lightbulb className="w-4 h-4 shrink-0" />
                                    <p>A IA vai sugerir o nome, o público-alvo ideal e escreverá a mensagem para você.</p>
                                </div>

                                <div className="flex justify-end pt-2">
                                    <button 
                                        onClick={handleAssistantSubmit}
                                        disabled={isAssistantThinking || !assistantObjective.trim()}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-md transition-colors flex items-center gap-2 disabled:opacity-70"
                                    >
                                        {isAssistantThinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                        Criar Campanha
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {!isCreating ? (
                <>
                    <div className="flex justify-between items-end">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">Campanhas</h2>
                            <p className="text-slate-500">Envie mensagens em massa para sua base de contatos.</p>
                        </div>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setIsAssistantOpen(true)}
                                className="flex items-center gap-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 px-4 py-2.5 rounded-lg font-medium transition-colors"
                            >
                                <Sparkles className="w-4 h-4" />
                                Assistente IA
                            </button>
                            <button 
                                onClick={() => setIsCreating(true)}
                                className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-md transition-all"
                            >
                                <Plus className="w-4 h-4" />
                                Nova Campanha
                            </button>
                        </div>
                    </div>

                    {/* Stats Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <p className="text-sm font-medium text-slate-500">Mensagens Enviadas (Mês)</p>
                            <h3 className="text-2xl font-bold text-slate-900 mt-1">15.4k</h3>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <p className="text-sm font-medium text-slate-500">Taxa de Leitura Média</p>
                            <h3 className="text-2xl font-bold text-emerald-600 mt-1">82%</h3>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <p className="text-sm font-medium text-slate-500">Custo Estimado</p>
                            <h3 className="text-2xl font-bold text-slate-900 mt-1">R$ 0,00 <span className="text-xs font-normal text-slate-400">(Plano Ilimitado)</span></h3>
                        </div>
                    </div>

                    {/* Campaign List */}
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {campaigns.length === 0 ? (
                                <div className="col-span-full py-16 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                    <Megaphone className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p className="text-lg font-medium">Nenhuma campanha criada</p>
                                    <p className="text-sm">Comece criando sua primeira campanha de marketing.</p>
                                </div>
                            ) : (
                                campaigns.map(camp => (
                                    <CampaignCard 
                                        key={camp.id} 
                                        campaign={camp} 
                                        onAction={handleAction} 
                                        isLoadingAction={actionLoadingId === camp.id}
                                    />
                                ))
                            )}
                        </div>
                    )}
                </>
            ) : (
                /* CREATE CAMPAIGN WIZARD */
                <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 border-b border-slate-100 p-6 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-slate-900">Nova Campanha</h2>
                        <button onClick={() => setIsCreating(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <div className="p-8">
                        {/* Progress Steps */}
                        <div className="flex items-center justify-center mb-8">
                            {[1, 2, 3].map((s) => (
                                <div key={s} className="flex items-center">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === s ? 'bg-brand-600 text-white' : step > s ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                        {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
                                    </div>
                                    {s < 3 && <div className={`w-16 h-1 bg-slate-100 mx-2 ${step > s ? 'bg-emerald-500' : ''}`}></div>}
                                </div>
                            ))}
                        </div>

                        {/* Step 1: Details & Audience */}
                        {step === 1 && (
                            <div className="space-y-6 max-w-xl mx-auto animate-in fade-in slide-in-from-right-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Nome da Campanha</label>
                                    <input 
                                        type="text" 
                                        value={newCampaign.name}
                                        onChange={(e) => setNewCampaign({...newCampaign, name: e.target.value})}
                                        className="w-full border-slate-200 rounded-lg focus:ring-brand-500 focus:border-brand-500"
                                        placeholder="Ex: Promoção de Natal"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Tipo de Campanha</label>
                                    <div className="grid grid-cols-3 gap-4">
                                        <button 
                                            onClick={() => setNewCampaign({...newCampaign, type: 'promotional'})}
                                            className={`p-3 rounded-lg border text-sm font-medium transition-all ${newCampaign.type === 'promotional' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 hover:bg-slate-50'}`}
                                        >
                                            Promocional
                                        </button>
                                        <button 
                                            onClick={() => setNewCampaign({...newCampaign, type: 'informational'})}
                                            className={`p-3 rounded-lg border text-sm font-medium transition-all ${newCampaign.type === 'informational' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 hover:bg-slate-50'}`}
                                        >
                                            Informativo
                                        </button>
                                        <button 
                                            onClick={() => setNewCampaign({...newCampaign, type: 'collection'})}
                                            className={`p-3 rounded-lg border text-sm font-medium transition-all ${newCampaign.type === 'collection' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 hover:bg-slate-50'}`}
                                        >
                                            Cobrança
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Público Alvo (Filtro)</label>
                                    <select 
                                        value={newCampaign.audienceFilter}
                                        onChange={(e) => updateAudienceEstimate(e.target.value)}
                                        className="w-full border-slate-200 rounded-lg focus:ring-brand-500 focus:border-brand-500"
                                    >
                                        <option value="all">Todos os contatos</option>
                                        <option value="active">Apenas Ativos (Em dia)</option>
                                        <option value="overdue">Apenas Inadimplentes</option>
                                        <option value="whatsapp">Origem WhatsApp</option>
                                    </select>
                                    <div className="mt-2 flex items-center gap-2 text-sm text-slate-500 bg-slate-50 p-2 rounded">
                                        <Users className="w-4 h-4" />
                                        <span>Estimativa de alcance: <strong>{estimatedAudience} contatos</strong></span>
                                    </div>
                                </div>
                                <div className="flex justify-end pt-4">
                                    <button 
                                        disabled={!newCampaign.name}
                                        onClick={() => setStep(2)}
                                        className="bg-brand-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        Próximo <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Message Content */}
                        {step === 2 && (
                             <div className="grid md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-right-4">
                                <div className="space-y-4">
                                    <label className="block text-sm font-bold text-slate-700">Conteúdo da Mensagem</label>
                                    <div className="relative">
                                        <textarea 
                                            value={newCampaign.messageContent}
                                            onChange={(e) => setNewCampaign({...newCampaign, messageContent: e.target.value})}
                                            className="w-full h-64 border-slate-200 rounded-lg p-4 focus:ring-brand-500 focus:border-brand-500 text-sm leading-relaxed resize-none"
                                            placeholder="Digite sua mensagem aqui..."
                                        ></textarea>
                                        
                                        {/* Variables */}
                                        <div className="absolute bottom-4 left-4 flex gap-2">
                                            {['%name%', '%email%', '%link%'].map(variable => (
                                                <button 
                                                    key={variable}
                                                    onClick={() => setNewCampaign({...newCampaign, messageContent: newCampaign.messageContent + ' ' + variable})}
                                                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs font-mono text-slate-600 border border-slate-200 transition-colors"
                                                >
                                                    {variable}
                                                </button>
                                            ))}
                                        </div>

                                        {/* AI Buttons */}
                                        <div className="absolute bottom-4 right-4 flex gap-2">
                                            <button 
                                                onClick={handleGenerateVariationAI}
                                                disabled={isGeneratingVariation}
                                                className="text-xs bg-white text-emerald-600 border border-emerald-200 hover:bg-emerald-50 px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
                                            >
                                                {isGeneratingVariation ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                                                Gerar Variação
                                            </button>
                                            <button 
                                                onClick={handleImproveAI}
                                                disabled={isImproving || !newCampaign.messageContent}
                                                className="text-xs bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100 px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
                                            >
                                                {isImproving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                                Melhorar com IA
                                            </button>
                                        </div>
                                    </div>
                                    
                                    {aiWarning && (
                                        <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-800 animate-in fade-in slide-in-from-top-2">
                                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                                            {aiWarning}
                                        </div>
                                    )}

                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Pré-visualização (WhatsApp)</label>
                                    <div className="bg-[#e5ddd5] rounded-xl p-4 h-64 overflow-y-auto border border-slate-200 shadow-inner" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                                        <div className="bg-white rounded-lg p-3 shadow-sm max-w-[90%] text-sm text-slate-800 relative">
                                            {newCampaign.messageContent ? (
                                                newCampaign.messageContent.replace('%name%', 'João Silva').replace('%email%', 'joao@email.com').replace('%link%', 'https://...')
                                            ) : (
                                                <span className="text-slate-400 italic">Sua mensagem aparecerá aqui...</span>
                                            )}
                                            <div className="flex justify-end mt-1">
                                                <span className="text-[10px] text-slate-400">10:30</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-4 bg-amber-50 border border-amber-100 rounded-lg p-3 text-sm text-amber-800 flex gap-2">
                                        <AlertCircle className="w-5 h-5 shrink-0" />
                                        <p>Mensagens de marketing devem seguir as políticas do WhatsApp para evitar bloqueio do número.</p>
                                    </div>
                                </div>
                                <div className="col-span-2 flex justify-between pt-4 border-t border-slate-100">
                                    <button 
                                        onClick={() => setStep(1)}
                                        className="text-slate-500 font-medium hover:text-slate-700"
                                    >
                                        Voltar
                                    </button>
                                    <button 
                                        disabled={!newCampaign.messageContent}
                                        onClick={() => setStep(3)}
                                        className="bg-brand-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        Revisar e Enviar <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                             </div>
                        )}

                        {/* Step 3: Review */}
                        {step === 3 && (
                            <div className="max-w-xl mx-auto animate-in fade-in slide-in-from-right-4 space-y-6">
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Send className="w-8 h-8 text-brand-600" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900">Tudo pronto para enviar?</h3>
                                    <p className="text-slate-500">Revise os detalhes da campanha abaixo.</p>
                                </div>

                                <div className="bg-slate-50 rounded-xl p-6 space-y-4 border border-slate-100">
                                    <div className="flex justify-between border-b border-slate-200 pb-2">
                                        <span className="text-slate-500 text-sm">Campanha</span>
                                        <span className="font-bold text-slate-900">{newCampaign.name}</span>
                                    </div>
                                     <div className="flex justify-between border-b border-slate-200 pb-2">
                                        <span className="text-slate-500 text-sm">Público Alvo</span>
                                        <span className="font-bold text-slate-900">{estimatedAudience} contatos</span>
                                    </div>
                                     <div className="flex justify-between border-b border-slate-200 pb-2">
                                        <span className="text-slate-500 text-sm">Custo Envio</span>
                                        <span className="font-bold text-emerald-600">Grátis</span>
                                    </div>
                                    <div className="pt-2">
                                        <span className="text-slate-500 text-xs uppercase font-bold block mb-2">Mensagem</span>
                                        <div className="bg-white p-3 rounded border border-slate-200 text-sm text-slate-600 italic">
                                            "{newCampaign.messageContent}"
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-between pt-4 items-center">
                                     <button 
                                        onClick={() => setStep(2)}
                                        className="text-slate-500 font-medium hover:text-slate-700"
                                    >
                                        Voltar
                                    </button>
                                    
                                    <div className="flex gap-3">
                                        <button 
                                            onClick={() => handleCreate('draft')}
                                            disabled={loading}
                                            className="px-6 py-3 rounded-lg font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 flex items-center gap-2"
                                        >
                                            <Save className="w-4 h-4" />
                                            Salvar Rascunho
                                        </button>
                                        <button 
                                            onClick={() => handleCreate('sending')}
                                            disabled={loading}
                                            className="bg-emerald-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 flex items-center gap-2 transition-transform active:scale-95"
                                        >
                                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                            Confirmar e Disparar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Campaigns;