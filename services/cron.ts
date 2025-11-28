
import { CronLog } from "../types";

const CRON_LOGS_KEY = 'movicobranca_cron_logs';

// Initial seed data to show history
const SEED_LOGS: CronLog[] = [
    { id: 'job_1', executionTime: new Date(Date.now() - 86400000).toLocaleString(), type: 'daily_billing', status: 'success', processed: 1240, errors: 0, durationMs: 4500 },
    { id: 'job_2', executionTime: new Date(Date.now() - 172800000).toLocaleString(), type: 'daily_billing', status: 'success', processed: 1180, errors: 2, durationMs: 4200 },
    { id: 'job_3', executionTime: new Date(Date.now() - 259200000).toLocaleString(), type: 'daily_billing', status: 'warning', processed: 1150, errors: 15, durationMs: 5100 },
];

export const getCronLogs = async (): Promise<CronLog[]> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 600));

    const stored = localStorage.getItem(CRON_LOGS_KEY);
    if (stored) {
        return JSON.parse(stored);
    }

    localStorage.setItem(CRON_LOGS_KEY, JSON.stringify(SEED_LOGS));
    return SEED_LOGS;
};

export const triggerCronJob = async (): Promise<CronLog> => {
    // Simulate processing time (2-4 seconds)
    const processingTime = Math.floor(Math.random() * 2000) + 2000;
    await new Promise(resolve => setTimeout(resolve, processingTime));

    // Simulate results
    const totalItems = Math.floor(Math.random() * 500) + 1000;
    const errorChance = Math.random();
    let errors = 0;
    let status: 'success' | 'warning' | 'failed' = 'success';

    if (errorChance > 0.8) {
        errors = Math.floor(Math.random() * 20);
        status = 'warning';
    } else if (errorChance > 0.95) {
        errors = Math.floor(Math.random() * 100);
        status = 'failed';
    }

    const newLog: CronLog = {
        id: `job_${Date.now()}`,
        executionTime: new Date().toLocaleString(),
        type: 'manual_trigger',
        status: status,
        processed: totalItems,
        errors: errors,
        durationMs: processingTime
    };

    // Save to storage
    const stored = localStorage.getItem(CRON_LOGS_KEY);
    const logs: CronLog[] = stored ? JSON.parse(stored) : SEED_LOGS;
    const updatedLogs = [newLog, ...logs].slice(0, 50); // Keep only last 50
    localStorage.setItem(CRON_LOGS_KEY, JSON.stringify(updatedLogs));

    return newLog;
};

export const getNextCronRun = (): string => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0); // Default 09:00
    return tomorrow.toLocaleString();
};