
export interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  cpfCnpj?: string;
  status: 'active' | 'blocked' | 'overdue' | 'paid';
  lastMessageAt: string;
  source: 'asaas' | 'whatsapp' | 'manual';
  totalPaid?: number;
  openInvoices?: number;
}

export interface Message {
  id: string;
  conversationId: string;
  content: string;
  sender: 'user' | 'agent' | 'ai';
  type: 'text' | 'image' | 'document' | 'audio';
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
}

export interface Conversation {
  id: string;
  contact: Contact;
  lastMessage: string;
  unreadCount: number;
  status: 'ai' | 'human'; // Who is currently handling the chat
  tags: string[];
  updatedAt: string;
  updatedAtDate?: Date; // Optional helper for sorting if string format varies
}

export interface IntegrationStatus {
  connected: boolean;
  lastSync?: string;
  error?: string;
  asaas?: boolean;
  whatsapp?: boolean;
}

export interface WhatsAppConfig {
  phoneNumberId: string;
  businessAccountId: string;
  accessToken: string;
  verifyToken?: string; // Token para validação do Webhook da Meta
}

export interface AsaasConfig {
  apiKey: string;
  sandboxKey: string;
  mode: 'production' | 'sandbox';
  autoSync?: boolean;
  syncTime?: string; // Format "HH:mm"
}

export interface AsaasInvoice {
  id: string;
  customer: string; // ID do cliente no Asaas
  value: number;
  netValue?: number;
  status: 'PENDING' | 'RECEIVED' | 'CONFIRMED' | 'OVERDUE' | 'REFUNDED';
  dueDate: string;
  invoiceUrl: string; // Link da fatura
  bankSlipUrl?: string; // Link do PDF do boleto
  pixQrCodeId?: string;
  identificationField?: string; // Linha digitável
  description?: string;
}

export interface BillingConfig {
  daysBefore: number;
  enableDaysBefore: boolean;
  sendOnDueDate: boolean;
  
  // Alterado: Em vez de dias corridos, usamos dias da semana (0-6)
  recoveryScheduledDays: number[]; // Ex: [1, 3] = Segunda e Quarta
  enableDaysAfter: boolean;
  
  dailyCronTime: string; // "09:00"
}

export interface CompanyUser {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'member';
  status: 'active' | 'invited' | 'inactive';
  lastAccess: string;
  avatarUrl?: string;
}

// Novo Tipo para Planos Dinâmicos
export interface Plan {
  id: string;
  name: string;
  description?: string;
  price: number;
  interval: 'month' | 'year';
  limits: {
    users?: number;
    whatsapp_messages?: number;
    companies?: number;
  };
  isActive: boolean;
  isPublic: boolean;
  features: string[];
}

export interface SubscriptionPlan {
  name: string;
  price: number;
  status: 'active' | 'canceled' | 'past_due';
  nextBilling: string;
  usage: {
    messages: number;
    contacts: number;
    limitMessages: number;
    limitContacts: number;
  }
}

// Novos tipos para o Admin SaaS
export interface Company {
  id: string;
  name: string;
  ownerName: string;
  email: string;
  logoUrl?: string; // Novo campo para Logomarca
  plan: string; // Agora pode ser o nome do plano ou ID
  planId?: string;
  status: 'active' | 'suspended' | 'trial';
  mrr: number;
  createdAt: string;
  usersCount: number;
  // Health indicators
  integrationAsaas: 'active' | 'error' | 'inactive';
  integrationWhatsapp: 'active' | 'error' | 'inactive';
  lastCronRun?: string;
  churnRisk: 'low' | 'medium' | 'high';
}

export interface SaasInvoice {
  id: string;
  companyId: string;
  companyName: string;
  planName: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  issueDate: string;
  dueDate: string;
  paidAt?: string;
  pdfUrl?: string;
}

export interface WebhookLog {
  id: string;
  provider: 'asaas' | 'whatsapp';
  event: string;
  status: 'success' | 'failed';
  timestamp: string;
  payloadShort: string;
}

export interface CronLog {
  id: string;
  executionTime: string;
  type: 'daily_billing' | 'sync_data' | 'manual_trigger';
  status: 'success' | 'failed' | 'warning';
  processed: number;
  errors: number;
  durationMs: number;
}

export interface AILog {
  id: string;
  timestamp: string;
  companyName: string;
  action: 'Classificação' | 'Geração de Resposta' | 'Melhoria de Texto';
  tokensUsed: number;
  status: 'success' | 'failed' | 'rate_limit';
  model: string;
  latencyMs: number;
}

export interface SandboxLog {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

// Interfaces específicas para Payloads de Webhook
export interface AsaasWebhookPayload {
  event: 'PAYMENT_RECEIVED' | 'PAYMENT_OVERDUE' | 'PAYMENT_CREATED';
  payment: {
    id: string;
    customer: string;
    customerEmail?: string;
    value: number;
    billingType: string;
  };
  customerEmail?: string; 
}

export interface WhatsAppWebhookPayload {
  object: 'whatsapp_business_account';
  entry: Array<{
    changes: Array<{
      value: {
        messages?: Array<{
          from: string;
          id: string;
          text?: { body: string };
          type: string;
        }>;
      };
    }>;
  }>;
}

export interface Campaign {
  id: string;
  name: string;
  type: 'promotional' | 'informational' | 'collection';
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'paused';
  audienceFilter: string; // ex: 'all', 'overdue', 'active'
  totalTargets: number;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  scheduledAt?: string;
  createdAt: string;
  messageContent: string;
}