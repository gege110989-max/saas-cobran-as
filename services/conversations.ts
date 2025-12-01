
import { supabase } from './supabase';
import { authService } from './auth';
import { Conversation, Message } from '../types';

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
        lastMessageAt: c.updated_at,
        source: c.contact.source
    },
    lastMessage: c.last_message,
    unreadCount: c.unread_count,
    status: c.status,
    tags: c.tags || [],
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
    tags: data.tags || [],
    updatedAt: data.updated_at
  };
};

// --- New Methods for Message Handling (Real DB) ---

export const getMessages = async (conversationId: string): Promise<Message[]> => {
    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error("Error fetching messages:", error);
        return [];
    }

    return data.map((m: any) => ({
        id: m.id,
        conversationId: m.conversation_id,
        content: m.content,
        sender: m.sender,
        type: m.type,
        timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: m.status
    }));
};

export const sendMessage = async (conversationId: string, content: string, sender: 'user' | 'agent' | 'ai'): Promise<Message> => {
    const companyId = await authService.getCompanyId();
    if (!companyId) throw new Error("Company not found");

    // 1. Insert Message into DB
    const { data: newMessageData, error } = await supabase
        .from('messages')
        .insert([{
            company_id: companyId,
            conversation_id: conversationId,
            content,
            sender,
            type: 'text',
            status: 'sent'
        }])
        .select()
        .single();

    if (error) throw error;

    // 2. Update Conversation Last Message
    await supabase
        .from('conversations')
        .update({ 
            last_message: content, 
            updated_at: new Date().toISOString(),
            unread_count: sender === 'user' ? undefined : 0 // If agent/ai sends, reset unread. If user, trigger logic elsewhere usually
        })
        .eq('id', conversationId);

    return {
        id: newMessageData.id,
        conversationId: newMessageData.conversation_id,
        content: newMessageData.content,
        sender: newMessageData.sender,
        type: newMessageData.type,
        timestamp: new Date(newMessageData.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: newMessageData.status
    };
};
