
import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  MoreVertical, 
  Mail, 
  Shield,
  CheckCircle2, 
  Clock,
  Ban,
  UserX,
  UserCheck,
  X,
  Send,
  Trash2,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckSquare,
  Square,
  Power
} from 'lucide-react';
import { CompanyUser } from '../types';
import { teamService } from '../services/team';

const ITEMS_PER_PAGE = 5;
// Mock ID do usuário logado para evitar auto-delete
const CURRENT_USER_MOCK_ID = 'user_logged_in_id'; 

// Components defined outside to prevent re-renders
const Backdrop = ({ onClick }: { onClick: () => void }) => (
  <div 
    className="fixed inset-0 z-10 bg-transparent"
    onClick={onClick}
  />
);

const UserSkeleton = () => (
  <tr className="animate-pulse border-b border-slate-50 last:border-0">
    <td className="px-6 py-4 w-4">
       <div className="w-5 h-5 bg-slate-200 rounded"></div>
    </td>
    <td className="px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-slate-200"></div>
        <div className="space-y-2">
          <div className="h-4 w-32 bg-slate-200 rounded"></div>
          <div className="h-3 w-48 bg-slate-100 rounded"></div>
        </div>
      </div>
    </td>
    <td className="px-6 py-4">
      <div className="h-6 w-24 bg-slate-200 rounded-full"></div>
    </td>
    <td className="px-6 py-4">
      <div className="h-6 w-20 bg-slate-200 rounded-full"></div>
    </td>
    <td className="px-6 py-4">
      <div className="h-4 w-24 bg-slate-200 rounded"></div>
    </td>
    <td className="px-6 py-4 text-right">
      <div className="h-8 w-8 bg-slate-200 rounded ml-auto"></div>
    </td>
  </tr>
);

