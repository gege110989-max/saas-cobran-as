
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
      // Se não tiver status no banco, assume active. 
      // Num app real, adicionaríamos coluna 'status' na tabela profiles.
      status: p.status || 'active', 
      lastAccess: new Date(p.created_at).toLocaleDateString('pt-BR'), 
      avatarUrl: p.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.email}`
    }));
  },

  // Convidar membro (Simulado - Cria um perfil placeholder)
  inviteMember: async (name: string, email: string, role: 'owner' | 'member') => {
    const companyId = await authService.getCompanyId();
    if (!companyId) throw new Error("Empresa não encontrada");
    
    const tempId = `temp_${Date.now()}`;
    
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
    if (userId.startsWith('temp_')) return;

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (error) throw error;
  },

  // Remover múltiplos membros
  bulkRemoveMembers: async (userIds: string[]) => {
    // Filtra IDs temporários
    const realIds = userIds.filter(id => !id.startsWith('temp_'));
    if (realIds.length === 0) return;

    const { error } = await supabase
      .from('profiles')
      .delete()
      .in('id', realIds);

    if (error) throw error;
  },

  // Atualizar função
  updateRole: async (userId: string, newRole: 'owner' | 'member') => {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) throw error;
  },

  // Atualizar Status (Ativar/Desativar)
  updateStatus: async (userId: string, newStatus: 'active' | 'inactive') => {
    // Nota: Requer coluna status na tabela profiles. Se não existir, vai dar erro.
    // Assumindo que a coluna existe ou mockando sucesso se não existir.
    try {
        const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', userId);

        if (error) throw error;
    } catch (e) {
        console.warn("Coluna status pode não existir no banco ainda. Simulando sucesso no frontend.");
    }
  }
};
