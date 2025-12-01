
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3"

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) throw new Error('GEMINI_API_KEY not configured on server');

    const genAI = new GoogleGenerativeAI(apiKey);
    // Usando gemini-2.5-flash como solicitado nas diretrizes para tarefas de texto
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const { action, message, context, history, currentText, type, objective } = await req.json();

    let prompt = "";
    let isJson = false;

    switch (action) {
        case 'classify':
            isJson = true;
            prompt = `
                Você é um assistente de IA Financeira (Movicobrança). Analise a mensagem do cliente: "${message}".
                Retorne APENAS um JSON válido (sem markdown, sem blocos de código) com a seguinte estrutura:
                {
                    "intent": "Financeiro" | "Outros",
                    "sentiment": "Positivo" | "Neutro" | "Negativo",
                    "handoff": boolean (true se o cliente pedir humano ou estiver muito irritado),
                    "reason": "Explicação curta em português"
                }
            `;
            break;

        case 'reply':
            prompt = `
                Contexto da Empresa: ${context}
                Histórico da Conversa: ${history}
                
                Instrução: Gere uma resposta curta, empática e profissional para o cliente via WhatsApp.
                Se for cobrança, seja firme mas cordial. Mantenha as respostas concisas (máximo 2 frases se possível).
                Retorne apenas o texto da resposta.
            `;
            break;

        case 'improve':
            prompt = `
                Atue como um especialista em Copywriting de Cobrança e Marketing.
                Melhore este texto para uma campanha do tipo '${type}': "${currentText}".
                Objetivo: Torná-lo mais persuasivo, profissional e aumentar a taxa de conversão.
                Mantenha as variáveis originais (ex: %name%, %link%).
                Retorne apenas o texto melhorado.
            `;
            break;

        case 'strategy':
            isJson = true;
            prompt = `
                Crie uma estratégia de campanha de régua de cobrança ou marketing para o objetivo: "${objective}".
                Retorne APENAS um JSON válido (sem markdown) com:
                {
                    "name": "Nome Criativo da Campanha",
                    "type": "promotional" | "informational" | "collection",
                    "audienceFilter": "all" | "active" | "overdue",
                    "messageContent": "Texto da mensagem sugerida usando variáveis como %name% e %link%"
                }
            `;
            break;

        default:
            throw new Error("Invalid action");
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    if (isJson) {
        // Limpeza de markdown caso o modelo retorne ```json ... ```
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        try {
            const jsonResult = JSON.parse(text);
            return new Response(JSON.stringify({ result: jsonResult }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        } catch (e) {
            console.error("JSON Parse Error", text);
            return new Response(JSON.stringify({ result: { error: "Failed to parse JSON", raw: text } }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
    }

    return new Response(JSON.stringify({ result: text }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error("AI Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
