
import { supabase } from './supabase';
import { Company, SaasInvoice } from '../types';
import { adminSettingsService } from './adminSettings';

export const adminService = {
  getAllCompanies: async (): Promise<Company[]> => {
    // 1. Buscar Empresas
    const { data: companies, error } = await supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Erro ao buscar empresas:", error);
      throw error;
    }

    // 2. Enriquecer dados (Join manual para performance e evitar complexidade)
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
        plan: c.plan || 'free',
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
  },

  getCompanyDetails: async (id: string): Promise<Company | null> => {
    const { data: c, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !c) return null;

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
      plan: c.plan || 'free',
      status: c.status || 'active',
      mrr: Number(c.mrr) || 0,
      createdAt: new Date(c.created_at).toLocaleDateString('pt-BR'),
      usersCount: usersCount || 0,
      integrationAsaas: hasAsaas ? 'active' : 'inactive',
      integrationWhatsapp: hasWa ? 'active' : 'inactive',
      churnRisk: c.churn_risk || 'low'
    };
  },

  createCompany: async (data: { name: string; ownerName: string; email: string; plan: string; logoUrl?: string }) => {
    // Nota: Em um app real, o Admin criaria o Auth User via API de Admin do Supabase.
    // Aqui, como estamos no client-side, vamos criar a estrutura de dados.
    const tempOwnerId = crypto.randomUUID();

    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert([
        { 
          name: data.name, 
          plan: data.plan, 
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
  },

  updateCompanyPlan: async (id: string, plan: string) => {
      const { error } = await supabase
          .from('companies')
          .update({ plan: plan })
          .eq('id', id);

      if (error) throw error;
  },

  deleteCompany: async (id: string): Promise<void> => {
    // O Cascade Delete configurado no banco deve lidar com a maioria
    // Mas para segurança, removemos dependências críticas se necessário
    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Busca todas as faturas do sistema SaaS (Tabela Real)
  getSaasInvoices: async (companyId?: string): Promise<SaasInvoice[]> => {
      let query = supabase
          .from('saas_invoices')
          .select(`*, companies(name)`)
          .order('issue_date', { ascending: false });

      if (companyId) {
          query = query.eq('company_id', companyId);
      }

      const { data, error } = await query;

      if (error) {
          console.error("Erro ao buscar faturas SaaS:", error);
          return [];
      }

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

      // 2. Buscar faturas vencidas reais no banco
      const { data: overdueInvoices, error } = await supabase
          .from('saas_invoices')
          .select('company_id, due_date, companies(name)')
          .eq('status', 'overdue');

      if (error) throw new Error("Erro ao buscar inadimplentes: " + error.message);

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
  }
};
