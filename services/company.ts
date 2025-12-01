
import { supabase } from './supabase';
import { authService } from './auth';
import { Company } from '../types';

export const companyService = {
  // Busca os dados da empresa do usuário logado
  getCurrentCompany: async (): Promise<Company | null> => {
    const companyId = await authService.getCompanyId();
    if (!companyId) return null;

    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    if (error) {
      console.error("Error fetching current company:", error);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      email: '', // Email geralmente está no profile do owner, não na tabela companies base
      ownerName: '',
      logoUrl: data.logo_url, // Mapeando snake_case do banco para camelCase
      plan: data.plan,
      status: data.status,
      mrr: data.mrr || 0,
      createdAt: data.created_at,
      usersCount: 0,
      integrationAsaas: 'inactive',
      integrationWhatsapp: 'inactive',
      churnRisk: 'low'
    };
  },

  updateCompany: async (updates: Partial<Company>) => {
    const companyId = await authService.getCompanyId();
    if (!companyId) throw new Error("Empresa não identificada");

    const payload: any = {};
    if (updates.name) payload.name = updates.name;
    if (updates.logoUrl) payload.logo_url = updates.logoUrl;

    const { error } = await supabase
        .from('companies')
        .update(payload)
        .eq('id', companyId);

    if (error) throw error;
  },

  // Busca métricas consolidadas para o Dashboard
  getDashboardMetrics: async () => {
    const companyId = await authService.getCompanyId();
    if (!companyId) return { mrr: 0, activeCustomers: 0, churnRate: 0, totalCustomers: 0 };

    try {
        // 1. Buscar MRR da Empresa
        const { data: company } = await supabase
            .from('companies')
            .select('mrr')
            .eq('id', companyId)
            .single();

        // 2. Contar Clientes Ativos
        const { count: activeCount } = await supabase
            .from('contacts')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', companyId)
            .eq('status', 'active');

        // 3. Contar Clientes Totais (para cálculo de Churn)
        const { count: totalCount } = await supabase
            .from('contacts')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', companyId);

        const total = totalCount || 0;
        const active = activeCount || 0;
        
        // Cálculo simplificado de Churn: % da base que não está ativa/paga
        // Em um cenário real, usaria dados históricos de cancelamento no período
        const inactive = total - active;
        const churnRate = total > 0 ? (inactive / total) * 100 : 0;

        return {
            mrr: company?.mrr || 0,
            activeCustomers: active,
            totalCustomers: total,
            churnRate: parseFloat(churnRate.toFixed(1))
        };
    } catch (error) {
        console.error("Erro ao calcular métricas:", error);
        return { mrr: 0, activeCustomers: 0, churnRate: 0, totalCustomers: 0 };
    }
  }
};
