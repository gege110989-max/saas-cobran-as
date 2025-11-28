
import { supabase } from './supabase';
import { authService } from './auth';
import { AsaasConfig, AsaasWebhookPayload } from '../types';
import { processAsaasWebhook } from './webhookHandler';

const ASAAS_CONFIG_KEY = 'movicobranca_asaas_config';
const CORS_PROXY = 'https://corsproxy.io/?';

// --- Helpers de Geração de Dados Falsos ---
const firstNames = ['João', 'Maria', 'Pedro', 'Ana', 'Lucas', 'Julia', 'Marcos', 'Fernanda', 'Roberto', 'Patricia', 'Bruno', 'Camila'];
const lastNames = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Almeida', 'Costa', 'Pereira', 'Gomes'];
const domains = ['gmail.com', 'outlook.com', 'empresa.com.br', 'uol.com.br', 'hotmail.com'];

const randomItem = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
const randomNum = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const generateFakePerson = () => {
    const name = `${randomItem(firstNames)} ${randomItem(lastNames)}`;
    const email = `${name.toLowerCase().replace(' ', '.').replace(/[^a-z0-9.]/g, '')}@${randomItem(domains)}`;
    const cpf = `${randomNum(100, 999)}.${randomNum(100, 999)}.${randomNum(100, 999)}-${randomNum(10, 99)}`;
    const phone = `119${randomNum(10000000, 99999999)}`;
    return { name, email, cpf, phone };
};

// --- Asaas Service Class ---

