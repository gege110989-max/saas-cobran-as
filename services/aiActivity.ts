
import { AILog } from "../types";

const AI_LOGS_KEY = 'movicobranca_ai_logs';

// Seed data
const SEED_AI_LOGS: AILog[] = [
    { id: 'ai_1', timestamp: '2024-10-27 14:30:05', companyName: 'Tech Solutions Ltda', action: 'Classificação', tokensUsed: 156, status: 'success', model: 'gemini-3-pro-preview', latencyMs: 1200 },
    { id: 'ai_2', timestamp: '2024-10-27 14:28:12', companyName: 'Advocacia Santos', action: 'Geração de Resposta', tokensUsed: 420, status: 'success', model: 'gemini-3-pro-preview', latencyMs: 2100 },
    { id: 'ai_3', timestamp: '2024-10-27 14:15:00', companyName: 'Mercado Express', action: 'Classificação', tokensUsed: 0, status: 'rate_limit', model: 'gemini-3-pro-preview', latencyMs: 150 },
    { id: 'ai_4', timestamp: '2024-10-27 14:10:22', companyName: 'Consultoria Digital', action: 'Melhoria de Texto', tokensUsed: 890, status: 'success', model: 'gemini-3-pro-preview', latencyMs: 3400 },
    { id: 'ai_5', timestamp: '2024-10-27 13:55:40', companyName: 'Tech Solutions Ltda', action: 'Geração de Resposta', tokensUsed: 350, status: 'failed', model: 'gemini-3-pro-preview', latencyMs: 5000 },
];

export const getAILogs = async (): Promise<AILog[]> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const stored = localStorage.getItem(AI_LOGS_KEY);
    if (stored) {
        return JSON.parse(stored);
    }

    localStorage.setItem(AI_LOGS_KEY, JSON.stringify(SEED_AI_LOGS));
    return SEED_AI_LOGS;
};

// Function to simulate adding a log (to be used when testing actual AI)
export const logAIActivity = (log: Omit<AILog, 'id' | 'timestamp'>) => {
    const newLog: AILog = {
        ...log,
        id: `ai_${Date.now()}`,
        timestamp: new Date().toLocaleString()
    };
    
    const stored = localStorage.getItem(AI_LOGS_KEY);
    const logs: AILog[] = stored ? JSON.parse(stored) : SEED_AI_LOGS;
    const updatedLogs = [newLog, ...logs].slice(0, 100); // Keep last 100
    
    localStorage.setItem(AI_LOGS_KEY, JSON.stringify(updatedLogs));
};
