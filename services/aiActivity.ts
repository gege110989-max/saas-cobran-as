
import { supabase } from './supabase';
import { authService } from './auth';
import { AILog } from "../types";

export const getAILogs = async (): Promise<AILog[]> => {
    const companyId = await authService.getCompanyId();
    if (!companyId) return [];

    const { data, error } = await supabase
        .from('ai_logs')
        .select(`
            *,
            company:companies(name)
        `)
        .eq('company_id', companyId)
        .order('timestamp', { ascending: false })
        .limit(100);

    if (error) {
        console.error("Error fetching AI logs:", error);
        return [];
    }

    return data.map((l: any) => ({
        id: l.id,
        timestamp: new Date(l.timestamp).toLocaleString(),
        companyName: l.company?.name || 'Unknown',
        action: l.action,
        tokensUsed: l.tokens_used,
        status: l.status,
        model: l.model,
        latencyMs: l.latency_ms
    }));
};

export const logAIActivity = async (log: Omit<AILog, 'id' | 'timestamp' | 'companyName'>) => {
    const companyId = await authService.getCompanyId();
    if (!companyId) return;

    const { error } = await supabase
        .from('ai_logs')
        .insert([{
            company_id: companyId,
            action: log.action,
            model: log.model,
            tokens_used: log.tokensUsed,
            status: log.status,
            latency_ms: log.latencyMs,
            timestamp: new Date().toISOString()
        }]);

    if (error) console.error("Error saving AI log:", error);
};
