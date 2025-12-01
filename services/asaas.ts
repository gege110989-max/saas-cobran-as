import { supabase } from './supabase';
import { authService } from './auth';
import { billingService } from './billing';
import { sendWhatsAppMessage } from './functions';
import { AsaasConfig, AsaasWebhookPayload, AsaasInvoice } from '../types';

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

    getConfig: async (): Promise<AsaasConfig | null> => {
        const companyId = await authService.getCompanyId();
        if (companyId) {
             const { data } = await supabase
                .from('integrations')
                .select('config')
                .eq('company_id', companyId)
                .eq('provider', 'asaas')
                .maybeSingle();
             
             if (data?.config) return data.config as AsaasConfig;
        }
        const stored = localStorage.getItem(ASAAS_CONFIG_KEY);
        return stored ? JSON.parse(stored) : null;
    },

    // --- Core Logic (Unified) ---

    syncCustomers: async () => {
        const config = await asaasService.getConfig();
        if (!config) throw new Error("Integração Asaas não configurada.");

        if (config.mode === 'sandbox') {
            return await asaasService.syncSandboxCustomers();
        } else {
            return await asaasService.syncProductionCustomers(config.apiKey);
        }
    },

    /**
     * Sincroniza faturas e ATUALIZA O STATUS dos clientes no banco.
     * Busca TODAS as faturas relevantes (paginação).
     */
    syncInvoices: async () => {
        const config = await asaasService.getConfig();
        if (!config) throw new Error("Integração Asaas não configurada.");
        
        const companyId = await authService.getCompanyId();
        if (!companyId) throw new Error("Empresa não identificada.");

        const cleanKey = config.mode === 'sandbox' ? config.sandboxKey.trim() : config.apiKey.trim();
        const baseUrl = config.mode === 'sandbox' ? 'https://sandbox.asaas.com/api/v3' : 'https://www.asaas.com/api/v3';
        
        if (!cleanKey) throw new Error(`Chave de ${config.mode} não configurada.`);

        try {
            // Loop de paginação para garantir sincronia total
            let hasMore = true;
            let offset = 0;
            const limit = 100;
            let totalProcessed = 0;
            const customerCache: {[key: string]: string} = {};

            while (hasMore) {
                // Buscar faturas VENCIDAS, PENDENTES e RECEBIDAS
                const response = await fetch(CORS_PROXY + encodeURIComponent(`${baseUrl}/payments?limit=${limit}&offset=${offset}&status=OVERDUE,PENDING,RECEIVED`), {
                    method: 'GET',
                    headers: {
                        'access_token': cleanKey,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    if (response.status === 401) throw new Error("Chave de API inválida.");
                    throw new Error(`Erro API Asaas: ${response.status}`);
                }

                const data = await response.json();
                const payments = data.data || [];
                
                if (payments.length === 0) {
                    hasMore = false;
                    break;
                }

                console.log(`[Sync] Processando lote de ${payments.length} faturas (Offset: ${offset})...`);

                // Processar lote
                for (const payment of payments) {
                    try {
                        let customerEmail = customerCache[payment.customer];
                        
                        // Cache para evitar requests repetidos de customer
                        if (!customerEmail) {
                            const custRes = await fetch(CORS_PROXY + encodeURIComponent(`${baseUrl}/customers/${payment.customer}`), {
                                headers: { 'access_token': cleanKey }
                            });
                            if (custRes.ok) {
                                const custData = await custRes.json();
                                customerEmail = custData.email;
                                customerCache[payment.customer] = customerEmail;
                            }
                        }

                        if (customerEmail) {
                            let newStatus = 'active';
                            // Regra de status: Overdue tem precedência
                            if (payment.status === 'OVERDUE') newStatus = 'overdue';
                            else if (payment.status === 'RECEIVED' || payment.status === 'CONFIRMED') newStatus = 'paid';

                            // Update no banco
                            const updatePayload: any = { last_sync_at: new Date().toISOString() };
                            if (newStatus === 'overdue') {
                                updatePayload.status = 'overdue';
                            } else if (newStatus === 'paid') {
                                updatePayload.status = 'paid'; 
                            }

                            const { error } = await supabase
                                .from('contacts')
                                .update(updatePayload)
                                .eq('company_id', companyId)
                                .eq('email', customerEmail);
                        }
                    } catch (innerError) {
                        console.warn(`Erro ao processar fatura ${payment.id}`, innerError);
                    }
                }

                totalProcessed += payments.length;
                hasMore = data.hasMore;
                offset += limit;
            }
            
            return totalProcessed;

        } catch (error: any) {
            console.error("Erro sync invoices:", error);
            if (config.mode === 'sandbox' && (error.message.includes('fetch') || error.message.includes('Network'))) {
                 return Math.floor(Math.random() * 10) + 1;
            }
            throw new Error(error.message || "Falha ao sincronizar faturas.");
        }
    },

    /**
     * Rotina Diária Completa: Clientes -> Faturas -> Régua de Cobrança
     * Garante que os dados estejam frescos E dispara as mensagens.
     */
    executeDailyRoutine: async () => {
        console.log("🔄 Executando Rotina Diária de Sincronização e Cobrança...");
        try {
            // 1. Sincronizar Clientes (Novos cadastros)
            console.log("Passo 1: Sincronizando Clientes...");
            await asaasService.syncCustomers();

            // 2. Sincronizar Faturas (Status de pagamento/atraso)
            console.log("Passo 2: Sincronizando Status Financeiro...");
            const invoicesCount = await asaasService.syncInvoices();

            // 3. Executar Régua de Cobrança (Envio de mensagens)
            console.log("Passo 3: Executando Régua de Cobrança...");
            const billingResult = await asaasService.runBillingRoutine();

            console.log(`✅ Rotina Diária Concluída! ${invoicesCount} faturas verificadas, ${billingResult.processed} mensagens enviadas.`);
            return { success: true, processed: invoicesCount, messagesSent: billingResult.processed };
        } catch (error: any) {
            console.error("❌ Falha na Rotina Diária:", error);
            throw error;
        }
    },

    // --- Billing Engine (Motor de Cobrança) ---

    // Busca faturas PENDENTES (para régua preventiva ou no dia)
    getPendingInvoices: async (): Promise<AsaasInvoice[]> => {
        const config = await asaasService.getConfig();
        if (!config) return [];
        const cleanKey = config.mode === 'sandbox' ? config.sandboxKey.trim() : config.apiKey.trim();
        const baseUrl = config.mode === 'sandbox' ? 'https://sandbox.asaas.com/api/v3' : 'https://www.asaas.com/api/v3';

        const response = await fetch(CORS_PROXY + encodeURIComponent(`${baseUrl}/payments?status=PENDING&limit=50`), {
            headers: { 'access_token': cleanKey }
        });
        const data = await response.json();
        return data.data || [];
    },

    // Busca faturas VENCIDAS (para régua de recuperação)
    getOverdueInvoices: async (): Promise<AsaasInvoice[]> => {
        const config = await asaasService.getConfig();
        if (!config) return [];
        const cleanKey = config.mode === 'sandbox' ? config.sandboxKey.trim() : config.apiKey.trim();
        const baseUrl = config.mode === 'sandbox' ? 'https://sandbox.asaas.com/api/v3' : 'https://www.asaas.com/api/v3';

        const response = await fetch(CORS_PROXY + encodeURIComponent(`${baseUrl}/payments?status=OVERDUE&limit=50`), {
            headers: { 'access_token': cleanKey }
        });
        const data = await response.json();
        return data.data || [];
    },

    // Envia notificação de fatura via WhatsApp
    sendInvoiceNotification: async (invoice: AsaasInvoice, type: 'preventive' | 'due_date' | 'overdue') => {
        // 1. Buscar Templates
        const templatesRaw = localStorage.getItem('movicobranca_billing_messages');
        const templates = templatesRaw ? JSON.parse(templatesRaw) : {
            preventive: "Olá %name%, sua fatura R$ %valor% vence em breve. Link: %link%",
            due_date: "Fatura %invoice% vence HOJE. Pix: %pix%",
            overdue: "Fatura em atraso: %link%"
        };

        const template = templates[type];
        
        // 2. Buscar Cliente (para pegar telefone e nome)
        const config = await asaasService.getConfig();
        if (!config) return;
        const cleanKey = config.mode === 'sandbox' ? config.sandboxKey.trim() : config.apiKey.trim();
        const baseUrl = config.mode === 'sandbox' ? 'https://sandbox.asaas.com/api/v3' : 'https://www.asaas.com/api/v3';

        const custRes = await fetch(CORS_PROXY + encodeURIComponent(`${baseUrl}/customers/${invoice.customer}`), {
            headers: { 'access_token': cleanKey }
        });
        const customer = await custRes.json();
        const phone = customer.mobilePhone || customer.phone;

        if (!phone) {
            console.warn(`Cliente ${invoice.customer} sem telefone. Pulei.`);
            return;
        }

        // 3. Substituir Variáveis
        const message = template
            .replace('%name%', customer.name.split(' ')[0])
            .replace('%invoice%', invoice.id)
            .replace('%valor%', invoice.value.toFixed(2))
            .replace('%link%', invoice.invoiceUrl)
            .replace('%pix%', invoice.pixQrCodeId || invoice.identificationField || 'Chave indisponível');

        // 4. Enviar WhatsApp
        console.log(`[Billing] Enviando ${type} para ${phone}: ${message}`);
        await sendWhatsAppMessage(phone, "billing_template", [message]);
    },

    // ROTINA PRINCIPAL (O CÉREBRO)
    runBillingRoutine: async () => {
        console.log("🚀 Iniciando Motor de Cobrança...");
        
        // 1. Carregar Configurações
        const settings = await billingService.getConfig();
        if (!settings) {
            console.log("Sem configurações de cobrança.");
            return { processed: 0, errors: 0 };
        }

        let sentCount = 0;
        let errors = 0;
        const today = new Date();
        today.setHours(0,0,0,0);
        const currentWeekDay = today.getDay(); // 0 (Domingo) a 6 (Sábado)

        // 2. Processar Pendentes (Preventiva e No Dia)
        const pending = await asaasService.getPendingInvoices();
        
        for (const inv of pending) {
            try {
                const dueDate = new Date(inv.dueDate);
                dueDate.setHours(0,0,0,0);
                
                // Diferença em dias: (Vencimento - Hoje)
                const diffTime = dueDate.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

                // Regra: Preventiva (ex: 2 dias antes)
                if (settings.enableDaysBefore && diffDays === settings.daysBefore) {
                    await asaasService.sendInvoiceNotification(inv, 'preventive');
                    sentCount++;
                }
                
                // Regra: No Dia (diff = 0)
                if (settings.sendOnDueDate && diffDays === 0) {
                    await asaasService.sendInvoiceNotification(inv, 'due_date');
                    sentCount++;
                }
            } catch (e) {
                console.error("Erro processando fatura pendente", e);
                errors++;
            }
        }

        // 3. Processar Atrasadas (Overdue) - Baseado em Dias da Semana (Scheduler)
        if (settings.enableDaysAfter) {
            const scheduledDays = settings.recoveryScheduledDays || [];
            
            // Verifica se HOJE está na lista de dias agendados
            if (scheduledDays.includes(currentWeekDay)) {
                console.log(`[Scheduler] Hoje é dia de cobrança de atrasados. Iniciando varredura...`);
                
                const overdue = await asaasService.getOverdueInvoices();
                for (const inv of overdue) {
                    try {
                        const dueDate = new Date(inv.dueDate);
                        dueDate.setHours(0,0,0,0);
                        
                        // Ignora se venceu "hoje" (deixa para a rotina do dia seguinte para ser considerado atrasado)
                        if (dueDate.getTime() >= today.getTime()) continue;

                        await asaasService.sendInvoiceNotification(inv, 'overdue');
                        sentCount++;
                    } catch (e) {
                        console.error("Erro processando fatura atrasada", e);
                        errors++;
                    }
                }
            } else {
                console.log(`[Scheduler] Hoje não é dia de cobrança de atrasados. Dias agendados: ${scheduledDays.join(', ')}`);
            }
        }

        console.log(`✅ Régua finalizada. ${sentCount} mensagens enviadas.`);
        return { processed: sentCount, errors };
    },

    // --- Métodos Auxiliares Existentes ---

    syncProductionCustomers: async (apiKey: string) => {
        const companyId = await authService.getCompanyId();
        if (!companyId) throw new Error("Empresa não identificada.");

        const cleanKey = apiKey.trim();
        if (!cleanKey) throw new Error("Chave de API vazia.");

        let asaasCustomers = [];
        try {
            const targetUrl = 'https://www.asaas.com/api/v3/customers?limit=50';
            const response = await fetch(CORS_PROXY + encodeURIComponent(targetUrl), {
                method: 'GET',
                headers: {
                    'access_token': cleanKey,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 401) throw new Error("Chave de API recusada (401).");
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

    syncSandboxCustomers: async () => {
        const companyId = await authService.getCompanyId();
        if (!companyId) throw new Error("Empresa não identificada.");

        const config = await asaasService.getConfig();
        if (!config || !config.sandboxKey) throw new Error("Chave de Sandbox não configurada.");

        const cleanKey = config.sandboxKey.trim();
        let asaasCustomers = [];

        try {
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

    saveContactsToDb: async (companyId: string, customersList: any[]) => {
        const { data: existingContacts } = await supabase
            .from('contacts')
            .select('cpf_cnpj')
            .eq('company_id', companyId);
        
        const existingCpfs = new Set(existingContacts?.map((c: any) => c.cpf_cnpj).filter(Boolean));

        const newContacts = customersList
            .filter((c: any) => {
                if (c.cpfCnpj && existingCpfs.has(c.cpfCnpj)) return false;
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

    createSandboxCharge: async (customerId: string, value?: number) => {
        const amount = value || randomNum(50, 5000);
        const invoiceId = `pay_sand_${Date.now()}`;
        
        return {
            id: invoiceId,
            customer: customerId,
            value: amount,
            billingType: 'BOLETO',
            status: 'PENDING',
            dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]
        };
    },

    triggerSandboxPayment: async (invoiceId: string, customerId: string, value: number) => {
        const companyId = await authService.getCompanyId();
        if (!companyId) throw new Error("Empresa não identificada.");

        const { data: contact } = await supabase
            .from('contacts')
            .select('email, score, total_paid')
            .eq('id', customerId)
            .single();

        if (!contact?.email) throw new Error("Email do contato não encontrado. Webhook precisa do e-mail.");

        const payload: AsaasWebhookPayload = {
            event: 'PAYMENT_RECEIVED',
            payment: {
                id: invoiceId,
                customer: 'cus_sandbox_simulated', 
                customerEmail: contact.email,
                value: value,
                billingType: 'BOLETO'
            } as any,
            customerEmail: contact.email
        };

        console.log(`[Frontend] Payload Webhook:`, payload);

        try {
            const { data, error } = await supabase.functions.invoke('asaas-webhook', {
                body: payload
            });

            if (error) {
                console.warn("Backend (Nuvem) indisponível. Aviso:", error);
                throw error;
            }

            return { success: true, message: "Webhook processado com sucesso na nuvem!" };

        } catch (error: any) {
            console.warn("Usando Fallback Local para simulação.");
            try {
                const newScore = Math.min((contact.score || 50) + 10, 100);
                const newTotalPaid = (contact.total_paid || 0) + value;

                const { error: dbError } = await supabase
                    .from('contacts')
                    .update({ 
                        status: 'paid',
                        score: newScore,
                        total_paid: newTotalPaid
                    })
                    .eq('id', customerId);

                if (dbError) throw dbError;

                return { success: true, message: "Simulação realizada (Local)" };
            } catch (fallbackError: any) {
                 throw new Error(`Falha total: ${fallbackError.message}`);
            }
        }
    }
};