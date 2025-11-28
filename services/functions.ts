
import { supabase } from './supabase';

/**
 * Invoca a Edge Function 'send-whatsapp' de forma segura.
 * Isso substitui a chamada direta à API da Meta no frontend.
 */
export const sendWhatsAppMessage = async (to: string, templateName: string, variables: string[]) => {
  const { data, error } = await supabase.functions.invoke('send-whatsapp', {
    body: {
      to,
      templateName,
      variables: variables.map(v => ({ type: "text", text: v }))
    },
  });

  if (error) throw error;
  return data;
};

/**
 * Invoca a Edge Function 'cron-daily-billing' manualmente.
 * Útil para o botão "Rodar Agora" no painel admin.
 */
export const triggerManualBilling = async () => {
  const { data, error } = await supabase.functions.invoke('cron-daily-billing', {
    method: 'POST',
  });

  if (error) throw error;
  return data;
};

/**
 * Retorna a URL pública para configurar no Asaas.
 * (Apenas informativa para exibir na tela de configurações)
 */
export const getWebhookUrl = (functionName: string) => {
  // A URL padrão do Supabase Edge Functions
  // Você deve substituir 'igfdxsnnlliuxrghhxma' pelo ID real do projeto se mudar
  const PROJECT_REF = 'igfdxsnnlliuxrghhxma'; 
  return `https://${PROJECT_REF}.supabase.co/functions/v1/${functionName}`;
};
