export interface Contact {
  id: string;
  name: string;
  phone: string;
  status: 'active' | 'blocked';
  lastMessageAt: string;
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
}

export interface IntegrationStatus {
  connected: boolean;
  lastSync?: string;
  error?: string;
}

export interface BillingConfig {
  daysBefore: number;
  sendOnDueDate: boolean;
  daysAfter: string; // "1,3,7"
  dailyCronTime: string; // "09:00"
}

export interface CompanyUser {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'member';
  status: 'active' | 'invited';
  lastAccess: string;
  avatarUrl?: string;
}