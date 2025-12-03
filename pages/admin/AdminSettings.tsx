import React, { useState, useEffect } from 'react';
import { CreditCard, List, Sparkles, Loader2, Save, Plus, Edit2, Trash2 } from 'lucide-react';
import { adminService } from '../../services/admin';
import { Plan } from '../../types';

const AdminSettings = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<Partial<Plan>>({});
  const [featuresInput, setFeaturesInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const data = await adminService.getPlans();
      setPlans(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (plan: Plan) => {
    setCurrentPlan(plan);
    setFeaturesInput(plan.features.join('\n'));
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
      if (window.confirm("Tem certeza que deseja excluir este plano? Esta ação não pode ser desfeita.")) {
          try {
              await adminService.deletePlan(id);
              await loadPlans();
          } catch (error: any) {
              alert("Erro ao excluir plano: " + (error.message || "Erro desconhecido"));
          }
      }
  };

  const handleCreate = () => {
    setCurrentPlan({
      name: '',
      description: '',
      price: 0,
      interval: 'month',
      limits: {},
      isActive: true,
      isPublic: true,
      isRecommended: false,
      features: []
    });
    setFeaturesInput('');
    setIsEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const planData = {
        ...currentPlan,
        features: featuresInput.split('\n').filter(f => f.trim() !== '')
    };

    try {
        if (currentPlan.id) {
            await adminService.updatePlan(currentPlan.id, planData);
        } else {
            // @ts-ignore
            await adminService.createPlan(planData);
        }
        await loadPlans();
        setIsEditing(false);
    } catch (error: any) {
        alert("Erro ao salvar plano: " + (error.message || "Erro desconhecido"));
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-bold text-slate-900">Configurações do Sistema</h2>
            <p className="text-slate-500">Gerencie planos de assinatura e parâmetros globais.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-900">Planos de Assinatura</h3>
            <button onClick={handleCreate} className="text-sm bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2 transition-colors">
                <Plus className="w-4 h-4" /> Novo Plano
            </button>
        </div>

        {isEditing ? (
            <form onSubmit={handleSave} className="overflow-y-auto p-6 space-y-5 bg-slate-50/50">
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-700">Nome do Plano</label>
                    <input type="text" required value={currentPlan.name || ''} onChange={e => setCurrentPlan({...currentPlan, name: e.target.value})} className="w-full border border-slate-200 p-2 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="Ex: Pro" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-700">Intervalo</label>
                    <select value={currentPlan.interval || 'month'} onChange={e => setCurrentPlan({...currentPlan, interval: e.target.value as 'month' | 'year'})} className="w-full border border-slate-200 p-2 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500">
                        <option value="month">Mensal</option>
                        <option value="year">Anual</option>
                    </select>
                  </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700">Descrição Curta</label>
                <input type="text" value={currentPlan.description || ''} onChange={e => setCurrentPlan({...currentPlan, description: e.target.value})} className="w-full border border-slate-200 p-2 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="Ex: Para empresas em crescimento" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700">Preço (R$)</label>
                  <input type="number" required value={currentPlan.price || 0} onChange={e => setCurrentPlan({...currentPlan, price: parseFloat(e.target.value)})} className="w-full border border-slate-200 p-2 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700">Stripe Price ID</label>
                  <div className="relative">
                      <CreditCard className="absolute left-2 top-2.5 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        value={currentPlan.stripeId || ''} 
                        onChange={e => setCurrentPlan({...currentPlan, stripeId: e.target.value})} 
                        className="w-full border border-slate-200 pl-8 p-2 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500" 
                        placeholder="price_1H..." 
                      />
                  </div>
                </div>
              </div>

              <div>
                  <label className="block text-sm font-medium mb-1 flex items-center gap-2 text-slate-700">
                      <List className="w-4 h-4 text-slate-500" /> Funcionalidades (uma por linha)
                  </label>
                  <textarea 
                    value={featuresInput}
                    onChange={(e) => setFeaturesInput(e.target.value)}
                    rows={6}
                    className="w-full border border-slate-200 p-3 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500"
                    placeholder="Até 50 clientes&#10;Integração Asaas&#10;Cobrança WhatsApp..."
                  ></textarea>
                  <p className="text-xs text-slate-400 mt-1">Cada linha será um item com "check" na lista do plano.</p>
              </div>
              
              <div className="flex flex-col gap-3 p-4 bg-white rounded-lg border border-slate-200">
                <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                  <input type="checkbox" checked={currentPlan.isActive || false} onChange={e => setCurrentPlan({...currentPlan, isActive: e.target.checked})} className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4" /> 
                  <span className="font-medium text-slate-700">Ativo (Existente no sistema)</span>
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                  <input type="checkbox" checked={currentPlan.isPublic || false} onChange={e => setCurrentPlan({...currentPlan, isPublic: e.target.checked})} className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4" /> 
                  <span className="font-medium text-slate-700">Público (Visível na página de Assinatura)</span>
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                  <input type="checkbox" checked={currentPlan.isRecommended || false} onChange={e => setCurrentPlan({...currentPlan, isRecommended: e.target.checked})} className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4" /> 
                  <span className="font-medium text-indigo-700 flex items-center gap-1"><Sparkles className="w-4 h-4" /> Marcar como Recomendado/Destaque</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 text-slate-700 hover:bg-slate-200 rounded-lg transition-colors font-medium">Cancelar</button>
                <button type="submit" disabled={isSaving} className="px-6 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors font-bold shadow-sm">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar Alterações
                </button>
              </div>
            </form>
        ) : (
            <div className="divide-y divide-slate-100">
                {plans.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">Nenhum plano cadastrado.</div>
                ) : (
                    plans.map(plan => (
                        <div key={plan.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
                            <div>
                                <h4 className="font-bold text-slate-900">{plan.name}</h4>
                                <div className="text-sm text-slate-500">
                                    R$ {plan.price}/{plan.interval} • {plan.isActive ? 'Ativo' : 'Inativo'} • {plan.isPublic ? 'Público' : 'Oculto'}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleEdit(plan)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDelete(plan.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default AdminSettings;