import { supabase } from './supabase';
import { Company, SaasInvoice, Plan } from '../types';
import { adminSettingsService } from './adminSettings';

export const adminService = {
  getAllCompanies: async (): Promise<Company[]> => {
    try {
        // 1. Buscar Empresas e fazer Join com Planos
        const { data: companies, error } = await supabase
        .from('companies')
        .select(`
            *,
            plan_details:plans(name)
        `)
        .order('created_at', { ascending: false });

        if (error) throw error;

        // 2. Enriquecer dados
        const enrichedCompanies = await Promise.all(companies.map(async (c: any) => {
        // Buscar Dono
        const { data: owner } = await supabase
            .from('profiles')
            .select('name, email')
            .eq('id', c.owner_id)
            .maybeSingle();

        // Contar Usuários
        const { count: usersCount } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', c.id);

        // Checar Integrações
        const { data: integrations } = await supabase
            .from('integrations')
            .select('provider, is_active')
            .eq('company_id', c.id);

        const hasAsaas = integrations?.some(i => i.provider === 'asaas' && i.is_active);
        const hasWa = integrations?.some(i => i.provider === 'whatsapp' && i.is_active);

        return {
            id: c.id,
            name: c.name,
            ownerName: owner?.name || 'Desconhecido',
            email: owner?.email || 'Sem e-mail',
            logoUrl: c.logo_url,
            plan: c.plan_details?.name || 'N/A', // Nome do plano da tabela relacionada
            planId: c.plan_id,
            status: c.status || 'active',
            mrr: Number(c.mrr) || 0,
            createdAt: new Date(c.created_at).toLocaleDateString('pt-BR'),
            usersCount: usersCount || 0,
            integrationAsaas: hasAsaas ? 'active' : 'inactive',
            integrationWhatsapp: hasWa ? 'active' : 'inactive',
            churnRisk: c.churn_risk || 'low'
        } as Company;
        }));

        return enrichedCompanies;
    } catch (error) {
        console.warn("Erro ao buscar empresas (DB Offline/Empty):", error);
        return [];
    }
  },

  getCompanyDetails: async (id: string): Promise<Company | null> => {
    try {
        const { data: c, error } = await supabase
        .from('companies')
        .select(`
            *,
            plan_details:plans(name)
        `)
        .eq('id', id)
        .single();

        if (error || !c) throw error || new Error("Company not found");

        // Buscar Dono
        const { data: owner } = await supabase
        .from('profiles')
        .select('name, email')
        .eq('id', c.owner_id)
        .maybeSingle();

        // Contar Usuários
        const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', c.id);

        // Checar Integrações
        const { data: integrations } = await supabase
        .from('integrations')
        .select('provider, is_active')
        .eq('company_id', c.id);

        const hasAsaas = integrations?.some(i => i.provider === 'asaas' && i.is_active);
        const hasWa = integrations?.some(i => i.provider === 'whatsapp' && i.is_active);

        return {
        id: c.id,
        name: c.name,
        ownerName: owner?.name || 'Desconhecido',
        email: owner?.email || 'Sem e-mail',
        logoUrl: c.logo_url,
        plan: c.plan_details?.name || 'N/A',
        planId: c.plan_id,
        status: c.status || 'active',
        mrr: Number(c.mrr) || 0,
        createdAt: new Date(c.created_at).toLocaleDateString('pt-BR'),
        usersCount: usersCount || 0,
        integrationAsaas: hasAsaas ? 'active' : 'inactive',
        integrationWhatsapp: hasWa ? 'active' : 'inactive',
        churnRisk: c.churn_risk || 'low'
        };
    } catch (error) {
        console.warn("Erro ao buscar detalhes da empresa:", error);
        return null;
    }
  },

  createCompany: async (data: { name: string; ownerName: string; email: string; planId: string; logoUrl?: string }) => {
    try {
        const tempOwnerId = crypto.randomUUID();

        const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert([
            { 
            name: data.name, 
            plan_id: data.planId, 
            status: 'active',
            owner_id: tempOwnerId,
            logo_url: data.logoUrl
            }
        ])
        .select()
        .single();

        if (companyError) throw companyError;

        const { error: profileError } = await supabase
        .from('profiles')
        .insert([
            {
            id: tempOwnerId,
            company_id: company.id,
            name: data.ownerName,
            email: data.email,
            role: 'owner',
            status: 'active'
            }
        ]);

        if (profileError) {
            console.error("Error creating profile:", profileError);
        }

        return company;
    } catch (error) {
        console.error("Erro ao criar empresa:", error);
        throw error;
    }
  },

  updateCompanyPlan: async (id: string, planId: string) => {
      try {
        const { error } = await supabase
            .from('companies')
            .update({ plan_id: planId })
            .eq('id', id);

        if (error) throw error;
      } catch (error) {
          console.error("Erro ao atualizar plano:", error);
          throw error;
      }
  },

  deleteCompany: async (id: string): Promise<void> => {
    try {
        const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', id);

        if (error) throw error;
    } catch (error) {
        console.error("Erro ao excluir empresa:", error);
        throw error;
    }
  },

  getSaasInvoices: async (companyId?: string): Promise<SaasInvoice[]> => {
      try {
        let query = supabase
            .from('saas_invoices')
            .select(`*, companies(name)`)
            .order('issue_date', { ascending: false });

        if (companyId) {
            query = query.eq('company_id', companyId);
        }

        const { data, error } = await query;

        if (error) throw error;

        return data.map((inv: any) => ({
            id: inv.id,
            companyId: inv.company_id,
            companyName: inv.companies?.name || 'Desconhecida',
            planName: inv.plan_name,
            amount: inv.amount,
            status: inv.status,
            issueDate: new Date(inv.issue_date).toLocaleDateString('pt-BR'),
            dueDate: new Date(inv.due_date).toLocaleDateString('pt-BR'),
            paidAt: inv.paid_at ? new Date(inv.paid_at).toLocaleDateString('pt-BR') : undefined,
            pdfUrl: inv.pdf_url
        }));
      } catch (error) {
          console.warn("Erro ao buscar faturas SaaS (DB Offline?):", error);
          return [];
      }
  },

  runAutoBlockRoutine: async () => {
      // 1. Carregar Configuração
      const config = await adminSettingsService.getConfig();
      
      if (!config.autoBlock.enabled) {
          return { processed: 0, suspended: 0, message: "Bloqueio automático desativado nas configurações." };
      }

      const daysTolerance = config.autoBlock.daysTolerance;
      const today = new Date();
      today.setHours(0,0,0,0);

      console.log(`[AutoBlock] Iniciando... Tolerância: ${daysTolerance} dias.`);

      try {
        // 2. Buscar faturas vencidas reais no banco
        const { data: overdueInvoices, error } = await supabase
            .from('saas_invoices')
            .select('company_id, due_date, companies(name)')
            .eq('status', 'overdue');

        if (error) throw error;

        let processedCount = 0;
        let suspendedCount = 0;

        for (const invoice of overdueInvoices || []) {
            const dueDate = new Date(invoice.due_date);
            dueDate.setHours(0,0,0,0);

            const diffTime = today.getTime() - dueDate.getTime();
            const daysLate = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (daysLate > daysTolerance) {
                const { error: updateError } = await supabase
                    .from('companies')
                    .update({ status: 'suspended' })
                    .eq('id', invoice.company_id);

                if (!updateError) {
                    suspendedCount++;
                    console.log(`[AutoBlock] EMPRESA SUSPENSA: ${invoice.companies?.name}`);
                }
            }
            processedCount++;
        }

        return { 
            processed: processedCount, 
            suspended: suspendedCount, 
            message: `${suspendedCount} empresas suspensas automaticamente (atraso > ${daysTolerance} dias).` 
        };
      } catch (error) {
          console.warn("Erro no autoblock (DB Offline?):", error);
          return { processed: 0, suspended: 0, message: "Erro ao executar rotina de bloqueio." };
      }
  },

  // --- MÉTODOS DE GESTÃO DE PLANOS ---

  getPlans: async (): Promise<Plan[]> => {
      try {
        const { data, error } = await supabase
            .from('plans')
            .select('*')
            .order('price', { ascending: true });

        if (error) throw error;

        return data.map((p: any) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            price: p.price,
            interval: p.interval,
            limits: p.limits || {},
            isActive: p.is_active,
            isPublic: p.is_public,
            features: p.features || []
        }));
      } catch (error) {
          console.warn("Erro ao buscar planos (DB Offline?):", error);
          return [];
      }
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
                limits: plan.limits,
                is_active: plan.isActive,
                is_public: plan.isPublic,
                features: plan.features
            }]);

        if (error) throw error;
      } catch (error) {
          console.error("Erro ao criar plano:", error);
          throw error;
      }
  },

  updatePlan: async (id: string, updates: Partial<Plan>) => {
      try {
        const payload: any = {};
        if (updates.name) payload.name = updates.name;
        if (updates.description) payload.description = updates.description;
        if (updates.price !== undefined) payload.price = updates.price;
        if (updates.interval) payload.interval = updates.interval;
        if (updates.limits) payload.limits = updates.limits;
        if (updates.isActive !== undefined) payload.is_active = updates.isActive;
        if (updates.isPublic !== undefined) payload.is_public = updates.isPublic;
        if (updates.features) payload.features = updates.features;
        payload.updated_at = new Date().toISOString();

        const { error } = await supabase
            .from('plans')
            .update(payload)
            .eq('id', id);

        if (error) throw error;
      } catch (error) {
          console.error("Erro ao atualizar plano:", error);
          throw error;
      }
  }
};