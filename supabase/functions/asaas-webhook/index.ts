
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

declare const Deno: any;

serve(async (req) => {
  // Webhooks geralmente são POST
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const payload = await req.json()
    const { event, payment } = payload
    
    // Obter ID da empresa (geralmente passado na URL do webhook: ?company_id=...)
    const url = new URL(req.url)
    const companyId = url.searchParams.get('company_id')

    if (!companyId) {
        throw new Error('Missing company_id parameter')
    }

    // Opcional: Validar Token do Asaas (req.headers.get('access-token'))

    console.log(`Processing ${event} for company ${companyId}`)

    // Logica de atualização
    if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
        // Encontrar contato pelo email ou ID externo
        // Asaas manda 'customer' ID
        
        // 1. Atualizar Fatura (Se existisse tabela invoices)
        // await supabaseAdmin.from('invoices').update({ status: 'paid' }).eq('external_id', payment.id)

        // 2. Atualizar Contato
        if (payment.customer) {
             // Precisamos achar o contato que tem esse ID do Asaas. 
             // Assumindo que guardamos isso ou buscamos pelo email
             // Para simplificar, buscamos por email se vier no payload (Asaas as vezes manda)
             // Se não, teríamos que buscar na tabela integrations o mapeamento.
             
             // Atualiza status do contato para 'paid' se ele estava 'overdue'
             // (Lógica simplificada)
             const { data: contacts } = await supabaseAdmin
                .from('contacts')
                .select('*')
                .eq('company_id', companyId)
                // Idealmente teríamos uma coluna 'asaas_id' na tabela contacts
                
             // Log
             console.log(`Payment received for customer ${payment.customer}`)
        }
    } else if (event === 'PAYMENT_OVERDUE') {
        // Marcar inadimplência
        console.log(`Overdue payment: ${payment.id}`)
    }

    // Salvar Log de Webhook para auditoria
    await supabaseAdmin.from('webhook_logs').insert({
        provider: 'asaas',
        event: event,
        status: 'success',
        payload_short: JSON.stringify(payload),
        company_id: companyId
    })

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})