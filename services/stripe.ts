import { supabase } from './supabase';
import { authService } from './auth';
import { SaasInvoice } from '../types';

export const stripeService = {
  /**
   * Inicia uma sessão de Checkout do Stripe para o plano selecionado.
   * Chama a Edge Function 'create-checkout-session'.
   */
  createCheckoutSession: async (plan: 'pro' | 'enterprise') => {
    const companyId = await authService.getCompanyId();
    if (!companyId) throw new Error("Empresa não identificada.");

    console.log(`[Stripe] Iniciando checkout para plano ${plan}...`);

    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: { 
          plan,
          companyId,
          returnUrl: window.location.href 
      }
    });

    if (error) {
        console.error("Erro no checkout:", error);
        throw new Error("Falha ao comunicar com o servidor de pagamentos.");
    }

    if (data?.url) {
      // Redireciona para o Checkout do Stripe real
      window.location.href = data.url;
    } else {
      throw new Error("URL de checkout não retornada.");
    }
  },

  /**
   * Abre o Portal do Cliente Stripe para gerenciar faturas e cancelamento.
   */
  createPortalSession: async () => {
    const { data, error } = await supabase.functions.invoke('create-portal-session', {
      body: { returnUrl: window.location.href }
    });

    if (error) {
        console.error("Erro portal:", error);
        throw new Error("Falha ao abrir portal de assinatura.");
    }

    if (data?.url) {
      window.location.href = data.url;
    }
  },

  /**
   * Busca o status atual da assinatura (via tabela companies)
   */
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

  /**
   * Busca o histórico de faturas REAL do banco de dados (tabela saas_invoices)
   */
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

        // Mapear snake_case do banco para camelCase do frontend
        return data.map((inv: any) => ({
            id: inv.id,
            companyId: inv.company_id,
            companyName: '', // Não necessário para o tenant ver seu próprio nome
            planName: inv.plan_name,
            amount: inv.amount,
            status: inv.status,
            issueDate: new Date(inv.issue_date).toLocaleDateString('pt-BR'),
            dueDate: new Date(inv.due_date).toLocaleDateString('pt-BR'),
            paidAt: inv.paid_at ? new Date(inv.paid_at).toLocaleDateString('pt-BR') : undefined,
            pdfUrl: inv.pdf_url
        }));
      } catch (error) {
          console.warn("Erro ao buscar faturas (DB Offline?):", error);
          return [];
      }
  }
};