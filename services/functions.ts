
import { supabase } from './supabase';

// Helper para acessar variáveis de ambiente de forma segura
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

// URL base do Backend
const getBaseUrl = () => {
    const env = getEnv();
    // Prioriza a variável de ambiente. Se não existir, usa localhost como fallback seguro.
    return (env && env.VITE_API_URL) ? env.VITE_API_URL : 'http://localhost:8080';
};

const API_BASE = getBaseUrl();

const callBackend = async (endpoint: string, body: any) => {
    // Mapeamento de rotas do Frontend para o Backend (Cloud Run)
    const routeMap: {[key: string]: string} = {
        'send-whatsapp': 'api/whatsapp/send',
        'sync-asaas-periodic': 'api/asaas/sync',
        'generate-ai-response': 'api/ai/generate',
        'create-checkout-session': 'api/stripe/checkout',
        'create-portal-session': 'api/stripe/portal'
    };

    // Se o endpoint estiver no mapa, usa a rota mapeada, senão usa direto
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
        console.error(`Falha ao chamar backend (${endpoint} -> ${url}):`, error);
        throw error;
    }
};

export const sendWhatsAppMessage = async (to: string, templateName: string, variables: string[]) => {
  try {
    const data = await callBackend('send-whatsapp', {
        to,
        templateName,
        variables: variables.map(v => ({ type: "text", text: v }))
    });
    return data;
  } catch (error) {
    console.warn("Backend indisponível (Simulação):", error);
    return { success: true, simulated: true };
  }
};

export const triggerDailySync = async () => {
  try {
      return await callBackend('sync-asaas-periodic', {});
  } catch (e) {
      console.error("Sync manual falhou", e);
      throw e;
  }
};

export const pingBackend = async () => {
  try {
    const url = `${API_BASE}/`; 
    const response = await fetch(url, { method: 'GET' });
    
    if (response.ok) {
       return { online: true, message: "Servidor Online" };
    }
    throw new Error("Status " + response.status);
  } catch (e: any) {
    return { online: false, message: "Offline" };
  }
};

export const getWebhookUrl = (functionName: string) => {
  if (functionName.includes('asaas')) return `${API_BASE}/webhook/asaas`;
  if (functionName.includes('whatsapp')) return `${API_BASE}/webhook/whatsapp`;
  return `${API_BASE}/${functionName}`;
};