export const asaasService = {
    // Configuração
    saveConfig: (config: AsaasConfig) => {
        localStorage.setItem(ASAAS_CONFIG_KEY, JSON.stringify(config));
    },

    getConfig: (): AsaasConfig | null => {
        const stored = localStorage.getItem(ASAAS_CONFIG_KEY);
        return stored ? JSON.parse(stored) : null;
    },

    // --- Core Logic (Unified) ---

    /**
     * Sincroniza clientes baseado no modo configurado (Sandbox ou Produção)
     */
    syncCustomers: async () => {
        const config = asaasService.getConfig();
        if (!config) throw new Error("Integração Asaas não configurada.");

        if (config.mode === 'sandbox') {
            return await asaasService.syncSandboxCustomers();
        } else {
            return await asaasService.syncProductionCustomers(config.apiKey);
        }
    },

    /**
     * Busca clientes REAIS na API do Asaas (Produção)
     */
    syncProductionCustomers: async (apiKey: string) => {
        const companyId = await authService.getCompanyId();
        if (!companyId) throw new Error("Empresa não identificada.");

        const cleanKey = apiKey.trim();
        if (!cleanKey) throw new Error("Chave de API vazia.");

        let asaasCustomers = [];
        try {
            // Usa Proxy para evitar CORS
            const targetUrl = 'https://www.asaas.com/api/v3/customers?limit=50';
            const response = await fetch(CORS_PROXY + encodeURIComponent(targetUrl), {
                method: 'GET',
                headers: {
                    'access_token': cleanKey,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 401) throw new Error("Chave de API recusada (401). Verifique se é uma chave de Produção válida.");
                throw new Error(`Erro API Asaas: ${response.statusText}`);
            }

            const data = await response.json();
            asaasCustomers = data.data || [];
        } catch (error: any) {
            console.error("Erro no fetch Asaas (Produção):", error);
            throw new Error(error.message || "Falha na conexão com Asaas.");
        }

        if (asaasCustomers.length === 0) return [];

        return await asaasService.saveContactsToDb(companyId, asaasCustomers);
    },

    // --- Sandbox Actions ---

    /**
     * Cria um cliente "falso" diretamente no Banco de Dados (Supabase)
     */
    createSandboxCustomer: async () => {
        const companyId = await authService.getCompanyId();
        if (!companyId) throw new Error("Empresa não identificada.");

        const fakeData = generateFakePerson();
        const asaasId = `cus_sand_${Date.now()}`;

        const { data, error } = await supabase
            .from('contacts')
            .insert([{
                company_id: companyId,
                name: fakeData.name,
                email: fakeData.email,
                phone: fakeData.phone,
                cpf_cnpj: fakeData.cpf,
                source: 'asaas',
                status: 'active',
            }])
            .select()
            .single();

        if (error) throw new Error(`Erro DB: ${error.message}`);

        return { ...data, asaasId };
    },

    /**
     * Sincroniza dados REAIS do Sandbox Asaas com Fallback para Simulação
     */
    syncSandboxCustomers: async () => {
        const companyId = await authService.getCompanyId();
        if (!companyId) throw new Error("Empresa não identificada.");

        const config = asaasService.getConfig();
        if (!config || !config.sandboxKey) throw new Error("Chave de Sandbox não configurada.");

        const cleanKey = config.sandboxKey.trim();
        let asaasCustomers = [];
        let usedSimulation = false;

        try {
            // Tenta buscar na API real do Sandbox via Proxy
            const targetUrl = 'https://sandbox.asaas.com/api/v3/customers?limit=20';
            const response = await fetch(CORS_PROXY + encodeURIComponent(targetUrl), {
                method: 'GET',
                headers: {
                    'access_token': cleanKey,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 401) throw new Error("Chave de Sandbox inválida (401).");
                throw new Error(`Erro Asaas Sandbox: ${response.status}`);
            }

            const data = await response.json();
            asaasCustomers = data.data || [];
            console.log("Sucesso ao buscar do Sandbox Asaas:", asaasCustomers.length, "clientes.");

        } catch (error: any) {
            console.warn("Falha ao conectar no Sandbox (CORS/Rede). Ativando modo simulação.", error);
            usedSimulation = true;
            
            // Fallback: Gera dados locais se a API falhar para não travar a UI
            const fake1 = generateFakePerson();
            const fake2 = generateFakePerson();
            asaasCustomers = [
                { ...fake1, mobilePhone: fake1.phone, cpfCnpj: fake1.cpf },
                { ...fake2, mobilePhone: fake2.phone, cpfCnpj: fake2.cpf }
            ];
        }

        if (asaasCustomers.length === 0) return [];

        return await asaasService.saveContactsToDb(companyId, asaasCustomers);
    },

    /**
     * Helper centralizado para salvar contatos no Supabase com deduplicação
     */
    saveContactsToDb: async (companyId: string, customersList: any[]) => {
        // 1. Deduplicação (Buscar CPFs já existentes)
        const { data: existingContacts } = await supabase
            .from('contacts')
            .select('cpf_cnpj')
            .eq('company_id', companyId);
        
        const existingCpfs = new Set(existingContacts?.map((c: any) => c.cpf_cnpj).filter(Boolean));

        // 2. Mapeamento
        const newContacts = customersList
            .filter((c: any) => {
                // Filtra se já existe CPF
                if (c.cpfCnpj && existingCpfs.has(c.cpfCnpj)) return false;
                // Filtra se não tem nome
                if (!c.name) return false;
                return true;
            })
            .map((c: any) => ({
                company_id: companyId,
                name: c.name,
                email: c.email,
                phone: c.mobilePhone || c.phone || '00000000000',
                cpf_cnpj: c.cpfCnpj,
                source: 'asaas',
                status: c.overdueSince ? 'overdue' : 'active',
                total_paid: 0,
                score: 50
            }));

        if (newContacts.length === 0) return [];

        const { data, error } = await supabase
            .from('contacts')
            .insert(newContacts)
            .select();

        if (error) throw new Error(`Erro ao salvar no banco: ${error.message}`);
        
        return data;
    },

    /**
     * Cria uma cobrança "falsa" (Simulada)
     */
    createSandboxCharge: async (customerId: string, value?: number) => {
        const amount = value || randomNum(50, 5000);
        const invoiceId = `pay_sand_${Date.now()}`;
        
        return {
            id: invoiceId,
            customer: customerId,
            value: amount,
            billingType: 'BOLETO',
            status: 'PENDING',
            dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0] // +3 dias
        };
    },

    /**
     * Simula o recebimento de um pagamento via Webhook
     */
    triggerSandboxPayment: async (invoiceId: string, customerId: string, value: number) => {
        const companyId = await authService.getCompanyId();
        if (!companyId) throw new Error("Empresa não identificada.");

        const payload: AsaasWebhookPayload = {
            event: 'PAYMENT_RECEIVED',
            payment: {
                id: invoiceId,
                customer: customerId,
                value: value,
                billingType: 'BOLETO'
            }
        };

        return await processAsaasWebhook(companyId, payload, 'sandbox_token_bypass');
    }
};
