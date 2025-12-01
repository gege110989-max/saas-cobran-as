
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

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
    // 1. Authenticate User to get Context
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')

    // 2. Get User's Company ID
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!profile?.company_id) throw new Error('Company not found')

    // 3. Fetch WhatsApp Credentials from DB
    // IMPORTANT: We use Service Role Key here to access secrets in 'integrations' table if RLS blocks reading configs
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: integration } = await supabaseAdmin
      .from('integrations')
      .select('config')
      .eq('company_id', profile.company_id)
      .eq('provider', 'whatsapp')
      .single()

    if (!integration?.config) throw new Error('WhatsApp not configured')

    const { phoneNumberId, accessToken } = integration.config
    const { to, templateName, variables } = await req.json()

    // 4. Call Meta API
    // Note: This is a basic implementation for templates. Adjust for free text if needed.
    const body = {
      messaging_product: "whatsapp",
      to: to,
      type: "template",
      template: {
        name: templateName,
        language: { code: "pt_BR" },
        components: [
          {
            type: "body",
            parameters: variables // Array of { type: "text", text: "..." }
          }
        ]
      }
    }

    const response = await fetch(`https://graph.facebook.com/v17.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error?.message || 'Meta API Error')
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})