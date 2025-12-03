
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

const env = getEnv();
const API_URL = (env && env.VITE_API_URL) ? env.VITE_API_URL : 'http://localhost:8080';

const callAIBackend = async (body: any) => {
    // Ensure we use the correct route defined in server.js
    const url = `${API_URL}/api/ai/generate`;

    const { data: { session } } = await supabase.auth.getSession();
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token || ''}`
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AI Backend Error: ${errorText}`);
    }
    const data = await response.json();
    return data;
};

export const classifyMessageAI = async (message: string) => {
  try {
    const data = await callAIBackend({
        action: 'classify',
        message: message
    });

    return typeof data.result === 'string' ? data.result : JSON.stringify(data.result);
  } catch (error) {
    console.warn("AI Service Error:", error);
    // Fallback response structure
    return JSON.stringify({
        intent: "Outros",
        sentiment: "Neutro",
        handoff: false,
        reason: "IA indisponível no momento."
    });
  }
};

export const generateSmartReply = async (context: string, history: string, maxTokens?: number) => {
  try {
    const data = await callAIBackend({
        action: 'reply',
        context,
        history,
        maxTokens
    });
    return data.result;
  } catch (error) {
    console.warn("AI Service Error:", error);
    return "Olá, em breve entraremos em contato.";
  }
};

export const improveTemplateAI = async (currentText: string, type: string = 'collection') => {
  try {
    const data = await callAIBackend({
        action: 'improve',
        currentText,
        type
    });
    return data.result;
  } catch (error) {
    console.warn("AI Service Error:", error);
    return currentText;
  }
};

export const generateCampaignStrategy = async (objective: string) => {
  try {
    const data = await callAIBackend({
        action: 'strategy',
        objective
    });
    return data.result;
  } catch (error) {
    console.warn("AI Service Error:", error);
    return {
        name: "Campanha Manual",
        type: "promotional",
        audienceFilter: "all",
        messageContent: "Olá, confira nossas novidades!"
    };
  }
};
