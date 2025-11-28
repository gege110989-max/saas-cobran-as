import { GoogleGenAI } from "@google/genai";

// Initialize AI with the API Key from environment variables
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

// Configuration for Gemini 3 Pro with Thinking Mode
const MODEL_NAME = 'gemini-3-pro-preview';
const THINKING_CONFIG = {
  thinkingConfig: { thinkingBudget: 32768 }
};

export const classifyMessageAI = async (message: string) => {
  try {
    const prompt = `
      Você é um assistente de IA Financeira para um sistema de cobrança (SaaS).
      Analise a seguinte mensagem recebida de um cliente no WhatsApp.
      
      1. Identifique a INTENÇÃO: 'Financeiro' (pagamento, boleto, pix, negociação) ou 'Outros' (suporte, dúvidas gerais).
      2. Identifique o SENTIMENTO: 'Positivo', 'Neutro' ou 'Negativo'.
      3. Identifique se requer Transbordo para Humano (RISCO): Sim ou Não.
      4. Forneça uma breve justificativa (Raciocínio).

      Mensagem do Cliente: "${message}"

      Responda estritamente com um JSON neste formato:
      {
        "intent": "Financeiro" | "Outros",
        "sentiment": "Positivo" | "Neutro" | "Negativo",
        "handoff": boolean,
        "reason": "string"
      }
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        ...THINKING_CONFIG,
        responseMimeType: 'application/json'
      }
    });

    return response.text;
  } catch (error) {
    console.error("Erro ao classificar mensagem:", error);
    throw error;
  }
};

export const generateSmartReply = async (context: string, history: string, maxTokens?: number) => {
  try {
    const prompt = `
      Você é um agente de cobrança profissional e empático.
      Gere uma resposta curta e direta para o cliente baseada no histórico abaixo.
      
      Contexto da Empresa: ${context}
      
      Histórico da Conversa:
      ${history}
      
      A resposta deve ser em português do Brasil, cordial mas firme se for cobrança.
    `;

    const config: any = {
      ...THINKING_CONFIG
    };

    if (maxTokens) {
      config.maxOutputTokens = maxTokens;
    }

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: config
    });

    return response.text;
  } catch (error) {
    console.error("Erro ao gerar resposta:", error);
    throw error;
  }
};

export const improveTemplateAI = async (currentText: string, type: string = 'collection') => {
  try {
    let toneInstruction = "profissional e direto";
    
    if (type === 'promotional') {
        toneInstruction = "entusiasta, persuasivo, focado em benefícios e gatilhos mentais de venda (escassez/oportunidade)";
    } else if (type === 'collection') {
        toneInstruction = "firme, com senso de urgência para regularização, mas mantendo o profissionalismo e respeito";
    } else if (type === 'informational') {
        toneInstruction = "claro, objetivo, institucional e informativo";
    }

    const prompt = `
      Atue como um especialista em Copywriting para Marketing e Cobrança.
      Melhore o seguinte texto de campanha do tipo '${type.toUpperCase()}'.
      
      DIRETRIZ DE TOM: O texto deve ser ${toneInstruction}.
      
      IMPORTANTE: Mantenha as variáveis originais (%name%, %invoice%, %valor%, %link%, %pix%) exatamente onde fazem sentido no texto.
      
      Texto Original:
      "${currentText}"
      
      Retorne apenas o texto melhorado, sem explicações.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        ...THINKING_CONFIG
      }
    });

    return response.text;
  } catch (error) {
    console.error("Erro ao melhorar texto:", error);
    throw error;
  }
};

export const generateCampaignStrategy = async (objective: string) => {
  try {
    const prompt = `
      Atue como um Estrategista de Marketing e Cobrança.
      Eu tenho um objetivo para uma campanha de envio de mensagens via WhatsApp e preciso que você crie a campanha completa.

      OBJETIVO DO USUÁRIO: "${objective}"

      Com base nisso, gere um JSON com:
      1. "name": Um nome criativo e curto para a campanha.
      2. "type": Escolha estritamente um destes: 'promotional' (vendas/ofertas), 'informational' (avisos/institucional), 'collection' (cobrança/pagamentos).
      3. "audienceFilter": Escolha estritamente um destes: 'all' (todos), 'active' (apenas clientes em dia), 'overdue' (apenas inadimplentes).
      4. "messageContent": O texto da mensagem. Deve ser persuasivo, usar emojis adequados e incluir a variável %name% para o nome do cliente.

      Responda estritamente com o JSON.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        ...THINKING_CONFIG,
        responseMimeType: 'application/json'
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Erro ao gerar estratégia de campanha:", error);
    throw error;
  }
};