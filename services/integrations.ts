
import { WhatsAppConfig } from "../types";

// Simulated Local Storage Keys
const ASAAS_KEY = 'movicobranca_asaas_key';
const WA_CONFIG_KEY = 'movicobranca_wa_config';
const CORS_PROXY = 'https://corsproxy.io/?';

export const validateAsaasToken = async (apiKey: string): Promise<boolean> => {
    const cleanKey = apiKey.trim();
    if (!cleanKey) throw new Error("A chave de API não pode estar vazia.");

    // Determine URL based on key prefix hint (although we test connection to be sure)
    // Production keys usually start with $aact... Sandbox keys start with $ but are shorter/different.
    // We'll try the URL based on the user's selected mode in the UI, but this function only gets the key.
    // We will infer environment or try both? For simplicity, let's try based on typical format or just assume Production URL 
    // unless the key is explicitly a "sandbox" formatted one? 
    // Actually, to be safe, we should test against the URL that matches the key intent. 
    // Since we don't pass mode here, we'll try Production first, then Sandbox if it fails?
    // Better: The UI should pass the mode. But maintaining signature compatibility:
    
    // Heuristic: Try Production first. If it's a Sandbox key, Asaas Prod returns 401.
    // IMPORTANT: Users often mix this up. 
    
    // Let's assume the component calls this with the RIGHT key for the RIGHT mode.
    // We will try to fetch customers. If it works (200), the key is good.
    
    let targetUrl = 'https://www.asaas.com/api/v3/customers?limit=1';
    // If the key looks like it might be sandbox (heuristic), we could try sandbox URL, 
    // but the best way is to let the user pick the mode in UI and we validate against that.
    // Since we don't have mode here, we will try to detect.
    
    // NOTE: This validator is called by handleSaveAsaas/handleTestAsaas which knows the mode.
    // But since we can't change the signature easily without breaking other things, let's try a generic fetch.
    
    // However, to make this robust:
    // If we receive a 401 from Prod, it MIGHT be a Sandbox key.
    
    try {
        const response = await fetch(CORS_PROXY + encodeURIComponent(targetUrl), {
            method: 'GET',
            headers: {
                'access_token': cleanKey,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            localStorage.setItem(ASAAS_KEY, cleanKey);
            return true;
        }
        
        // If Prod failed with 401, maybe it's a sandbox key?
        if (response.status === 401) {
             // Try Sandbox URL
             const sandboxUrl = 'https://sandbox.asaas.com/api/v3/customers?limit=1';
             const sbResponse = await fetch(CORS_PROXY + encodeURIComponent(sandboxUrl), {
                method: 'GET',
                headers: {
                    'access_token': cleanKey,
                    'Content-Type': 'application/json'
                }
            });
            
            if (sbResponse.ok) {
                // It's a valid Sandbox key
                localStorage.setItem(ASAAS_KEY, cleanKey);
                return true;
            }
        }

        throw new Error("Chave inválida ou não autorizada.");

    } catch (error: any) {
        throw new Error(error.message || "Erro ao conectar com Asaas.");
    }
};

export const validateWhatsAppConnection = async (config: WhatsAppConfig): Promise<boolean> => {
    // Basic format validation
    if (!config.phoneNumberId || !config.accessToken) {
        throw new Error("ID do Telefone e Token são obrigatórios.");
    }

    try {
        // Real validation against Meta Graph API
        // We query the Phone Number ID endpoint. If the token is valid, it returns the object.
        const response = await fetch(`https://graph.facebook.com/v18.0/${config.phoneNumberId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${config.accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (!response.ok) {
            // Extract meaningful error message from Meta response
            const errorMessage = data.error?.message || "Token inválido ou sem permissão para este ID.";
            console.error("Meta API Validation Error:", data);
            throw new Error(`Erro WhatsApp: ${errorMessage}`);
        }

        // Verify if the returned ID matches the requested ID to ensure correct access
        if (data.id !== config.phoneNumberId) {
            throw new Error("O ID retornado pela API não corresponde ao ID informado.");
        }

        // If successful, save config
        localStorage.setItem(WA_CONFIG_KEY, JSON.stringify(config));
        return true;

    } catch (error: any) {
        // If it's a fetch error (network) or our thrown error
        throw new Error(error.message || "Não foi possível conectar à API do WhatsApp.");
    }
};

export const getIntegrationStatus = () => {
    // Check local storage or existing configs
    const asaasConfig = localStorage.getItem('movicobranca_asaas_config');
    const waConfig = localStorage.getItem('movicobranca_wa_config');

    return {
        asaas: !!localStorage.getItem(ASAAS_KEY) || !!asaasConfig,
        whatsapp: !!waConfig
    };
};
