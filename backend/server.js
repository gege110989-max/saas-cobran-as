require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/genai');
const Stripe = require('stripe');

// Dynamic import for node-fetch
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// --- SERVICES CONFIGURATION ---

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("FATAL: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
}

// Admin client for backend operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Stripe Configuration
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });

// Gemini Configuration
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const aiModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// --- AUTH MIDDLEWARE ---
// Validates the JWT sent by the frontend and injects user/company context
const requireAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Missing Authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    
    try {
        // Validate token with Supabase
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
        
        if (error || !user) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        // Fetch user profile to get company_id
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('company_id, stripe_customer_id, email')
            .eq('id', user.id)
            .single();

        if (!profile?.company_id) {
            return res.status(403).json({ error: 'User not associated with a company' });
        }

        // Inject context into request
        req.user = user;
        req.companyId = profile.company_id;
        req.userProfile = profile;
        
        next();
    } catch (err) {
        console.error("Auth Middleware Error:", err);
        return res.status(500).json({ error: 'Internal Server Error during Auth' });
    }
};

// --- PUBLIC ROUTES (Webhooks) ---

// 1. Health Check
app.get('/', (req, res) => {
  res.status(200).send('Movicobranca Backend Online');
});

// 2. WhatsApp Webhook (Meta Verification)
app.get('/webhook/whatsapp', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// 3. WhatsApp Webhook (Incoming Messages)
app.post('/webhook/whatsapp', async (req, res) => {
  try {
    const payload = req.body;
    const value = payload.entry?.[0]?.changes?.[0]?.value;

    if (value?.messages && value.messages.length > 0) {
        const message = value.messages[0];
        const from = message.from;
        const businessPhoneId = value.metadata?.phone_number_id;
        const textBody = message.text?.body;

        // Find Company by Phone ID
        const { data: integration } = await supabaseAdmin
          .from('integrations')
          .select('company_id, config')
          .eq('provider', 'whatsapp')
          .contains('config', { phoneNumberId: businessPhoneId })
          .maybeSingle();

        if (integration) {
            const { company_id, config } = integration;

            // Find or Create Contact
            let { data: contact } = await supabaseAdmin
              .from('contacts')
              .select('id')
              .eq('company_id', company_id)
              .ilike('phone', `%${from.slice(-8)}%`) // Loose matching
              .maybeSingle();

            if (!contact) {
              const { data: newContact } = await supabaseAdmin
                .from('contacts')
                .insert({
                  company_id,
                  name: payload.contacts?.[0]?.profile?.name || `Lead ${from}`,
                  phone: from,
                  source: 'whatsapp',
                  status: 'active'
                })
                .select()
                .single();
              contact = newContact;
            }

            // Find or Create Conversation
            let { data: conversation } = await supabaseAdmin
              .from('conversations')
              .select('id, status, unread_count')
              .eq('contact_id', contact.id)
              .maybeSingle();

            if (!conversation) {
              const { data: newConv } = await supabaseAdmin
                .from('conversations')
                .insert({ company_id, contact_id: contact.id, status: 'ai', unread_count: 0 })
                .select()
                .single();
              conversation = newConv;
            }

            // Save User Message
            await supabaseAdmin.from('messages').insert({
                company_id,
                conversation_id: conversation.id,
                content: textBody,
                sender: 'user',
                type: 'text',
                status: 'delivered'
            });

            // Trigger AI Reply
            if (conversation.status === 'ai' && textBody) {
                const prompt = `Você é um assistente de cobrança amigável. Cliente disse: "${textBody}". Responda curto e profissional.`;
                const result = await aiModel.generateContent(prompt);
                const replyText = result.response.text();

                // Send back to WhatsApp
                await fetch(`https://graph.facebook.com/v17.0/${config.phoneNumberId}/messages`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${config.accessToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        messaging_product: "whatsapp",
                        to: from,
                        type: "text",
                        text: { body: replyText }
                    })
                });

                // Save AI Message
                await supabaseAdmin.from('messages').insert({
                    company_id,
                    conversation_id: conversation.id,
                    content: replyText,
                    sender: 'ai',
                    type: 'text',
                    status: 'sent'
                });
            }
        }
    }
    res.sendStatus(200);
  } catch (error) {
    console.error('Webhook Error:', error);
    res.sendStatus(500);
  }
});

// 4. Asaas Webhook
app.post('/webhook/asaas', async (req, res) => {
    // Process Asaas events (PAYMENT_RECEIVED, etc)
    // Needs logic to find companyId usually passed in query param or metadata
    res.json({ received: true });
});

// --- PROTECTED ROUTES (API) ---