const UsersPage = () => {
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  
  // Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  
  // Feedback State
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  // Modal States
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'member' as 'owner' | 'member' });
  
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    type: 'activate' | 'deactivate' | 'revoke' | 'change_role' | 'delete' | 'bulk_delete';
    userId?: string;
    userName?: string;
    count?: number; // for bulk
    newRole?: 'owner' | 'member';
  } | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await teamService.getMembers();
      setUsers(data);
    } catch (error) {
      console.error("Erro ao carregar usuários", error);
      showToast("Erro ao carregar a equipe.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Pagination Logic
  const totalPages = Math.ceil(users.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentUsers = users.slice(startIndex, endIndex);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Selection Logic
  const toggleSelectAll = () => {
    if (selectedIds.length === users.length && users.length > 0) {
        setSelectedIds([]);
    } else {
        setSelectedIds(users.map(u => u.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
        setSelectedIds(selectedIds.filter(sid => sid !== id));
    } else {
        setSelectedIds([...selectedIds, id]);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const toggleMenu = (id: string) => {
    if (openMenuId === id) {
      setOpenMenuId(null);
    } else {
      setOpenMenuId(id);
    }
  };

  // Action Requests
  const requestChangeRole = (userId: string, userName: string, newRole: 'owner' | 'member') => {
    setOpenMenuId(null);
    setConfirmationModal({
        isOpen: true,
        type: 'change_role',
        userId,
        userName,
        newRole
    });
  };

  const requestDeleteUser = (user: CompanyUser) => {
    setOpenMenuId(null);
    setConfirmationModal({
        isOpen: true,
        type: 'delete',
        userId: user.id,
        userName: user.name
    });
  };

  const requestRevokeInvite = (user: CompanyUser) => {
    setOpenMenuId(null);
    setConfirmationModal({
        isOpen: true,
        type: 'revoke',
        userId: user.id,
        userName: user.name
    });
  };

  const requestToggleStatus = (user: CompanyUser) => {
      setOpenMenuId(null);
      const newType = user.status === 'active' ? 'deactivate' : 'activate';
      setConfirmationModal({
          isOpen: true,
          type: newType,
          userId: user.id,
          userName: user.name
      });
  };

  const handleBulkDelete = () => {
      if (selectedIds.length === 0) return;
      setConfirmationModal({
          isOpen: true,
          type: 'bulk_delete',
          count: selectedIds.length
      });
  };

  const confirmAction = async () => {
    if (!confirmationModal) return;

    try {
        if (confirmationModal.type === 'revoke' || confirmationModal.type === 'delete') {
            await teamService.removeMember(confirmationModal.userId!);
            setUsers(users.filter(u => u.id !== confirmationModal.userId));
            showToast(confirmationModal.type === 'revoke' ? 'Convite cancelado.' : 'Usuário removido da equipe.');
        } 
        else if (confirmationModal.type === 'bulk_delete') {
            await teamService.bulkRemoveMembers(selectedIds);
            setUsers(users.filter(u => !selectedIds.includes(u.id)));
            setSelectedIds([]);
            showToast(`${confirmationModal.count} usuários removidos.`);
        }
        else if (confirmationModal.type === 'change_role' && confirmationModal.newRole) {
            await teamService.updateRole(confirmationModal.userId!, confirmationModal.newRole);
            setUsers(users.map(user => 
                user.id === confirmationModal.userId ? { ...user, role: confirmationModal.newRole! } : user
            ));
            showToast(`Função atualizada com sucesso.`);
        }
        else if (confirmationModal.type === 'activate' || confirmationModal.type === 'deactivate') {
            const newStatus = confirmationModal.type === 'activate' ? 'active' : 'inactive';
            await teamService.updateStatus(confirmationModal.userId!, newStatus);
            setUsers(users.map(user => 
                user.id === confirmationModal.userId ? { ...user, status: newStatus } : user
            ));
            showToast(`Usuário ${newStatus === 'active' ? 'ativado' : 'desativado'} com sucesso.`);
        }
    } catch (error) {
        console.error(error);
        showToast("Erro ao processar ação.", "error");
    }
    
    setConfirmationModal(null);
  };

  // Invite Logic
  const handleOpenInviteModal = () => {
    setNewUser({ name: '', email: '', role: 'member' });
    setIsInviteModalOpen(true);
  }

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email) return;

    try {
        const invitedUser = await teamService.inviteMember(newUser.name, newUser.email, newUser.role);
        setUsers([invitedUser, ...users]);
        setIsInviteModalOpen(false);
        showToast(`Convite enviado para ${newUser.email}`);
    } catch (error) {
        showToast("Erro ao enviar convite.", "error");
    }
  };

  const handleResendInvite = (user: CompanyUser) => {
    setOpenMenuId(null);
    showToast(`Convite reenviado para ${user.email}`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 relative pb-10">
      {openMenuId && <Backdrop onClick={() => setOpenMenuId(null)} />}
      
      {/* Invite User Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="text-lg font-bold text-slate-900">Convidar Novo Membro</h3>
                <button onClick={() => setIsInviteModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleSendInvite} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
                  <input 
                    type="text" 
                    required
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                    placeholder="Ex: Ana Maria"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">E-mail Corporativo</label>
                  <input 
                    type="email" 
                    required
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    placeholder="ana@empresa.com.br"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Função de Acesso</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setNewUser({...newUser, role: 'member'})}
                      className={`flex flex-col items-center justify-center p-3 rounded-lg border text-sm transition-all ${
                        newUser.role === 'member' 
                          ? 'bg-brand-50 border-brand-500 text-brand-700 ring-1 ring-brand-500' 
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <UserCheck className={`w-5 h-5 mb-1 ${newUser.role === 'member' ? 'text-brand-600' : 'text-slate-400'}`} />
                      <span className="font-medium">Membro</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewUser({...newUser, role: 'owner'})}
                      className={`flex flex-col items-center justify-center p-3 rounded-lg border text-sm transition-all ${
                        newUser.role === 'owner' 
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-1 ring-indigo-500' 
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Shield className={`w-5 h-5 mb-1 ${newUser.role === 'owner' ? 'text-indigo-600' : 'text-slate-400'}`} />
                      <span className="font-medium">Admin</span>
                    </button>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => setIsInviteModalOpen(false)}
                    className="flex-1 px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors text-sm"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium shadow-sm transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    Enviar Convite
                  </button>
                </div>
              </form>
           </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmationModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
          onClick={() => setConfirmationModal(null)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-full flex-shrink-0 ${
                  confirmationModal.type === 'delete' || confirmationModal.type === 'revoke' || confirmationModal.type === 'bulk_delete'
                  ? 'bg-rose-100 text-rose-600' 
                  : confirmationModal.type === 'deactivate'
                    ? 'bg-amber-100 text-amber-600'
                    : confirmationModal.type === 'change_role'
                      ? 'bg-indigo-100 text-indigo-600'
                      : 'bg-emerald-100 text-emerald-600'
              }`}>
                {confirmationModal.type === 'delete' || confirmationModal.type === 'revoke' || confirmationModal.type === 'bulk_delete'
                    ? <UserX className="w-6 h-6" /> 
                    : confirmationModal.type === 'deactivate'
                        ? <Ban className="w-6 h-6" />
                        : confirmationModal.type === 'change_role'
                          ? <ShieldAlert className="w-6 h-6" />
                          : <UserCheck className="w-6 h-6" />
                }
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900">
                  {confirmationModal.type === 'delete' || confirmationModal.type === 'bulk_delete' ? 'Remover Usuário(s)' 
                   : confirmationModal.type === 'revoke' ? 'Cancelar Convite'
                   : confirmationModal.type === 'change_role' ? 'Alterar Permissão'
                   : confirmationModal.type === 'deactivate' ? 'Desativar Conta'
                   : 'Ativar Conta'}
                </h3>
                <div className="text-slate-500 mt-2 text-sm leading-relaxed">
                  {confirmationModal.type === 'delete' && (
                    <p>Tem certeza que deseja <strong>remover permanentemente</strong> o usuário <strong>{confirmationModal.userName}</strong>? Ele perderá acesso imediato.</p>
                  )}
                  {confirmationModal.type === 'bulk_delete' && (
                    <p>Tem certeza que deseja <strong>remover permanentemente {confirmationModal.count} usuários</strong> selecionados?</p>
                  )}
                  {confirmationModal.type === 'revoke' && (
                    <p>Tem certeza que deseja cancelar o convite para <strong>{confirmationModal.userName}</strong>? O link enviado será invalidado.</p>
                  )}
                  {confirmationModal.type === 'deactivate' && (
                    <p>Deseja desativar o acesso de <strong>{confirmationModal.userName}</strong>? Ele não poderá mais fazer login.</p>
                  )}
                  {confirmationModal.type === 'activate' && (
                    <p>Deseja reativar o acesso de <strong>{confirmationModal.userName}</strong>?</p>
                  )}
                  {confirmationModal.type === 'change_role' && (
                     <p>Deseja alterar o nível de acesso de <strong>{confirmationModal.userName}</strong> para <strong>{confirmationModal.newRole === 'owner' ? 'Administrador' : 'Membro'}</strong>?</p>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button 
                onClick={() => setConfirmationModal(null)}
                className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg font-medium transition-colors text-sm"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmAction}
                className={`px-4 py-2 text-white rounded-lg font-medium shadow-sm transition-colors text-sm flex items-center gap-2 ${
                  confirmationModal.type === 'delete' || confirmationModal.type === 'revoke' || confirmationModal.type === 'bulk_delete'
                  ? 'bg-rose-600 hover:bg-rose-700' 
                  : confirmationModal.type === 'deactivate'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : confirmationModal.type === 'change_role'
                      ? 'bg-indigo-600 hover:bg-indigo-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {confirmationModal.type === 'delete' || confirmationModal.type === 'bulk_delete' ? 'Sim, remover' 
                 : confirmationModal.type === 'revoke' ? 'Sim, cancelar'
                 : confirmationModal.type === 'deactivate' ? 'Sim, desativar'
                 : confirmationModal.type === 'activate' ? 'Sim, ativar'
                 : confirmationModal.type === 'change_role' ? 'Confirmar alteração'
                 : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 px-5 py-3 rounded-lg shadow-xl text-white text-sm font-medium animate-in slide-in-from-bottom-5 fade-in duration-300 z-[60] flex items-center gap-3 ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <Ban className="w-5 h-5" />}
            {toast.message}
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Equipe</h2>
          <p className="text-slate-500">Gerencie quem tem acesso ao painel da sua empresa.</p>
        </div>
        <button 
          onClick={handleOpenInviteModal}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm transition-all hover:shadow-md"
        >
            <UserPlus className="w-4 h-4" />
            Convidar Membro
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-visible flex flex-col">
        {/* Bulk Actions Bar */}
        {selectedIds.length > 0 && (
            <div className="bg-slate-900 text-white px-6 py-2 flex items-center justify-between animate-in slide-in-from-top-2 duration-200">
                <span className="text-sm font-medium">{selectedIds.length} selecionados</span>
                <button 
                    onClick={handleBulkDelete} 
                    className="px-3 py-1.5 text-xs font-medium bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 rounded-lg flex items-center gap-2"
                >
                    <Trash2 className="w-3 h-3" /> Excluir Selecionados
                </button>
            </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
              <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-6 py-4 w-4">
                          <button onClick={toggleSelectAll} className="text-slate-400">
                              {selectedIds.length === users.length && users.length > 0 ? <CheckSquare className="w-5 h-5 text-brand-600" /> : <Square className="w-5 h-5" />}
                          </button>
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Usuário</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Função</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Último Acesso</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Ações</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <>
                      <UserSkeleton />
                      <UserSkeleton />
                      <UserSkeleton />
                      <UserSkeleton />
                      <UserSkeleton />
                    </>
                  ) : users.length === 0 ? (
                      <tr>
                          <td colSpan={6} className="px-6 py-10 text-center text-slate-500">Nenhum membro encontrado.</td>
                      </tr>
                  ) : (
                    currentUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-6 py-4">
                              <button onClick={() => toggleSelect(user.id)} className="text-slate-400 hover:text-brand-600">
                                  {selectedIds.includes(user.id) ? <CheckSquare className="w-5 h-5 text-brand-600" /> : <Square className="w-5 h-5 text-slate-300" />}
                              </button>
                          </td>
                          <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                  <div className="relative">
                                    <img src={user.avatarUrl} alt={user.name} className={`w-10 h-10 rounded-full bg-slate-100 ${user.status === 'inactive' ? 'grayscale opacity-50' : ''}`} />
                                    {/* Online Indicator */}
                                    {user.status === 'active' && (
                                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full ring-1 ring-emerald-50"></span>
                                    )}
                                  </div>
                                  <div>
                                      <p className={`font-medium ${user.status === 'inactive' ? 'text-slate-500' : 'text-slate-900'}`}>{user.name}</p>
                                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                          <Mail className="w-3 h-3" />
                                          {user.email}
                                      </div>
                                  </div>
                              </div>
                          </td>
                          <td className="px-6 py-4">
                              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                                  user.role === 'owner' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-600'
                              }`}>
                                  <Shield className="w-3 h-3" />
                                  {user.role === 'owner' ? 'Administrador' : 'Membro'}
                              </div>
                          </td>
                          <td className="px-6 py-4">
                              <div className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                                  user.status === 'active' ? 'text-emerald-600' 
                                  : user.status === 'invited' ? 'text-amber-600'
                                  : 'text-slate-400'
                              }`}>
                                  {user.status === 'active' ? <CheckCircle2 className="w-3.5 h-3.5" /> 
                                  : user.status === 'invited' ? <Clock className="w-3.5 h-3.5" />
                                  : <Ban className="w-3.5 h-3.5" />
                                  }
                                  {user.status === 'active' ? 'Ativo' 
                                  : user.status === 'invited' ? 'Pendente'
                                  : 'Inativo'
                                  }
                              </div>
                          </td>
                          <td className="px-6 py-4 text-sm">
                              <span className="text-slate-500">
                                {user.lastAccess}
                              </span>
                          </td>
                          <td className="px-6 py-4 text-right relative">
                              <button 
                                  onClick={() => toggleMenu(user.id)}
                                  className={`p-2 rounded-lg transition-colors ${openMenuId === user.id ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50 opacity-0 group-hover:opacity-100 focus:opacity-100'}`}
                              >
                                  <MoreVertical className="w-4 h-4" />
                              </button>

                              {openMenuId === user.id && (
                                  <div className="absolute right-8 top-8 w-56 bg-white rounded-lg shadow-xl border border-slate-100 z-20 py-1 text-left animate-in fade-in zoom-in-95 duration-100">
                                      <div className="px-3 py-2 border-b border-slate-50">
                                          <p className="text-xs font-semibold text-slate-500 uppercase">Gerenciar Acesso</p>
                                      </div>
                                      
                                      {/* Role Management */}
                                      {user.status !== 'invited' && (
                                          <>
                                              {user.role === 'member' ? (
                                                  <button 
                                                      onClick={() => requestChangeRole(user.id, user.name, 'owner')}
                                                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                                  >
                                                      <Shield className="w-4 h-4 text-indigo-600" />
                                                      Promover a Admin
                                                  </button>
                                              ) : (
                                                  <button 
                                                      onClick={() => requestChangeRole(user.id, user.name, 'member')}
                                                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                                  >
                                                      <UserCheck className="w-4 h-4 text-slate-500" />
                                                      Rebaixar a Membro
                                                  </button>
                                              )}
                                              
                                              {/* Status Management (Active/Inactive) */}
                                              <button 
                                                  onClick={() => requestToggleStatus(user)}
                                                  className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${user.status === 'active' ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                                              >
                                                  <Power className="w-4 h-4" />
                                                  {user.status === 'active' ? 'Desativar Conta' : 'Ativar Conta'}
                                              </button>
                                          </>
                                      )}

                                      <div className="border-t border-slate-50 my-1"></div>

                                      {/* Destructive Actions */}
                                      {user.status === 'invited' ? (
                                          <>
                                              <button 
                                                  onClick={() => handleResendInvite(user)}
                                                  className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 text-slate-600 hover:bg-slate-50"
                                              >
                                                  <Send className="w-4 h-4" />
                                                  Reenviar Convite
                                              </button>
                                              <button 
                                                  onClick={() => requestRevokeInvite(user)}
                                                  className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 text-rose-600 hover:bg-rose-50"
                                              >
                                                  <Trash2 className="w-4 h-4" />
                                                  Cancelar Convite
                                              </button>
                                          </>
                                      ) : (
                                          <button 
                                              onClick={() => requestDeleteUser(user)}
                                              className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 text-rose-600 hover:bg-rose-50"
                                          >
                                              <Trash2 className="w-4 h-4" />
                                              Remover da Equipe
                                          </button>
                                      )}
                                  </div>
                              )}
                          </td>
                      </tr>
                  )))}
              </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {!isLoading && users.length > 0 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-b-xl">
            <div className="text-sm text-slate-500">
              Mostrando <span className="font-medium text-slate-700">{startIndex + 1}</span> a <span className="font-medium text-slate-700">{Math.min(endIndex, users.length)}</span> de <span className="font-medium text-slate-700">{users.length}</span> usuários
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-600 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === page 
                        ? 'bg-brand-600 text-white shadow-sm' 
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button 
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-600 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersPage;
