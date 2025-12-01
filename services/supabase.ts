import { createClient } from '@supabase/supabase-js';

// Helper para acessar variáveis de ambiente de forma segura
const getEnv = () => {
    try {
        return (import.meta as any).env || {};
    } catch {
        return {};
    }
};

const env = getEnv();

// As credenciais devem vir de variáveis de ambiente (.env)
// Fallback para desenvolvimento local/preview sem .env configurado
const SUPABASE_URL = env.VITE_SUPABASE_URL || 'https://igfdxsnnlliuxrghhxma.supabase.co';
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlnZmR4c25ubGxpdXhyZ2hoeG1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyODQxMjcsImV4cCI6MjA3OTg2MDEyN30.2-QHkL18ipSBEaisVxjBq-RKP354TrkhCAVxiBNKMr0';

if (!SUPABASE_ANON_KEY && env.PROD) {
  console.error("ERRO CRÍTICO: Chave do Supabase não encontrada. Verifique as variáveis de ambiente.");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);