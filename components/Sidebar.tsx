import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  MessageSquareText, 
  CreditCard, 
  Settings2, 
  Bot, 
  Plug,
  LogOut, 
  Wallet, 
  Users, 
  Contact, 
  MessageSquareCode, 
  Workflow, 
  Sparkles, 
  Megaphone 
} from 'lucide-react';
import { authService } from '../services/auth';

const Sidebar = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authService.signOut();
      navigate('/login');
    } catch (error) {
      console.error("Erro ao sair:", error);
      navigate('/login');
    }
  };

  const menuGroups = [
    {
      title: null,
      items: [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
      ]
    },
    {
      title: 'INTEGRAÇÕES',
      items: [
        { icon: Plug, label: 'Canais (Asaas/WA)', path: '/integrations' },
      ]
    },
    {
      title: 'COBRANÇAS',
      items: [
        // Unified Link
        { icon: Settings2, label: 'Configurações', path: '/billing' },
        { icon: Contact, label: 'Contatos', path: '/contacts' },
      ]
    },
    {
      title: 'MARKETING',
      items: [
        { icon: Megaphone, label: 'Campanhas', path: '/campaigns' },
      ]
    },
    {
      title: 'ATENDIMENTO',
      items: [
        { icon: MessageSquareText, label: 'Conversas', path: '/conversations' },
        { icon: Bot, label: 'IA Financeira', path: '/ai-config' },
        { icon: Workflow, label: 'Automação', path: '/automation' },
      ]
    },
    {
      title: 'CONTA',
      items: [
        { icon: Users, label: 'Equipe', path: '/users' },
        { icon: Sparkles, label: 'Assinatura', path: '/subscription' },
      ]
    }
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-900 text-white flex flex-col shadow-xl z-50 overflow-hidden">
      <div className="p-6 border-b border-slate-700 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">MOVICOBRANÇA</h1>
        </div>
        <p className="text-xs text-slate-400 mt-1">SaaS Multiempresa v2.0</p>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-4 scrollbar-hide">
        {menuGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="mb-6 last:mb-0">
            {group.title && (
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 px-4">
                {group.title}
              </h3>
            )}
            <div className="space-y-1">
              {group.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm ${
                      isActive
                        ? 'bg-brand-600 text-white shadow-md'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4" />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-700 flex-shrink-0 bg-slate-900">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sair</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;