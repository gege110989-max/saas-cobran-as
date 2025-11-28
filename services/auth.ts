
import { supabase } from './supabase';

export const authService = {
  // Helper: Garante que o usuário tenha Empresa e Perfil criados
  // Útil caso o fluxo de cadastro tenha sido interrompido por confirmação de e-mail
  ensureOnboarding: async (userId: string, email: string, name: string) => {
    // 1. Check if profile exists
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (profile) return { companyId: profile.company_id };

    console.log("Usuário sem perfil detectado. Iniciando criação tardia...");

    // 2. Create Company
    // O nome da empresa será genérico se não foi capturado no momento, o usuário pode mudar depois
    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .insert([
        { name: `Empresa de ${name.split(' ')[0]}`, plan: 'free', status: 'active', owner_id: userId }
      ])
      .select()
      .single();

    if (companyError) {
      console.error("Error creating company (Lazy):", companyError);
      throw new Error("Erro ao configurar empresa.");
    }

    // 3. Create Profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([
        { 
          id: userId, 
          company_id: companyData.id, 
          name: name, 
          email: email, 
          role: 'owner' 
        }
      ]);

    if (profileError) {
        console.error("Error creating profile (Lazy):", profileError);
        throw new Error("Erro ao configurar perfil.");
    }

    return { companyId: companyData.id };
  },

  // Sign Up: Tenta criar tudo. Se falhar por falta de sessão (email confirm), avisa.
  signUp: async (name: string, companyName: string, email: string, password: string) => {
    // 1. Create Auth User
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name } // Meta dados para usar depois
      }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error("Erro ao iniciar cadastro.");

    // Se não houver sessão, significa que o Supabase exige confirmação de email.
    // Não podemos criar a empresa agora pois não temos permissão (RLS).
    // O usuário terá a empresa criada no primeiro login (via ensureOnboarding).
    if (!authData.session) {
        return { 
            user: authData.user, 
            session: null, 
            requiresConfirmation: true 
        };
    }

    const userId = authData.user.id;

    // Se temos sessão, criamos tudo agora
    try {
        // 2. Create Company
        const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .insert([
            { name: companyName, plan: 'free', status: 'active', owner_id: userId }
        ])
        .select()
        .single();

        if (companyError) throw companyError;

        // 3. Create Profile
        const { error: profileError } = await supabase
        .from('profiles')
        .insert([
            { 
            id: userId, 
            company_id: companyData.id, 
            name: name, 
            email: email, 
            role: 'owner' 
            }
        ]);

        if (profileError) throw profileError;

        return { user: authData.user, company: companyData, session: authData.session };

    } catch (dbError) {
        console.error("Erro na criação do banco:", dbError);
        // Não jogamos erro aqui para não travar o usuário. 
        // Ele conseguirá logar, e o 'ensureOnboarding' corrigirá depois.
        return { user: authData.user, session: authData.session, partial: true };
    }
  },

  // Sign In
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Verificar se o onboarding foi concluído
    if (data.user) {
        const name = data.user.user_metadata?.full_name || email.split('@')[0];
        try {
            await authService.ensureOnboarding(data.user.id, email, name);
        } catch (e) {
            console.error("Falha no onboarding automático:", e);
        }
    }

    return data;
  },

  // Sign Out
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    localStorage.removeItem('movicobranca_session');
  },

  // Get Current User Profile & Company ID
  getUserProfile: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) return null;
    return profile;
  },

  // Helper to get only the company ID for queries
  getCompanyId: async () => {
    const profile = await authService.getUserProfile();
    return profile?.company_id;
  }
};
