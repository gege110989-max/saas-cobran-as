import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  MessageSquareText, 
  CreditCard, 
  Settings2, 
  Bot, 
  Plug,
  LogOut,
  Wallet,
  Users
} from 'lucide-react';

const Sidebar = () => {
  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: MessageSquareText, label: 'Atendimento', path: '/conversations' },
    { icon: CreditCard, label: 'Cobranças', path: '/billing' },
    { icon: Bot, label: 'IA Financeira', path: '/ai-config' },
    { icon: Plug, label: 'Integrações', path: '/integrations' },
    { icon: Users, label: 'Equipe', path: '/users' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-900 text-white flex flex-col shadow-xl z-50">
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">MOVICOBRANÇA</h1>
        </div>
        <p className="text-xs text-slate-400 mt-1">SaaS Multiempresa v2.0</p>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <button className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sair</span>
        </button>
        <div className="mt-4 px-4 text-xs text-slate-500 text-center">
          &copy; 2024 Movicobrança
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;