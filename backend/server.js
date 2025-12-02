require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/genai');
const Stripe = require('stripe');

const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json()); // Parse JSON bodies

// --- CONFIGURAÇÃO DE SERVIÇOS ---

// Supabase (Service Role para backend total)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });

// Google Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const aiModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// --- ROTAS (Endpoints) ---

// 1. Health Check (Ping)
app.get('/', (req, res) => {
  res.status(200).send('Movicobrança Backend is Running on Cloud Run!');
});

// 2. Webhook do WhatsApp (Meta)
// Verificação (GET)
app.get('/webhook/whatsapp', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log('Webhook WhatsApp verificado!');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Recebimento de Mensagens (POST)
app.post('/webhook/whatsapp', async (req, res) => {
  try {
    const payload = req.body;
    // ... Lógica de processamento igual à Edge Function ...
    // (Simplificado para o exemplo, mas deve conter toda a lógica de contacts/conversations)
    
    // Identificar mensagem
    const entry = payload.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (value?.messages) {
        const message = value.messages[0];
        console.log(`Nova mensagem de ${message.from}: ${message.text?.body}`);
        
        // Aqui entraria a lógica de buscar a empresa no Supabase e responder com IA
        // ...
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Erro no webhook WhatsApp:', error);
    res.sendStatus(500);
  }
});

// 3. Webhook do Asaas
app.post('/webhook/asaas', async (req, res) => {
  try {
    const { event, payment } = req.body;
    const companyId = req.query.company_id;

    if (!companyId) return res.status(400).json({ error: 'Missing company_id' });

    console.log(`Evento Asaas ${event} para empresa ${companyId}`);

    // Salvar log no Supabase
    await supabase.from('webhook_logs').insert({
        provider: 'asaas',
        event,
        status: 'success',
        payload_short: JSON.stringify(req.body),
        company_id: companyId
    });

    // Lógica de atualização de status de pagamento
    if (event === 'PAYMENT_RECEIVED' && payment.customer) {
        // Buscar contato pelo ID do cliente no Asaas (se mapeado) ou email
        // ...
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Erro webhook Asaas:', error);
    res.status(500).json({ error: error.message });
  }
});

// 4. Proxy de IA (Gemini)
app.post('/api/ai/generate', async (req, res) => {
  try {
    const { action, message, context, history } = req.body;
    let prompt = '';

    if (action === 'classify') {
        prompt = `Analise: "${message}". Retorne JSON: { "intent": "Financeiro"|"Outros", "sentiment": "Positivo"|"Neutro"|"Negativo" }`;
    } else if (action === 'reply') {
        prompt = `Contexto: ${context}\nHistórico: ${history}\nGere uma resposta curta e profissional.`;
    }

    const result = await aiModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Tentar parsear JSON se for classificação
    if (action === 'classify') {
        try {
            const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return res.json({ result: JSON.parse(jsonStr) });
        } catch (e) {
            return res.json({ result: { error: 'Parse Error', raw: text } });
        }
    }

    res.json({ result: text });
  } catch (error) {
    console.error('Erro IA:', error);
    res.status(500).json({ error: error.message });
  }
});

// 5. Stripe Checkout
app.post('/api/stripe/checkout', async (req, res) => {
    // ... Implementação do Stripe igual à Edge Function ...
    res.json({ url: 'https://checkout.stripe.com/mock-url' });
});

// Iniciar Servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});