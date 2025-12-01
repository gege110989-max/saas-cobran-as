
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

declare const Deno: any;

serve(async (req) => {
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // 1. Verificação do Webhook (GET)
  if (req.method === 'GET') {
    const url = new URL(req.url)
    const mode = url.searchParams.get('hub.mode')
    const token = url.searchParams.get('hub.verify_token')
    const challenge = url.searchParams.get('hub.challenge')

    if (mode === 'subscribe' && challenge) {
      console.log('Webhook verificado com sucesso!')
      return new Response(challenge, { status: 200 })
    }
    return new Response('Forbidden', { status: 403 })
  }

  // 2. Recebimento de Mensagens (POST)
  if (req.method === 'POST') {
    try {
      const payload = await req.json()
      
      const entry = payload.entry?.[0]
      const changes = entry?.changes?.[0]
      const value = changes?.value
      
      if (!value) return new Response('No value', { status: 200 })

      if (value.messages && value.messages.length > 0) {
        const message = value.messages[0]
        const from = message.from 
        const businessPhoneId = value.metadata?.phone_number_id
        const textBody = message.text?.body

        console.log(`Mensagem de ${from}: ${textBody}`)

        // A. Identificar Empresa pelo ID do WhatsApp
        const { data: integration } = await supabaseAdmin
          .from('integrations')
          .select('company_id, config')
          .eq('provider', 'whatsapp')
          .contains('config', { phoneNumberId: businessPhoneId })
          .maybeSingle()

        if (!integration) {
          console.error('Empresa não encontrada para ID:', businessPhoneId)
          return new Response('Company not found', { status: 200 })
        }

        const companyId = integration.company_id
        const waConfig = integration.config;

        // B. Identificar/Criar Contato
        let { data: contact } = await supabaseAdmin
          .from('contacts')
          .select('id, name')
          .eq('company_id', companyId)
          .ilike('phone', `%${from.replace(/\D/g, '').slice(-8)}%`)
          .maybeSingle()

        if (!contact) {
          const { data: newContact } = await supabaseAdmin
            .from('contacts')
            .insert({
              company_id: companyId,
              name: payload.contacts?.[0]?.profile?.name || `Lead ${from}`,
              phone: from,
              source: 'whatsapp',
              status: 'active'
            })
            .select()
            .single()
          contact = newContact
        }

        // C. Identificar/Criar Conversa
        let { data: conversation } = await supabaseAdmin
          .from('conversations')
          .select('id, status, unread_count')
          .eq('contact_id', contact.id)
          .maybeSingle()

        if (!conversation) {
          const { data: newConv } = await supabaseAdmin
            .from('conversations')
            .insert({
              company_id: companyId,
              contact_id: contact.id,
              status: 'ai',
              unread_count: 0
            })
            .select()
            .single()
          conversation = newConv
        }

        // D. Salvar Mensagem do Usuário
        // (Aqui simularíamos salvar na tabela 'messages', mas atualizamos a conversa para o frontend ver)
        await supabaseAdmin
            .from('conversations')
            .update({
                last_message: textBody,
                updated_at: new Date().toISOString(),
                unread_count: (conversation.unread_count || 0) + 1
            })
            .eq('id', conversation.id)

        // E. Resposta Automática da IA
        if (conversation.status === 'ai' && textBody) {
            console.log("Acionando IA...")
            
            // Invoca a função generate-ai-response internamente
            const { data: aiResponse, error: aiError } = await supabaseAdmin.functions.invoke('generate-ai-response', {
                body: {
                    action: 'reply',
                    context: "Você é o assistente virtual da Movicobrança. Responda de forma curta e prestativa.",
                    history: `Cliente: ${textBody}`,
                    maxTokens: 150
                }
            });

            if (!aiError && aiResponse?.result) {
                const replyText = aiResponse.result;
                console.log("Resposta IA:", replyText);

                // Enviar via WhatsApp Cloud API
                await fetch(`https://graph.facebook.com/v17.0/${waConfig.phoneNumberId}/messages`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${waConfig.accessToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        messaging_product: "whatsapp",
                        to: from,
                        type: "text",
                        text: { body: replyText }
                    })
                });

                // Registrar resposta da IA
                await supabaseAdmin
                    .from('conversations')
                    .update({
                        last_message: replyText,
                        updated_at: new Date().toISOString(),
                        unread_count: 0 // Lido/Respondido pela IA
                    })
                    .eq('id', conversation.id);
            }
        }
      }

      return new Response('EVENT_RECEIVED', { status: 200 })

    } catch (error) {
      console.error("Webhook Error:", error)
      return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }
  }

  return new Response('Method not allowed', { status: 405 })
})
