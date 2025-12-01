
import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Building2, 
  LogOut, 
  ShieldCheck,
  Activity,
  FileText,
  Settings
} from 'lucide-react';
import { authService } from '../services/auth';

const AdminLayout = ({ children }: { children?: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    // Limpa flag local
    localStorage.removeItem('movicobranca_admin_auth');
    // Encerra sessão real do Supabase
    await authService.signOut();
    navigate('/login');
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Visão Geral', path: '/admin', exact: true },
    { icon: Building2, label: 'Empresas & Financeiro', path: '/admin/companies' },
    { icon: Activity, label: 'Atividade do Sistema', path: '/admin/activity' },
    { icon: FileText, label: 'Logs do Sistema', path: '/admin/logs' },
    { icon: Settings, label: 'Configurações', path: '/admin/settings' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Admin Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-900 text-slate-300 flex flex-col shadow-2xl z-50">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-900/50">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">Movicobrança</h1>
              <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded uppercase tracking-wider border border-indigo-500/20">Super Admin</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = item.exact 
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path);

            return (
              <NavLink 
                key={item.path} 
                to={item.path} 
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40 font-medium' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-900">
          <button 
            onClick={handleLogout} 
            className="flex items-center gap-3 px-3 py-2.5 w-full text-slate-400 hover:text-white hover:bg-rose-950/30 hover:text-rose-400 rounded-lg transition-colors text-sm font-medium"
          >
            <LogOut className="w-5 h-5" />
            <span>Sair do Admin</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto pb-10">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
