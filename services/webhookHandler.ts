
import { AsaasWebhookPayload, WhatsAppWebhookPayload } from "../types";

// Simulação de "Banco de Dados" de Logs
export const WEBHOOK_LOGS_KEY = 'movicobranca_webhook_logs';

const saveLog = (provider: 'asaas' | 'whatsapp', event: string, status: 'success' | 'failed', payload: any) => {
    const newLog = {
        id: Date.now().toString(),
        provider,
        event,
        status,
        timestamp: new Date().toLocaleString(),
        payloadShort: JSON.stringify(payload).substring(0, 50) + '...'
    };
    
    // Em um app real, isso iria para o Supabase
    const existingLogs = JSON.parse(localStorage.getItem(WEBHOOK_LOGS_KEY) || '[]');
    localStorage.setItem(WEBHOOK_LOGS_KEY, JSON.stringify([newLog, ...existingLogs].slice(0, 50)));
    return newLog;
};

/**
 * Simula o endpoint POST /webhook/asaas?company_id=XYZ
 */
export const processAsaasWebhook = async (companyId: string, payload: AsaasWebhookPayload, authToken: string) => {
    console.log(`[Asaas Webhook] Processing for Company: ${companyId}`);

    // 1. Validação de Segurança (Simulada)
    // O Asaas envia um token no header 'access-token' que deve bater com o configurado
    if (!authToken || authToken.length < 10) {
        saveLog('asaas', 'AUTH_ERROR', 'failed', { error: 'Invalid Access Token' });
        throw new Error("Acesso negado: Token de webhook inválido.");
    }

    if (!companyId) {
        saveLog('asaas', 'MISSING_ID', 'failed', { error: 'No company_id' });
        throw new Error("Erro: company_id obrigatório na URL.");
    }

    // 2. Processamento do Evento
    try {
        switch (payload.event) {
            case 'PAYMENT_RECEIVED':
                console.log(`💰 Pagamento recebido! Fatura: ${payload.payment.id}, Valor: ${payload.payment.value}`);
                // Lógica de negócio: Atualizar status no Supabase, Enviar msg de agradecimento no WhatsApp
                break;
            case 'PAYMENT_OVERDUE':
                console.log(`⚠️ Pagamento atrasado! Fatura: ${payload.payment.id}`);
                // Lógica de negócio: Disparar régua de cobrança
                break;
            default:
                console.log(`Evento ignorado: ${payload.event}`);
        }

        saveLog('asaas', payload.event, 'success', payload);
        return { success: true, message: `Evento ${payload.event} processado.` };

    } catch (error) {
        saveLog('asaas', payload.event || 'UNKNOWN', 'failed', payload);
        throw error;
    }
};

/**
 * Simula o endpoint POST /webhook/whatsapp?company_id=XYZ
 */
export const processWhatsAppWebhook = async (companyId: string, payload: WhatsAppWebhookPayload, signature: string) => {
    console.log(`[WhatsApp Webhook] Processing for Company: ${companyId}`);

    // 1. Validação de Segurança (X-Hub-Signature)
    // A Meta assina o payload com seu App Secret.
    if (!signature) {
        saveLog('whatsapp', 'AUTH_ERROR', 'failed', { error: 'Missing Signature' });
        throw new Error("Acesso negado: Assinatura X-Hub-Signature ausente.");
    }

    // 2. Extração de Dados
    try {
        const changes = payload.entry?.[0]?.changes?.[0]?.value;
        
        if (changes?.messages && changes.messages.length > 0) {
            const message = changes.messages[0];
            const from = message.from;
            const text = message.text?.body;
            
            console.log(`💬 Nova mensagem de ${from}: "${text}"`);
            
            // Lógica de negócio:
            // 1. Verificar se contato existe
            // 2. Salvar mensagem no chat_logs
            // 3. Acionar IA para classificar intenção
            
            saveLog('whatsapp', 'MESSAGE_RECEIVED', 'success', { from, text });
            return { success: true, message: "Mensagem processada." };
        } else {
             // Pode ser um status update (SENT, READ, DELIVERED)
             saveLog('whatsapp', 'STATUS_UPDATE', 'success', { changes });
             return { success: true, message: "Status atualizado." };
        }

    } catch (error) {
        saveLog('whatsapp', 'PROCESSING_ERROR', 'failed', payload);
        throw error;
    }
};

/**
 * Simula a validação GET /webhook/whatsapp (Challenge Verify)
 */
export const verifyWhatsAppChallenge = (mode: string, token: string, challenge: string, configuredToken: string) => {
    if (mode === 'subscribe' && token === configuredToken) {
        console.log("WhatsApp Webhook Verified!");
        return parseInt(challenge);
    }
    throw new Error("Falha na verificação do token.");
};
