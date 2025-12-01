
import { supabase } from './supabase';
import { authService } from './auth';
import { Campaign } from "../types";

export const getCampaigns = async (): Promise<Campaign[]> => {
    const companyId = await authService.getCompanyId();
    if (!companyId) return [];

    const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching campaigns:", error);
        return [];
    }

    return data.map((c: any) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        status: c.status,
        audienceFilter: c.audience_filter,
        totalTargets: c.total_targets,
        sentCount: c.sent_count,
        deliveredCount: c.delivered_count,
        readCount: c.read_count,
        createdAt: new Date(c.created_at).toLocaleDateString('pt-BR'),
        messageContent: c.message_content,
        scheduledAt: c.scheduled_at
    }));
};

export const createCampaign = async (campaign: Omit<Campaign, 'id' | 'createdAt' | 'sentCount' | 'deliveredCount' | 'readCount'>): Promise<Campaign> => {
    const companyId = await authService.getCompanyId();
    if (!companyId) throw new Error("Company not found");

    const payload = {
        company_id: companyId,
        name: campaign.name,
        type: campaign.type,
        status: campaign.status,
        audience_filter: campaign.audienceFilter,
        message_content: campaign.messageContent,
        scheduled_at: campaign.scheduledAt || null,
        total_targets: campaign.totalTargets,
        sent_count: 0,
        delivered_count: 0,
        read_count: 0
    };

    const { data, error } = await supabase
        .from('campaigns')
        .insert([payload])
        .select()
        .single();

    if (error) throw error;

    return {
        id: data.id,
        name: data.name,
        type: data.type,
        status: data.status,
        audienceFilter: data.audience_filter,
        totalTargets: data.total_targets,
        sentCount: data.sent_count,
        deliveredCount: data.delivered_count,
        readCount: data.read_count,
        createdAt: new Date(data.created_at).toLocaleDateString('pt-BR'),
        messageContent: data.message_content,
        scheduledAt: data.scheduled_at
    };
};

export const updateCampaign = async (id: string, updates: Partial<Campaign>): Promise<Campaign> => {
    const payload: any = {};
    if (updates.name) payload.name = updates.name;
    if (updates.messageContent) payload.message_content = updates.messageContent;
    if (updates.audienceFilter) payload.audience_filter = updates.audienceFilter;
    if (updates.scheduledAt !== undefined) payload.scheduled_at = updates.scheduledAt;
    if (updates.status) payload.status = updates.status;
    if (updates.totalTargets !== undefined) payload.total_targets = updates.totalTargets;

    // Update timestamps implicit in DB via triggers usually, but explicit here for immediate UI
    payload.updated_at = new Date().toISOString();

    const { data, error } = await supabase
        .from('campaigns')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;

    return {
        id: data.id,
        name: data.name,
        type: data.type,
        status: data.status,
        audienceFilter: data.audience_filter,
        totalTargets: data.total_targets,
        sentCount: data.sent_count,
        deliveredCount: data.delivered_count,
        readCount: data.read_count,
        createdAt: new Date(data.created_at).toLocaleDateString('pt-BR'),
        messageContent: data.message_content,
        scheduledAt: data.scheduled_at
    };
};

export const deleteCampaign = async (id: string): Promise<void> => {
    const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', id);

    if (error) throw error;
};

export const updateCampaignStatus = async (id: string, status: Campaign['status'], progress?: number) => {
    const payload: any = { status, updated_at: new Date().toISOString() };
    
    // Logic to fetch current total to calculate absolute numbers from progress percentage
    if (progress !== undefined) {
        const { data: current } = await supabase.from('campaigns').select('total_targets').eq('id', id).single();
        if (current) {
            const currentSent = Math.floor(current.total_targets * (progress / 100));
            payload.sent_count = currentSent;
            payload.delivered_count = Math.floor(currentSent * 0.98);
            payload.read_count = Math.floor(currentSent * 0.75);
        }
    }

    const { data, error } = await supabase
        .from('campaigns')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

    if (error) return null;

    return {
        id: data.id,
        name: data.name,
        type: data.type,
        status: data.status,
        audienceFilter: data.audience_filter,
        totalTargets: data.total_targets,
        sentCount: data.sent_count,
        deliveredCount: data.delivered_count,
        readCount: data.read_count,
        createdAt: new Date(data.created_at).toLocaleDateString('pt-BR'),
        messageContent: data.message_content,
        scheduledAt: data.scheduled_at
    };
};
