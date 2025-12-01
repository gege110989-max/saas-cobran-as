
import { supabase } from './supabase';
import { authService } from './auth';
import { WhatsAppConfig, AsaasConfig } from "../types";

const CORS_PROXY = 'https://corsproxy.io/?';

// Helper para validar Asaas com verificação estrita de ambiente
export const validateAsaasToken = async (apiKey: string, mode: 'production' | 'sandbox' = 'production'): Promise<boolean> => {
    const cleanKey = apiKey.trim();
    if (!cleanKey) throw new Error("A chave de API não pode estar vazia.");
    
    const baseUrl = mode === 'sandbox' 
        ? 'https://sandbox.asaas.com/api/v3'
        : 'https://www.asaas.com/api/v3';
        
    const targetUrl = `${baseUrl}/customers?limit=1`;
    
    try {
        const response = await fetch(CORS_PROXY + encodeURIComponent(targetUrl), {
            method: 'GET',
            headers: {
                'access_token': cleanKey,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) return true;
        
        if (response.status === 401) {
             throw new Error(`Chave de ${mode === 'sandbox' ? 'Sandbox' : 'Produção'} inválida ou não autorizada.`);
        }

        const data = await response.json().catch(() => ({}));
        throw new Error(data.errors?.[0]?.description || `Erro Asaas (${response.status}): ${response.statusText}`);
    } catch (error: any) {
        throw new Error(error.message || "Erro ao conectar com Asaas.");
    }
};

export const validateWhatsAppConnection = async (config: WhatsAppConfig): Promise<boolean> => {
    const phoneId = config.phoneNumberId?.trim();
    const token = config.accessToken?.trim();

    if (!phoneId || !token) throw new Error("Dados incompletos.");

    try {
        const response = await fetch(`https://graph.facebook.com/v18.0/${phoneId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || "Erro de conexão Meta.");
        if (data.id !== phoneId) throw new Error("ID incorreto. O ID retornado pela Meta não confere.");

        return true;
    } catch (error: any) {
        throw new Error(error.message);
    }
};

// --- NOVOS MÉTODOS SUPABASE ---

export const asaasService = {
    saveConfig: async (config: AsaasConfig) => {
        const companyId = await authService.getCompanyId();
        if (!companyId) throw new Error("Empresa não identificada.");

        // 1. Verificar se já existe configuração
        const { data: existing } = await supabase
            .from('integrations')
            .select('id')
            .eq('company_id', companyId)
            .eq('provider', 'asaas')
            .maybeSingle();

        let error;

        if (existing) {
            // Atualizar
            const result = await supabase
                .from('integrations')
                .update({
                    config: config,
                    is_active: true,
                    updated_at: new Date().toISOString()
                })
                .eq('id', existing.id);
            error = result.error;
        } else {
            // Criar Novo
            const result = await supabase
                .from('integrations')
                .insert({
                    company_id: companyId,
                    provider: 'asaas',
                    config: config,
                    is_active: true
                });
            error = result.error;
        }

        if (error) throw error;
        
        // Mantém cache local para performance imediata
        localStorage.setItem('movicobranca_asaas_config', JSON.stringify(config));
    },

    getConfig: async (): Promise<AsaasConfig | null> => {
        const companyId = await authService.getCompanyId();
        if (!companyId) return null;

        const { data, error } = await supabase
            .from('integrations')
            .select('config')
            .eq('company_id', companyId)
            .eq('provider', 'asaas')
            .maybeSingle(); // maybeSingle evita erro se não existir

        if (error || !data) return null;
        return data.config as AsaasConfig;
    },
};

export const whatsAppService = {
    saveConfig: async (config: WhatsAppConfig) => {
        const companyId = await authService.getCompanyId();
        if (!companyId) throw new Error("Empresa não identificada.");

        // 1. Verificar se já existe configuração
        const { data: existing } = await supabase
            .from('integrations')
            .select('id')
            .eq('company_id', companyId)
            .eq('provider', 'whatsapp')
            .maybeSingle();

        let error;

        if (existing) {
            // Atualizar
            const result = await supabase
                .from('integrations')
                .update({
                    config: config,
                    is_active: true,
                    updated_at: new Date().toISOString()
                })
                .eq('id', existing.id);
            error = result.error;
        } else {
            // Criar Novo
            const result = await supabase
                .from('integrations')
                .insert({
                    company_id: companyId,
                    provider: 'whatsapp',
                    config: config,
                    is_active: true
                });
            error = result.error;
        }

        if (error) throw error;
        localStorage.setItem('movicobranca_wa_config', JSON.stringify(config));
    },

    getConfig: async (): Promise<WhatsAppConfig | null> => {
        const companyId = await authService.getCompanyId();
        if (!companyId) return null;

        const { data, error } = await supabase
            .from('integrations')
            .select('config')
            .eq('company_id', companyId)
            .eq('provider', 'whatsapp')
            .maybeSingle();

        if (error || !data) return null;
        return data.config as WhatsAppConfig;
    }
};

export const getIntegrationStatus = async () => {
    const asaas = await asaasService.getConfig();
    const whatsapp = await whatsAppService.getConfig();

    return {
        asaas: !!asaas,
        whatsapp: !!whatsapp,
        connected: !!asaas || !!whatsapp
    };
};
