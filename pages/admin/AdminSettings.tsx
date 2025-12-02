
import React, { useState, useEffect } from 'react';
import { 
    Save, 
    Globe, 
    Mail, 
    Clock, 
    ShieldAlert, 
    Loader2, 
    CheckCircle2, 
    ToggleLeft, 
    ToggleRight, 
    Settings,
    CreditCard,
    Plus,
    Edit2,
    X,
    Check
} from 'lucide-react';
import { adminSettingsService, AdminConfig } from '../../services/adminSettings';
import { adminService } from '../../services/admin';
import { Plan } from '../../types';

const AdminSettings = () => {
    const [config, setConfig] = useState<AdminConfig | null>(null);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [activeTab, setActiveTab] = useState<'general' | 'plans'>('general');
    
    // Loading States
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    // Modal State
    const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
    const [currentPlan, setCurrentPlan] = useState<Partial<Plan>>({
        name: '',
        price: 0,
        interval: 'month',
        features: [],
        limits: { users: 1, whatsapp_messages: 100 },
        isActive: true,
        isPublic: true
    });
    const [featureInput, setFeatureInput] = useState('');

    const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

    useEffect(() => {
        loadAllData();
    }, []);

    const loadAllData = async () => {
        setIsLoading(true);
        try {
            const [configData, plansData] = await Promise.all([
                adminSettingsService.getConfig(),
                adminService.getPlans()
            ]);
            setConfig(configData);
            setPlans(plansData);
        } catch (error) {
            console.error("Failed to load settings", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveConfig = async () => {
        if (!config) return;
        setIsSaving(true);
        try {
            await adminSettingsService.saveConfig(config);
            showToast("Configurações globais atualizadas com sucesso!");
        } catch (error) {
            showToast("Erro ao salvar configurações.", 'error');
        } finally {
            setIsSaving(false);
        }
    };

    // --- Plan Management Logic ---

    const openPlanModal = (plan?: Plan) => {
        if (plan) {
            setCurrentPlan({ ...plan });
        } else {
            setCurrentPlan({
                name: '',
                description: '',
                price: 0,
                interval: 'month',
                features: [],
                limits: { users: 1, whatsapp_messages: 1000 },
                isActive: true,
                isPublic: true
            });
        }
        setFeatureInput('');
        setIsPlanModalOpen(true);
    };

    const handleAddFeature = () => {
        if (featureInput.trim()) {
            setCurrentPlan(prev => ({
                ...prev,
                features: [...(prev.features || []), featureInput.trim()]
            }));
            setFeatureInput('');
        }
    };

    const handleRemoveFeature = (index: number) => {
        setCurrentPlan(prev => ({
            ...prev,
            features: (prev.features || []).filter((_, i) => i !== index)
        }));
    };

    const handleSavePlan = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (currentPlan.id) {
                await adminService.updatePlan(currentPlan.id, currentPlan);
                showToast(`Plano ${currentPlan.name} atualizado!`);
            } else {
                await adminService.createPlan(currentPlan as Plan); // Cast as Plan assuming required fields are filled
                showToast(`Plano ${currentPlan.name} criado!`);
            }
            // Reload list
            const updatedPlans = await adminService.getPlans();
            setPlans(updatedPlans);
            setIsPlanModalOpen(false);
        } catch (error) {
            console.error(error);
            showToast("Erro ao salvar plano.", 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    if (isLoading || !config) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 relative pb-20">
            {toast && (
                <div className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-lg shadow-xl text-white text-sm font-medium animate-in slide-in-from-top-5 fade-in duration-300 flex items-center gap-2 ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
                    {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                    {toast.msg}
                </div>
            )}

            {/* Plan Modal */}
            {isPlanModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
                            <h3 className="text-lg font-bold text-slate-900">{currentPlan.id ? 'Editar Plano' : 'Novo Plano'}</h3>
                            <button onClick={() => setIsPlanModalOpen(false)}><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
                        </div>
                        
                        <form onSubmit={handleSavePlan} className="p-6 space-y-4 overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Plano</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={currentPlan.name}
                                        onChange={(e) => setCurrentPlan({...currentPlan, name: e.target.value})}
                                        className="w-full border-slate-200 rounded-lg focus:ring-indigo-500 p-2 text-sm"
                                        placeholder="Ex: Profissional"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Preço (R$)</label>
                                    <input 
                                        type="number" 
                                        required
                                        min="0"
                                        step="0.01"
                                        value={currentPlan.price}
                                        onChange={(e) => setCurrentPlan({...currentPlan, price: parseFloat(e.target.value)})}
                                        className="w-full border-slate-200 rounded-lg focus:ring-indigo-500 p-2 text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Descrição Curta</label>
                                <input 
                                    type="text" 
                                    value={currentPlan.description || ''}
                                    onChange={(e) => setCurrentPlan({...currentPlan, description: e.target.value})}
                                    className="w-full border-slate-200 rounded-lg focus:ring-indigo-500 p-2 text-sm"
                                    placeholder="Ex: Ideal para pequenas empresas..."
                                />
                            </div>

                            {/* Limites */}
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Limites do Sistema</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1">Máx. Usuários</label>
                                        <input 
                                            type="number" 
                                            value={currentPlan.limits?.users || 0}
                                            onChange={(e) => setCurrentPlan({
                                                ...currentPlan, 
                                                limits: { ...currentPlan.limits, users: parseInt(e.target.value) }
                                            })}
                                            className="w-full border-slate-200 rounded p-1.5 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1">Msg WhatsApp/mês</label>
                                        <input 
                                            type="number" 
                                            value={currentPlan.limits?.whatsapp_messages || 0}
                                            onChange={(e) => setCurrentPlan({
                                                ...currentPlan, 
                                                limits: { ...currentPlan.limits, whatsapp_messages: parseInt(e.target.value) }
                                            })}
                                            className="w-full border-slate-200 rounded p-1.5 text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Features */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Funcionalidades (Lista)</label>
                                <div className="flex gap-2 mb-2">
                                    <input 
                                        type="text" 
                                        value={featureInput}
                                        onChange={(e) => setFeatureInput(e.target.value)}
                                        className="flex-1 border-slate-200 rounded-lg focus:ring-indigo-500 p-2 text-sm"
                                        placeholder="Ex: Suporte Prioritário"
                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFeature())}
                                    />
                                    <button type="button" onClick={handleAddFeature} className="bg-slate-100 hover:bg-slate-200 p-2 rounded-lg text-slate-600"><Plus className="w-5 h-5"/></button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {currentPlan.features?.map((feat, idx) => (
                                        <span key={idx} className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-xs font-medium border border-indigo-100">
                                            {feat}
                                            <button type="button" onClick={() => handleRemoveFeature(idx)} className="hover:text-indigo-900"><X className="w-3 h-3"/></button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-2">
                                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={currentPlan.isActive}
                                        onChange={(e) => setCurrentPlan({...currentPlan, isActive: e.target.checked})}
                                        className="rounded text-indigo-600 focus:ring-indigo-500"
                                    />
                                    Plano Ativo (Disponível)
                                </label>
                                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={currentPlan.isPublic}
                                        onChange={(e) => setCurrentPlan({...currentPlan, isPublic: e.target.checked})}
                                        className="rounded text-indigo-600 focus:ring-indigo-500"
                                    />
                                    Visível no Site
                                </label>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setIsPlanModalOpen(false)} className="flex-1 px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors text-sm">Cancelar</button>
                                <button type="submit" disabled={isSaving} className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-sm transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-70">
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Salvar Plano
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Painel de Controle</h2>
                    <p className="text-slate-500">Gerencie configurações globais e planos de assinatura.</p>
                </div>
                {activeTab === 'general' ? (
                    <button 
                        onClick={handleSaveConfig}
                        disabled={isSaving}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-md transition-all hover:shadow-lg disabled:opacity-70"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Salvar Alterações
                    </button>
                ) : (
                    <button 
                        onClick={() => openPlanModal()}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-md transition-all hover:shadow-lg"
                    >
                        <Plus className="w-4 h-4" />
                        Criar Novo Plano
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="flex border-b border-slate-100">
                    <button 
                        onClick={() => setActiveTab('general')}
                        className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'general' ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                    >
                        <Settings className="w-4 h-4" /> Geral
                    </button>
                    <button 
                        onClick={() => setActiveTab('plans')}
                        className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'plans' ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                    >
                        <CreditCard className="w-4 h-4" /> Planos & Assinaturas
                    </button>
                </div>

                <div className="p-6 bg-slate-50/30">
                    {activeTab === 'general' ? (
                        <div className="grid gap-6 animate-in fade-in slide-in-from-left-4">
                            {/* Identity Section */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                                    <Globe className="w-5 h-5 text-indigo-600" /> Identidade da Plataforma
                                </h3>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Aplicação</label>
                                        <input 
                                            type="text" 
                                            value={config.appName}
                                            onChange={(e) => setConfig({...config, appName: e.target.value})}
                                            className="w-full border-slate-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">E-mail de Suporte</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                            <input 
                                                type="email" 
                                                value={config.supportEmail}
                                                onChange={(e) => setConfig({...config, supportEmail: e.target.value})}
                                                className="w-full pl-9 pr-4 py-2 border-slate-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Localization Section */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-indigo-600" /> Localização e Padrões
                                </h3>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Moeda Padrão</label>
                                        <select 
                                            value={config.currency}
                                            onChange={(e) => setConfig({...config, currency: e.target.value as 'BRL' | 'USD'})}
                                            className="w-full border-slate-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                                        >
                                            <option value="BRL">BRL (Real Brasileiro)</option>
                                            <option value="USD">USD (Dólar Americano)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Fuso Horário (Timezone)</label>
                                        <select 
                                            value={config.timezone}
                                            onChange={(e) => setConfig({...config, timezone: e.target.value})}
                                            className="w-full border-slate-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                                        >
                                            <option value="America/Sao_Paulo">América/São Paulo (GMT-3)</option>
                                            <option value="UTC">UTC (Universal)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* System Control Section */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                                    <ShieldAlert className="w-5 h-5 text-indigo-600" /> Controle do Sistema
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                                        <div>
                                            <label className="font-bold text-slate-700">Permitir Novos Cadastros</label>
                                            <p className="text-xs text-slate-500">Se desativado, o formulário de /signup será bloqueado.</p>
                                        </div>
                                        <button 
                                            onClick={() => setConfig({...config, allowSignups: !config.allowSignups})}
                                            className={`text-2xl transition-colors ${config.allowSignups ? 'text-emerald-500' : 'text-slate-300'}`}
                                        >
                                            {config.allowSignups ? <ToggleRight className="w-10 h-10" /> : <ToggleLeft className="w-10 h-10" />}
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-100">
                                        <div>
                                            <label className="font-bold text-amber-900">Modo de Manutenção</label>
                                            <p className="text-xs text-amber-700">Bloqueia o acesso de todos os usuários (exceto Admin).</p>
                                        </div>
                                        <button 
                                            onClick={() => setConfig({...config, maintenanceMode: !config.maintenanceMode})}
                                            className={`text-2xl transition-colors ${config.maintenanceMode ? 'text-amber-600' : 'text-slate-300'}`}
                                        >
                                            {config.maintenanceMode ? <ToggleRight className="w-10 h-10" /> : <ToggleLeft className="w-10 h-10" />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            {plans.length === 0 ? (
                                <div className="text-center py-12 text-slate-400">
                                    Nenhum plano criado. Clique em "Criar Novo Plano" para começar.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {plans.map((plan) => (
                                        <div key={plan.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all relative group">
                                            <button 
                                                onClick={() => openPlanModal(plan)}
                                                className="absolute top-4 right-4 text-slate-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                                                {plan.isActive ? (
                                                    <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Ativo</span>
                                                ) : (
                                                    <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Inativo</span>
                                                )}
                                            </div>
                                            
                                            <div className="mb-4">
                                                <span className="text-2xl font-bold text-slate-900">R$ {plan.price.toFixed(2)}</span>
                                                <span className="text-sm text-slate-500">/{plan.interval === 'month' ? 'mês' : 'ano'}</span>
                                            </div>
                                            
                                            <p className="text-sm text-slate-600 mb-4 h-10 line-clamp-2">{plan.description}</p>
                                            
                                            <div className="space-y-2 border-t border-slate-100 pt-4">
                                                <div className="flex justify-between text-xs text-slate-500">
                                                    <span>Usuários:</span>
                                                    <span className="font-bold text-slate-700">{plan.limits.users === 0 ? 'Ilimitado' : plan.limits.users}</span>
                                                </div>
                                                <div className="flex justify-between text-xs text-slate-500">
                                                    <span>Mensagens:</span>
                                                    <span className="font-bold text-slate-700">{plan.limits.whatsapp_messages === 0 ? 'Ilimitado' : plan.limits.whatsapp_messages}</span>
                                                </div>
                                            </div>

                                            <div className="mt-4 flex flex-wrap gap-1">
                                                {plan.features.slice(0, 3).map((f, i) => (
                                                    <span key={i} className="text-[10px] bg-slate-50 text-slate-600 px-2 py-1 rounded border border-slate-100">{f}</span>
                                                ))}
                                                {plan.features.length > 3 && (
                                                    <span className="text-[10px] text-slate-400 px-1 py-1">+{plan.features.length - 3}</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminSettings;
