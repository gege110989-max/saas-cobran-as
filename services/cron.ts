
import { supabase } from './supabase';
import { authService } from './auth';
import { CronLog } from "../types";

export const getCronLogs = async (): Promise<CronLog[]> => {
    const companyId = await authService.getCompanyId();
    
    let query = supabase
        .from('cron_logs')
        .select('*')
        .order('execution_time', { ascending: false })
        .limit(50);

    if (companyId) {
        query = query.eq('company_id', companyId);
    }

    const { data, error } = await query;

    if (error) {
        console.error("Error fetching cron logs:", error);
        return [];
    }

    return data.map((l: any) => ({
        id: l.id,
        executionTime: new Date(l.execution_time).toLocaleString(),
        type: l.type,
        status: l.status,
        processed: l.processed,
        errors: l.errors,
        durationMs: l.duration_ms
    }));
};

export const triggerCronJob = async (): Promise<CronLog> => {
    const startTime = Date.now();
    
    // Invoca a função REAL de backend
    const { data, error } = await supabase.functions.invoke('sync-asaas-periodic', {
        method: 'POST'
    });

    const duration = Date.now() - startTime;
    const companyId = await authService.getCompanyId();

    if (error) {
        // Log de erro no banco
        await supabase.from('cron_logs').insert([{
            company_id: companyId,
            type: 'manual_trigger',
            status: 'failed',
            processed: 0,
            errors: 1,
            duration_ms: duration,
            execution_time: new Date().toISOString()
        }]);
        throw error;
    }

    // O log de sucesso já é criado pela própria edge function geralmente,
    // mas se quisermos feedback imediato na UI retornamos o objeto aqui.
    return {
        id: `manual_${Date.now()}`,
        executionTime: new Date().toLocaleString(),
        type: 'manual_trigger',
        status: 'success',
        processed: data?.processed_companies || 1,
        errors: 0,
        durationMs: duration
    };
};

export const getNextCronRun = (): string => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0); 
    return tomorrow.toLocaleString();
};
