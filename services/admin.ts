import { supabase } from './supabase';
import { Plan, Company, SaasInvoice } from '../types';

const PLANS_STORAGE_KEY = 'movicobranca_plans_fallback';

const DEFAULT_PLANS: Partial<Plan>[] = [
    {
        id: 'free',
        name: 'Free',
        description: 'Plano Gratuito',
        price: 0,
        interval: 'month',
        limits: { users: 1 },
        isActive: true,
        isPublic: true,
        features: ['1 Usuário', 'Até 50 mensagens/mês']
    },
    {
        id: 'pro',
        name: 'Pro',
        description: 'Plano Profissional',
        price: 199,
        interval: 'month',
        limits: { users: 5 },
        isActive: true,
        isPublic: true,
        isRecommended: true,
        features: ['5 Usuários', 'Mensagens ilimitadas', 'Suporte prioritário']
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        description: 'Plano Empresarial',
        price: 499,
        interval: 'month',
        limits: { users: 20 },
        isActive: true,
        isPublic: true,
        features: ['20 Usuários', 'API dedicada', 'Gerente de conta']
    }
];

export const adminService = {
  getAllCompanies: async (): Promise<Company[]> => {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching companies:", error);
        return [];
    }

    return data.map((c: any) => ({
      id: c.id,
      name: c.name,
      plan: c.plan,
      status: c.status,
      mrr: c.mrr || 0,
      createdAt: new Date(c.created_at).toLocaleDateString('pt-BR'),
      ownerName: c.owner_id || 'Unknown',
      churnRisk: 'low'
    }));
  },

  getSaasInvoices: async (): Promise<SaasInvoice[]> => {
      // Placeholder for fetching invoices
      return [];
  },

  createCompany: async (data: any) => {
      const { error } = await supabase.from('companies').insert([{
          name: data.name,
          plan: data.plan,
          status: 'active',
          logo_url: data.logoUrl
      }]);
      if (error) throw error;
  },

  deleteCompany: async (id: string) => {
      const { error } = await supabase.from('companies').delete().eq('id', id);
      if (error) throw error;
  },

  getCompanyDetails: async (id: string): Promise<Company | null> => {
      const { data, error } = await supabase.from('companies').select('*').eq('id', id).single();
      if (error) return null;
      return {
          id: data.id,
          name: data.name,
          plan: data.plan,
          status: data.status,
          mrr: data.mrr || 0,
          createdAt: new Date(data.created_at).toLocaleDateString('pt-BR'),
          email: 'admin@company.com',
          ownerName: 'Admin User',
          integrationAsaas: 'active',
          integrationWhatsapp: 'active',
          churnRisk: 'low'
      };
  },

  getPlans: async (): Promise<Plan[]> => {
      const { data, error } = await supabase.from('plans').select('*');
      
      if (error) {
          console.warn("Error fetching admin plans (using local fallback):", error.message);
          
          // Try to get from local storage
          const stored = localStorage.getItem(PLANS_STORAGE_KEY);
          if (stored) {
              return JSON.parse(stored);
          }
          
          // If nothing in storage, save default plans and return them
          const defaults = DEFAULT_PLANS.map(p => ({...p, stripeId: '', updated_at: new Date().toISOString()})) as Plan[];
          localStorage.setItem(PLANS_STORAGE_KEY, JSON.stringify(defaults));
          return defaults;
      }

      return (data || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.price,
          interval: p.interval,
          stripeId: p.stripe_id,
          limits: p.limits || {},
          isActive: p.is_active,
          isPublic: p.is_public,
          isRecommended: p.is_recommended,
          features: p.features || []
      }));
  },

  updateCompanyPlan: async (companyId: string, planId: string) => {
      // Placeholder for updating company plan logic
  },

  runAutoBlockRoutine: async () => {
      return { message: "Rotina executada", suspended: 0 };
  },

  createPlan: async (plan: Omit<Plan, 'id'>) => {
      try {
        const { error } = await supabase
            .from('plans')
            .insert([{
                name: plan.name,
                description: plan.description,
                price: plan.price,
                interval: plan.interval,
                stripe_id: plan.stripeId,
                limits: plan.limits,
                is_active: plan.isActive,
                is_public: plan.isPublic,
                is_recommended: plan.isRecommended,
                features: plan.features
            }]);

        if (error) throw error;
      } catch (error: any) {
          console.warn("Using local persistence for createPlan due to error:", error.message);
          
          const stored = localStorage.getItem(PLANS_STORAGE_KEY);
          const plans = stored ? JSON.parse(stored) : DEFAULT_PLANS.map(p => ({...p, stripeId: '', updated_at: new Date().toISOString()}));
          
          const newPlan = {
              ...plan,
              id: `plan_${Date.now()}`,
              updated_at: new Date().toISOString()
          };
          
          plans.push(newPlan);
          localStorage.setItem(PLANS_STORAGE_KEY, JSON.stringify(plans));
      }
  },

  updatePlan: async (id: string, updates: Partial<Plan>) => {
      try {
        const payload: any = {};
        if (updates.name) payload.name = updates.name;
        if (updates.description) payload.description = updates.description;
        if (updates.price !== undefined) payload.price = updates.price;
        if (updates.interval) payload.interval = updates.interval;
        if (updates.stripeId) payload.stripe_id = updates.stripeId;
        if (updates.limits) payload.limits = updates.limits;
        if (updates.isActive !== undefined) payload.is_active = updates.isActive;
        if (updates.isPublic !== undefined) payload.is_public = updates.isPublic;
        if (updates.isRecommended !== undefined) payload.is_recommended = updates.isRecommended;
        if (updates.features) payload.features = updates.features;
        payload.updated_at = new Date().toISOString();

        const { error } = await supabase
            .from('plans')
            .update(payload)
            .eq('id', id);

        if (error) throw error;
      } catch (error: any) {
          console.warn("Using local persistence for updatePlan due to error:", error.message);
          
          const stored = localStorage.getItem(PLANS_STORAGE_KEY);
          let plans = stored ? JSON.parse(stored) : DEFAULT_PLANS.map(p => ({...p, stripeId: '', updated_at: new Date().toISOString()}));
          
          plans = plans.map((p: Plan) => p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p);
          
          localStorage.setItem(PLANS_STORAGE_KEY, JSON.stringify(plans));
      }
  },

  deletePlan: async (id: string) => {
      try {
          const { error } = await supabase.from('plans').delete().eq('id', id);
          if (error) throw error;
      } catch (error: any) {
          console.warn("Using local persistence for deletePlan due to error:", error.message);
          
          const stored = localStorage.getItem(PLANS_STORAGE_KEY);
          if (stored) {
              const plans = JSON.parse(stored).filter((p: Plan) => p.id !== id);
              localStorage.setItem(PLANS_STORAGE_KEY, JSON.stringify(plans));
          }
      }
  }
};