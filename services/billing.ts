
import { supabase } from './supabase';
import { authService } from './auth';
import { BillingConfig } from '../types';

export const billingService = {
  saveConfig: async (config: BillingConfig) => {
    const companyId = await authService.getCompanyId();
    if (!companyId) throw new Error("Empresa não identificada.");

    // Utilizamos a tabela 'integrations' como store genérico de configurações
    // Provider = 'billing_settings'
    const { data: existing } = await supabase
        .from('integrations')
        .select('id')
        .eq('company_id', companyId)
        .eq('provider', 'billing_settings')
        .maybeSingle();

    if (existing) {
        const { error } = await supabase
            .from('integrations')
            .update({
                config: config,
                updated_at: new Date().toISOString()
            })
            .eq('id', existing.id);
        
        if (error) throw error;
    } else {
        const { error } = await supabase
            .from('integrations')
            .insert({
                company_id: companyId,
                provider: 'billing_settings',
                config: config,
                is_active: true
            });

        if (error) throw error;
    }
  },

  getConfig: async (): Promise<BillingConfig | null> => {
    const companyId = await authService.getCompanyId();
    if (!companyId) return null;

    const { data, error } = await supabase
        .from('integrations')
        .select('config')
        .eq('company_id', companyId)
        .eq('provider', 'billing_settings')
        .maybeSingle();

    if (error || !data) return null;
    return data.config as BillingConfig;
  }
};
