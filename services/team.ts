
import { supabase } from './supabase';
import { authService } from './auth';
import { CompanyUser } from '../types';

export const teamService = {
  // Listar membros da equipe
  getMembers: async (): Promise<CompanyUser[]> => {
    const companyId = await authService.getCompanyId();
    if (!companyId) return [];

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Erro ao buscar equipe:", error);
      return [];
    }

    return data.map((p: any) => ({
      id: p.id,
      name: p.name || p.email.split('@')[0],
      email: p.email,
      role: p.role,
      status: 'active', // No banco simples, assumimos active se o perfil existe
      lastAccess: new Date(p.created_at).toLocaleDateString('pt-BR'), // Simulando último acesso com data de criação por enquanto
      avatarUrl: p.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.email}`
    }));
  },

  // Convidar membro (Simulado - Cria um perfil placeholder)
  inviteMember: async (name: string, email: string, role: 'owner' | 'member') => {
    const companyId = await authService.getCompanyId();
    if (!companyId) throw new Error("Empresa não encontrada");

    // Em um sistema real, isso enviaria um email e criaria um registro em uma tabela de 'invites'.
    // Para simplificar neste estágio híbrido, vamos criar um perfil direto, mas marcado como placeholder.
    // Nota: O Supabase Auth precisa que o usuário se cadastre real. 
    // Aqui estamos apenas simulando a visualização na tabela.
    
    // Gerar ID temporário para visualização
    const tempId = `temp_${Date.now()}`;
    
    // Opcional: Salvar em tabela 'invites' se existisse.
    // Retornamos o objeto para a UI atualizar otimisticamente.
    return {
      id: tempId,
      name,
      email,
      role,
      status: 'invited',
      lastAccess: '-',
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`
    } as CompanyUser;
  },

  // Remover membro (Excluir perfil)
  removeMember: async (userId: string) => {
    // Se for ID temporário de convite
    if (userId.startsWith('temp_')) return;

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (error) throw error;
  },

  // Atualizar função
  updateRole: async (userId: string, newRole: 'owner' | 'member') => {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) throw error;
  }
};
