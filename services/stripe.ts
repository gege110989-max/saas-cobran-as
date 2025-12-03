import { supabase } from './supabase';
import { authService } from './auth';
import { SaasInvoice, Plan } from '../types';

// Helper local para chamadas ao backend
const getEnv = () => {
    try {
        // @ts-ignore
        if (typeof import.meta !== 'undefined' && import.meta.env) {
            // @ts-ignore
            return import.meta.env;
        }
    } catch (e) {
        console.warn("Environment variables not loaded:", e);
    }
    return {};
};

const env = getEnv();
const API_BASE = (env && env.VITE_API_URL) ? env.VITE_API_URL : 'http://localhost:8080';
const PLANS_STORAGE_KEY = 'movicobranca_plans_fallback';

const callStripeBackend = async (endpoint: string, body: any) => {
    // Mapeia para rotas definidas no server.js
    const routeMap: {[key: string]: string} = {
        'create-checkout-session': 'api/stripe/checkout',
        'create-portal-session': 'api/stripe/portal'
    };
    
    const path = routeMap[endpoint] || endpoint;
    const url = `${API_BASE}/${path}`;

    const { data: { session } } = await supabase.auth.getSession();
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session?.access_token || ''}`
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Backend Error (${response.status}): ${errText}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`Falha ao chamar backend (${endpoint}):`, error);
        throw error;
    }
};

export const stripeService = {
  createCheckoutSession: async (planId: string) => {
    try {
        // Obter URL atual para retorno
        const returnUrl = window.location.origin + window.location.pathname;

        const data = await callStripeBackend('create-checkout-session', {
            plan: planId,
            returnUrl: returnUrl 
        });

        if (data?.url) {
            window.location.href = data.url;
        } else {
            throw new Error("URL de checkout não retornada.");
        }
    } catch (error) {
        console.error("Erro no checkout:", error);
        throw new Error("Falha ao comunicar com o servidor de pagamentos.");
    }
  },

  createPortalSession: async () => {
    try {
        const returnUrl = window.location.origin + window.location.pathname;
        const data = await callStripeBackend('create-portal-session', {
            returnUrl: returnUrl 
        });

        if (data?.url) {
            window.location.href = data.url;
        }
    } catch (error) {
        console.error("Erro portal:", error);
        throw new Error("Falha ao abrir portal de assinatura.");
    }
  },

  getCurrentSubscription: async () => {
      const profile = await authService.getUserProfile();
      if (!profile?.company_id) return null;

      const { data: company } = await supabase
        .from('companies')
        .select('plan, status')
        .eq('id', profile.company_id)
        .single();
      
      return company;
  },

  getAvailablePlans: async (): Promise<Plan[]> => {
      try {
        const { data, error } = await supabase
            .from('plans')
            .select('*')
            .eq('is_active', true)
            .eq('is_public', true)
            .order('price', { ascending: true });

        if (error) throw error;

        return (data || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            price: p.price,
            interval: p.interval,
            limits: p.limits || {},
            isActive: p.is_active,
            isPublic: p.is_public,
            isRecommended: p.is_recommended,
            features: p.features || []
        }));
      } catch (error: any) {
          console.warn("Erro ao buscar planos (usando fallback):", error.message || error);
          
          // Fallback to local storage if DB fails
          const stored = localStorage.getItem(PLANS_STORAGE_KEY);
          if (stored) {
              const plans = JSON.parse(stored);
              // Filter active and public just like the DB query
              return plans.filter((p: any) => p.isActive && p.isPublic);
          }

          // Fallback plans if table doesn't exist
          return [
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
      }
  },

  getInvoices: async (): Promise<SaasInvoice[]> => {
      try {
        const profile = await authService.getUserProfile();
        if (!profile?.company_id) return [];

        const { data, error } = await supabase
            .from('saas_invoices')
            .select('*')
            .eq('company_id', profile.company_id)
            .order('issue_date', { ascending: false });

        if (error) throw error;

        return data.map((inv: any) => ({
            id: inv.id,
            companyId: inv.company_id,
            companyName: '', 
            planName: inv.plan_name,
            amount: inv.amount,
            status: inv.status,
            issueDate: new Date(inv.issue_date).toLocaleDateString('pt-BR'),
            dueDate: new Date(inv.due_date).toLocaleDateString('pt-BR'),
            paidAt: inv.paid_at ? new Date(inv.paid_at).toLocaleDateString('pt-BR') : undefined,
            pdfUrl: inv.pdf_url
        }));
      } catch (error) {
          return [];
      }
  }
};