
import { Campaign } from "../types";

const CAMPAIGNS_KEY = 'movicobranca_campaigns';

const INITIAL_CAMPAIGNS: Campaign[] = [
    {
        id: 'camp_1',
        name: 'Aviso de Manutenção',
        type: 'informational',
        status: 'completed',
        audienceFilter: 'active',
        totalTargets: 150,
        sentCount: 150,
        deliveredCount: 148,
        readCount: 120,
        createdAt: '2024-10-20',
        messageContent: 'Olá %name%, teremos uma manutenção programada...'
    },
    {
        id: 'camp_2',
        name: 'Promoção Black Friday',
        type: 'promotional',
        status: 'draft',
        audienceFilter: 'all',
        totalTargets: 1240,
        sentCount: 0,
        deliveredCount: 0,
        readCount: 0,
        createdAt: '2024-11-01',
        messageContent: 'Oi %name%, a Black Friday chegou!'
    }
];

export const getCampaigns = async (): Promise<Campaign[]> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    const stored = localStorage.getItem(CAMPAIGNS_KEY);
    if (stored) return JSON.parse(stored);
    localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(INITIAL_CAMPAIGNS));
    return INITIAL_CAMPAIGNS;
};

export const createCampaign = async (campaign: Omit<Campaign, 'id' | 'createdAt' | 'sentCount' | 'deliveredCount' | 'readCount'>): Promise<Campaign> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newCampaign: Campaign = {
        ...campaign,
        id: `camp_${Date.now()}`,
        createdAt: new Date().toLocaleDateString('pt-BR'),
        sentCount: 0,
        deliveredCount: 0,
        readCount: 0
    };

    const stored = localStorage.getItem(CAMPAIGNS_KEY);
    const campaigns = stored ? JSON.parse(stored) : INITIAL_CAMPAIGNS;
    const updated = [newCampaign, ...campaigns];
    
    localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(updated));
    return newCampaign;
};

export const deleteCampaign = async (id: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const stored = localStorage.getItem(CAMPAIGNS_KEY);
    if (!stored) return;
    
    const campaigns: Campaign[] = JSON.parse(stored);
    const updated = campaigns.filter(c => c.id !== id);
    localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(updated));
};

export const updateCampaignStatus = async (id: string, status: Campaign['status'], progress?: number) => {
    const stored = localStorage.getItem(CAMPAIGNS_KEY);
    if (!stored) return;
    
    let campaigns: Campaign[] = JSON.parse(stored);
    campaigns = campaigns.map(c => {
        if (c.id === id) {
            const updates: any = { status };
            
            // Only update counts if progress is provided, otherwise keep existing counts
            if (progress !== undefined) {
                // Simulate sending logic
                updates.sentCount = Math.floor(c.totalTargets * (progress / 100));
                updates.deliveredCount = Math.floor(updates.sentCount * 0.98); // 98% delivery rate mock
                updates.readCount = Math.floor(updates.sentCount * 0.75); // 75% read rate mock
            }
            
            return { ...c, ...updates };
        }
        return c;
    });
    
    localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(campaigns));
    return campaigns.find(c => c.id === id);
};
