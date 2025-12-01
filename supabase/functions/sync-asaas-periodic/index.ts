
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

declare const Deno: any;

serve(async (req) => {
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  console.log("Iniciando rotina de sincronização periódica...")

  try {
    // 1. Buscar integrações ativas
    const { data: integrations, error } = await supabaseAdmin
      .from('integrations')
      .select('company_id, config')
      .eq('provider', 'asaas')
      .eq('is_active', true)

    if (error) throw error;

    const results = [];

    // 2. Loop por empresa
    for (const integration of integrations) {
      const { apiKey, mode } = integration.config;
      const companyId = integration.company_id;

      if (!apiKey) continue;

      const baseUrl = mode === 'sandbox' 
        ? 'https://sandbox.asaas.com/api/v3' 
        : 'https://www.asaas.com/api/v3';

      try {
        console.log(`Sincronizando empresa ${companyId}...`)

        // A. Buscar Cobranças Vencidas e Pendentes
        const response = await fetch(`${baseUrl}/payments?status=OVERDUE,PENDING&limit=20`, {
            headers: { 'access_token': apiKey }
        });
        
        if (!response.ok) {
            console.error(`Erro Asaas ${companyId}: ${response.statusText}`);
            continue;
        }

        const data = await response.json();
        const payments = data.data || [];
        let overdueCount = 0;

        // B. Processar Faturas
        for (const payment of payments) {
            if (payment.customer) {
               // Atualiza status do contato se necessário (Lógica simplificada)
               const status = payment.status === 'OVERDUE' ? 'overdue' : 'active';
               
               if (status === 'overdue') {
                   // Se tivéssemos o ID do asaas salvo no contato, atualizaríamos aqui
                   // await supabaseAdmin.from('contacts').update({ status: 'overdue' }).eq(...)
                   overdueCount++;
               }
            }
        }
        
        // Aqui também poderíamos chamar a lógica de envio de mensagens (Billing Rule)
        // Para simplificar, apenas logamos que a sincronização ocorreu.

        results.push({ companyId, processed: payments.length, overdueFound: overdueCount });

      } catch (err) {
        console.error(`Falha na empresa ${companyId}`, err);
        results.push({ companyId, error: err.message });
      }
    }

    return new Response(JSON.stringify({ 
        success: true, 
        processed_companies: integrations.length,
        details: results 
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
