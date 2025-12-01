
import { supabase } from './supabase';

// As chamadas agora são feitas para o backend seguro para proteger a API Key
const FUNCTION_NAME = 'generate-ai-response';

export const classifyMessageAI = async (message: string) => {
  try {
    const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
      body: {
        action: 'classify',
        message: message
      }
    });

    if (error) throw error;
    // O backend retorna um objeto JSON ou string JSON
    return typeof data.result === 'string' ? data.result : JSON.stringify(data.result);
  } catch (error) {
    console.error("Erro ao classificar mensagem (AI Proxy):", error);
    // Fallback gracioso para UI não quebrar se o backend falhar
    return JSON.stringify({
        intent: "Outros",
        sentiment: "Neutro",
        handoff: false,
        reason: "IA indisponível no momento (Simulação Local)."
    });
  }
};

export const generateSmartReply = async (context: string, history: string, maxTokens?: number) => {
  try {
    const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
      body: {
        action: 'reply',
        context,
        history,
        maxTokens
      }
    });

    if (error) throw error;
    return data.result;
  } catch (error) {
    console.error("Erro ao gerar resposta (AI Proxy):", error);
    return null;
  }
};

export const improveTemplateAI = async (currentText: string, type: string = 'collection') => {
  try {
    const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
      body: {
        action: 'improve',
        currentText,
        type
      }
    });

    if (error) throw error;
    return data.result;
  } catch (error) {
    console.error("Erro ao melhorar texto (AI Proxy):", error);
    return currentText; // Retorna o texto original em caso de falha
  }
};

export const generateCampaignStrategy = async (objective: string) => {
  try {
    const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
      body: {
        action: 'strategy',
        objective
      }
    });

    if (error) throw error;
    return data.result;
  } catch (error) {
    console.error("Erro ao gerar estratégia (AI Proxy):", error);
    return null;
  }
};
