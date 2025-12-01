
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
    Settings
} from 'lucide-react';
import { adminSettingsService, AdminConfig } from '../../services/adminSettings';

const AdminSettings = () => {
    const [config, setConfig] = useState<AdminConfig | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            const data = await adminSettingsService.getConfig();
            setConfig(data);
        } catch (error) {
            console.error("Failed to load settings");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
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

            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Configurações Gerais</h2>
                    <p className="text-slate-500">Ajustes globais da plataforma SaaS.</p>
                </div>
                <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-md transition-all hover:shadow-lg disabled:opacity-70"
                >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Salvar Alterações
                </button>
            </div>

            <div className="grid gap-6">
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
        </div>
    );
};

export default AdminSettings;
