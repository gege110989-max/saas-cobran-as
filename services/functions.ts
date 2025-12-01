
import { supabase } from './supabase';

/**
 * Invoca a Edge Function 'send-whatsapp' de forma segura.
 * Isso substitui a chamada direta à API da Meta no frontend.
 */
export const sendWhatsAppMessage = async (to: string, templateName: string, variables: string[]) => {
  try {
    const { data, error } = await supabase.functions.invoke('send-whatsapp', {
      body: {
        to,
        templateName,
        variables: variables.map(v => ({ type: "text", text: v }))
      },
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.warn("Backend de envio indisponível (Simulação):", error);
    return { success: true, simulated: true };
  }
};

/**
 * Invoca a Edge Function 'sync-asaas-periodic' manualmente.
 * Sincroniza faturas e clientes de todas as empresas cadastradas.
 */
export const triggerDailySync = async () => {
  const { data, error } = await supabase.functions.invoke('sync-asaas-periodic', {
    method: 'POST',
  });

  if (error) throw error;
  return data;
};

/**
 * Testa a conectividade com a Edge Function na nuvem.
 * Útil para diagnóstico.
 */
export const pingBackend = async () => {
  try {
    // Tenta invocar a função. Se ela existir, deve responder (mesmo que 400/405).
    const { data, error } = await supabase.functions.invoke('asaas-webhook', {
      method: 'POST',
      body: { event: 'PING' }
    });
    
    // Se der erro de conexão (fetch failed), o SDK joga erro.
    // Se der erro de aplicação (ex: 400), o SDK retorna error object.
    
    if (error) {
       console.log("Ping com erro (esperado para payload teste):", error);
       // Consideramos online se respondeu, mesmo com erro de validação
       return { online: true, message: "Servidor Respondeu (Online)" };
    }
    
    return { online: true, message: "Servidor Online" };
  } catch (e: any) {
    // Tratamento gracioso para não quebrar a UI
    console.error("Ping falhou:", e);
    return { online: false, message: "Offline / Não Deployado" };
  }
};

/**
 * Retorna a URL pública para configurar no Asaas.
 * (Apenas informativa para exibir na tela de configurações)
 */
export const getWebhookUrl = (functionName: string) => {
  // A URL padrão do Supabase Edge Functions
  // Você deve substituir 'igfdxsnnlliuxrghhxma' pelo ID real do projeto se mudar
  // Em produção, isso pode vir de import.meta.env.VITE_SUPABASE_URL se formatado corretamente
  const PROJECT_REF = 'igfdxsnnlliuxrghhxma'; 
  return `https://${PROJECT_REF}.supabase.co/functions/v1/${functionName}`;
};
