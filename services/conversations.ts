
import { supabase } from './supabase';
import { authService } from './auth';
import { Conversation } from '../types';

export const getConversations = async (): Promise<Conversation[]> => {
  const companyId = await authService.getCompanyId();
  if (!companyId) return [];

  // Fetch conversations with contact details
  const { data, error } = await supabase
    .from('conversations')
    .select(`
      *,
      contact:contacts(*)
    `)
    .eq('company_id', companyId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error("Error fetching conversations:", error);
    return [];
  }

  // Transform to match frontend interface
  return data.map((c: any) => ({
    id: c.id,
    contact: {
        id: c.contact.id,
        name: c.contact.name,
        phone: c.contact.phone,
        status: c.contact.status,
        lastMessageAt: c.updated_at, // approximation
        source: c.contact.source
    },
    lastMessage: c.last_message,
    unreadCount: c.unread_count,
    status: c.status,
    tags: [],
    updatedAt: c.updated_at
  }));
};

export const updateConversationStatus = async (conversationId: string, newStatus: 'ai' | 'human'): Promise<Conversation> => {
  const { data, error } = await supabase
    .from('conversations')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', conversationId)
    .select(`*, contact:contacts(*)`)
    .single();

  if (error) throw error;

  return {
    id: data.id,
    contact: data.contact,
    lastMessage: data.last_message,
    unreadCount: data.unread_count,
    status: data.status,
    tags: [],
    updatedAt: data.updated_at
  };
};
