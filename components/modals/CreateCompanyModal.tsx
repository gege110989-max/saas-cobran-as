import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  User, 
  Mail, 
  CreditCard, 
  Loader2, 
  Plus, 
  X,
  Image as ImageIcon
} from 'lucide-react';
import { adminService } from '../../services/admin';
import { Plan } from '../../types';

interface CreateCompanyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => void;
    isLoading: boolean;
}

export const CreateCompanyModal = ({ isOpen, onClose, onSave, isLoading }: CreateCompanyModalProps) => {
    const [formData, setFormData] = useState({
        name: '',
        ownerName: '',
        email: '',
        plan: '',
        logoUrl: ''
    });
    const [plans, setPlans] = useState<Plan[]>([]);
    const [isLoadingPlans, setIsLoadingPlans] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadPlans();
        }
    }, [isOpen]);

    const loadPlans = async () => {
        setIsLoadingPlans(true);
        try {
            const data = await adminService.getPlans();
            const safeData = Array.isArray(data) ? data : [];
            setPlans(safeData);
            // Default to first plan if available and none selected
            if (safeData.length > 0 && !formData.plan) {
                setFormData(prev => ({ ...prev, plan: safeData[0].id }));
            }
        } catch (error) {
            console.error("Erro ao carregar planos", error);
            setPlans([]);
        } finally {
            setIsLoadingPlans(false);
        }
    };

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-200">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
                    <h3 className="text-lg font-bold text-slate-900">Nova Empresa</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Empresa</label>
                        <div className="relative">
                            <Building2 className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                            <input 
                                type="text" 
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                                placeholder="Ex: Tech Solutions Ltda"
                            />
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">URL da Logomarca (Opcional)</label>
                        <div className="relative">
                            <ImageIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                            <input 
                                type="url" 
                                value={formData.logoUrl}
                                onChange={(e) => setFormData({...formData, logoUrl: e.target.value})}
                                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                                placeholder="https://exemplo.com/logo.png"
                            />
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Dono</label>
                        <div className="relative">
                            <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                            <input 
                                type="text" 
                                required
                                value={formData.ownerName}
                                onChange={(e) => setFormData({...formData, ownerName: e.target.value})}
                                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                                placeholder="Ex: João Silva"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">E-mail Administrativo</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                            <input 
                                type="email" 
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                                placeholder="joao@empresa.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Plano Inicial</label>
                        <div className="relative">
                            <CreditCard className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                            <select 
                                value={formData.plan}
                                onChange={(e) => setFormData({...formData, plan: e.target.value})}
                                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 bg-white"
                                disabled={isLoadingPlans}
                            >
                                <option value="">Selecione um plano...</option>
                                {plans.map((plan) => (
                                    <option key={plan.id} value={plan.id}>
                                        {plan.name} ({plan.price === 0 ? 'Grátis' : `R$ ${plan.price}`})
                                    </option>
                                ))}
                            </select>
                            {isLoadingPlans && (
                                <div className="absolute right-3 top-3">
                                    <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                                </div>
                            )}
                        </div>
                        {plans.length === 0 && !isLoadingPlans && (
                            <p className="text-xs text-rose-500 mt-1">Nenhum plano cadastrado no sistema.</p>
                        )}
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button 
                            type="button" 
                            onClick={onClose}
                            className="flex-1 px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors text-sm"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit"
                            disabled={isLoading || !formData.plan}
                            className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-sm transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            Criar Empresa
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};