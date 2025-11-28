
import { createClient } from '@supabase/supabase-js';

// Credentials provided by user
const SUPABASE_URL = 'https://igfdxsnnlliuxrghhxma.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlnZmR4c25ubGxpdXhyZ2hoeG1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyODQxMjcsImV4cCI6MjA3OTg2MDEyN30.2-QHkL18ipSBEaisVxjBq-RKP354TrkhCAVxiBNKMr0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
