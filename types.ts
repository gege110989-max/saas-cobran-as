
export interface Plan {
  id: string;
  name: string;
  description?: string;
  price: number;
  interval: 'month' | 'year';
  stripeId?: string; // ID do preço no Stripe (ex: price_123...)
  limits: {
    users?: number;
    whatsapp_messages?: number;
    companies?: number;
  };
  isActive: boolean;
  isPublic: boolean;
  isRecommended?: boolean;
  features: string[];
  updated_at?: string;
}

export interface Company {
  id: string;
  name: string;
  email?: string;
  ownerName?: string;
  logoUrl?: string;
  plan: string;
  planId?: string;
  status: 'active' | 'suspended' | 'inactive';
  mrr: number;
  createdAt: string;
  usersCount?: number;
  integrationAsaas?: string;
  integrationWhatsapp?: string;
  churnRisk?: 'low' | 'high';
}

export interface Conversation {
  id: string;
  contact: Contact;
  lastMessage?: string;
  unreadCount: number;
  status: 'ai' | 'human';
  tags: string[];
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  content: string;
  sender: 'user' | 'agent' | 'ai';
  type: 'text';
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
}

export interface SandboxLog {
  id: string;
  timestamp: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

export interface AsaasConfig {
  apiKey: string;
  sandboxKey: string;
  mode: 'production' | 'sandbox';
  autoSync: boolean;
  syncTime: string;
}

export interface WhatsAppConfig {
  phoneNumberId: string;
  businessAccountId: string;
  accessToken: string;
  verifyToken: string;
}

export interface BillingConfig {
  dailyCronTime: string;
  daysBefore: number;
  enableDaysBefore: boolean;
  sendOnDueDate: boolean;
  recoveryScheduledDays: number[];
  enableDaysAfter: boolean;
  autoBlock?: {
      enabled: boolean;
      daysTolerance: number;
  };
}

export interface CompanyUser {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'member';
  status: 'active' | 'invited' | 'inactive';
  lastAccess: string;
  avatarUrl: string;
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  cpfCnpj?: string;
  status: string; // 'active', 'overdue', 'paid', 'blocked'
  source: string; // 'manual', 'asaas', 'whatsapp'
  lastMessageAt?: string;
  totalPaid?: number;
  openInvoices?: number;
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

export interface CronLog {
  id: string;
  executionTime: string;
  type: string;
  status: 'success' | 'failed' | 'warning';
  processed: number;
  errors: number;
  durationMs: number;
}

export interface AILog {
  id: string;
  timestamp: string;
  companyName: string;
  action: string;
  tokensUsed: number;
  status: string;
  model: string;
  latencyMs: number;
}

export interface AsaasWebhookPayload {
    event: string;
    payment: {
        id: string;
        customer: string;
        value: number;
        billingType: string;
        status?: string;
        [key: string]: any;
    };
    [key: string]: any;
}

export interface WhatsAppWebhookPayload {
    object: string;
    entry: any[];
}

export interface Campaign {
    id: string;
    name: string;
    type: 'promotional' | 'informational' | 'collection';
    status: 'draft' | 'scheduled' | 'sending' | 'paused' | 'completed';
    audienceFilter: string;
    totalTargets: number;
    sentCount: number;
    deliveredCount: number;
    readCount: number;
    createdAt: string;
    messageContent: string;
    scheduledAt?: string;
}

export interface AsaasInvoice {
    id: string;
    customer: string;
    value: number;
    dueDate: string;
    status: string;
    invoiceUrl?: string;
    pixQrCodeId?: string;
    identificationField?: string;
    [key: string]: any;
}