// 5. Send WhatsApp Message (Manual/Campaign)
app.post('/api/whatsapp/send', requireAuth, async (req, res) => {
    try {
        const { to, templateName, variables } = req.body;
        
        const { data: integration } = await supabaseAdmin
            .from('integrations')
            .select('config')
            .eq('company_id', req.companyId)
            .eq('provider', 'whatsapp')
            .single();

        if (!integration?.config) return res.status(400).json({ error: "WhatsApp not configured" });

        const body = {
            messaging_product: "whatsapp",
            to: to,
            type: "template",
            template: {
                name: templateName,
                language: { code: "pt_BR" },
                components: [{ type: "body", parameters: variables }]
            }
        };

        const response = await fetch(`https://graph.facebook.com/v17.0/${integration.config.phoneNumberId}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${integration.config.accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || 'Meta API Error');

        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 6. Asaas Sync (Manual Trigger)
app.post('/api/asaas/sync', requireAuth, async (req, res) => {
    try {
        const { data: integration } = await supabaseAdmin
            .from('integrations')
            .select('config')
            .eq('company_id', req.companyId)
            .eq('provider', 'asaas')
            .single();

        if (!integration?.config?.apiKey) return res.status(400).json({ error: "Asaas not configured" });

        const { apiKey, mode } = integration.config;
        const baseUrl = mode === 'sandbox' ? 'https://sandbox.asaas.com/api/v3' : 'https://www.asaas.com/api/v3';

        // Fetch Payments
        const response = await fetch(`${baseUrl}/payments?status=OVERDUE,PENDING&limit=50`, {
            headers: { 'access_token': apiKey }
        });
        
        const data = await response.json();
        
        // Simple logic: return count processed (Real implementation would upsert to DB)
        res.json({ success: true, processed: data.totalCount || 0, data: data.data });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 7. AI Generate
app.post('/api/ai/generate', requireAuth, async (req, res) => {
    try {
        const { action, message, context, history, currentText, type, objective } = req.body;
        let prompt = "";
        let isJson = false;

        switch (action) {
            case 'classify':
                isJson = true;
                prompt = `Analise: "${message}". Retorne JSON: { "intent": "Financeiro"|"Outros", "sentiment": "Positivo"|"Neutro"|"Negativo", "handoff": boolean, "reason": "string" }`;
                break;
            case 'reply':
                prompt = `Contexto: ${context}\nHistórico: ${history}\nInstrução: Gere resposta curta e profissional.`;
                break;
            case 'improve':
                prompt = `Melhore este texto para campanha '${type}': "${currentText}". Torne mais persuasivo. Mantenha variáveis como %name%. Retorne apenas o texto.`;
                break;
            case 'strategy':
                isJson = true;
                prompt = `Crie estratégia para: "${objective}". Retorne JSON: { "name": "...", "type": "promotional"|"informational"|"collection", "audienceFilter": "...", "messageContent": "..." }`;
                break;
        }

        const result = await aiModel.generateContent(prompt);
        let text = result.response.text();

        if (isJson) {
            text = text.replace(/```json/g, '').replace(/```/g, '').trim();
            try {
                return res.json({ result: JSON.parse(text) });
            } catch (e) {
                // Fallback if raw text
            }
        }
        res.json({ result: text });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 8. Stripe Checkout
app.post('/api/stripe/checkout', requireAuth, async (req, res) => {
    try {
        const { plan, returnUrl } = req.body;
        const { stripe_customer_id, email, company_id } = req.userProfile;

        let customerId = stripe_customer_id;

        // Create Stripe Customer if missing
        if (!customerId) {
            const customer = await stripe.customers.create({
                email: email,
                metadata: { supabase_uid: req.user.id, company_id: company_id }
            });
            customerId = customer.id;
            await supabaseAdmin.from('profiles').update({ stripe_customer_id: customerId }).eq('id', req.user.id);
        }

        // Map plan names to Price IDs (Replace with your real Price IDs from Stripe Dashboard)
        const priceIds = {
            'pro': 'price_1Q...', // Replace with env var usually
            'enterprise': 'price_1Q...' 
        };
        
        // Fallback for demo if no real price ID
        const priceId = priceIds[plan] || 'price_mock_id'; 

        // If using mock prices, we can't create a real session easily without error. 
        // For production, ensure valid Price IDs.
        // Returning a mock URL if prices are not configured for safety in this demo context.
        if (priceId === 'price_mock_id') {
             return res.json({ url: `${returnUrl}?success=true&mock=true` });
        }

        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            line_items: [{ price: priceId, quantity: 1 }],
            mode: 'subscription',
            success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: returnUrl,
            metadata: { company_id: company_id, plan_name: plan }
        });

        res.json({ url: session.url });

    } catch (error) {
        console.error("Stripe Checkout Error:", error);
        res.status(400).json({ error: error.message });
    }
});

// 9. Stripe Portal
app.post('/api/stripe/portal', requireAuth, async (req, res) => {
    try {
        const { returnUrl } = req.body;
        const { stripe_customer_id } = req.userProfile;

        if (!stripe_customer_id) {
            return res.status(400).json({ error: "No customer ID found" });
        }

        const session = await stripe.billingPortal.sessions.create({
            customer: stripe_customer_id,
            return_url: returnUrl,
        });

        res.json({ url: session.url });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Start Server
app.listen(port, () => {
  console.log(`Backend running on port ${port}`);
});
