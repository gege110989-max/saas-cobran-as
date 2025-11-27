import React, { useState } from 'react';
import { 
  UserPlus, 
  MoreVertical, 
  Mail, 
  Shield,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { CompanyUser } from '../types';

const MOCK_USERS: CompanyUser[] = [
  { id: '1', name: 'Ricardo Silva', email: 'ricardo@empresa.com.br', role: 'owner', status: 'active', lastAccess: 'Agora', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ricardo' },
  { id: '2', name: 'Amanda Oliveira', email: 'amanda@empresa.com.br', role: 'member', status: 'active', lastAccess: '2 horas atrás', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amanda' },
  { id: '3', name: 'João Pedro', email: 'joao@empresa.com.br', role: 'member', status: 'invited', lastAccess: '-', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Joao' },
];

const UsersPage = () => {
  const [users, setUsers] = useState<CompanyUser[]>(MOCK_USERS);

  const handleInvite = () => {
    // Mock invite logic
    alert("Funcionalidade de convite: Envia email para o novo usuário.");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Equipe</h2>
          <p className="text-slate-500">Gerencie quem tem acesso ao painel da sua empresa.</p>
        </div>
        <button 
          onClick={handleInvite}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm transition-all hover:shadow-md"
        >
            <UserPlus className="w-4 h-4" />
            Convidar Membro
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
            <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Usuário</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Função</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Último Acesso</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Ações</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                                <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full bg-slate-100" />
                                <div>
                                    <p className="font-medium text-slate-900">{user.name}</p>
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
                                user.status === 'active' ? 'text-emerald-600' : 'text-amber-600'
                            }`}>
                                {user.status === 'active' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                                {user.status === 'active' ? 'Ativo' : 'Pendente'}
                            </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                            {user.lastAccess}
                        </td>
                        <td className="px-6 py-4 text-right">
                             <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                                <MoreVertical className="w-4 h-4" />
                             </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
        {users.length === 0 && (
             <div className="p-12 text-center">
                <p className="text-slate-500">Nenhum usuário encontrado.</p>
             </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
                <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <div>
                <h4 className="font-medium text-blue-900 text-sm">Controle de Acesso</h4>
                <p className="text-sm text-blue-700 mt-1">Todos os usuários cadastrados possuem acesso ao painel da empresa.</p>
            </div>
      </div>
    </div>
  );
};

export default UsersPage;