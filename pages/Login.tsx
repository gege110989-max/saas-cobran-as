
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wallet, ArrowRight, Lock, Mail, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import { authService } from '../services/auth';

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      if (isAdminMode) {
        // Mock Admin Login
        // Permissive check for demo purposes: Accept specific email or any email with 'admin'
        if (formData.email === 'admin@movicobranca.com' || formData.email.includes('admin')) {
             localStorage.setItem('movicobranca_admin_auth', 'true');
             navigate('/admin');
        } else {
            throw new Error("Acesso não autorizado. Para testar o admin, use: admin@movicobranca.com");
        }
      } else {
        // Real Supabase Login
        await authService.signIn(formData.email, formData.password);
        navigate('/');
      }
    } catch (err: any) {
        console.error("Login error:", err);
        let msg = "Erro ao realizar login.";
        
        // Map Supabase errors to Portuguese
        if (err.message === "Invalid login credentials") {
            msg = "E-mail ou senha incorretos.";
        } else if (err.message.includes("Email not confirmed")) {
            msg = "E-mail não confirmado. Verifique sua caixa de entrada.";
        } else if (isAdminMode) {
            msg = err.message;
        }
        
        setError(msg);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative">
      <div className={`max-w-md w-full bg-white rounded-2xl shadow-xl border overflow-hidden transition-colors duration-500 ${isAdminMode ? 'border-indigo-200' : 'border-slate-100'}`}>
        {isAdminMode && (
           <div className="bg-indigo-600 p-2 text-center text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2">
             <ShieldCheck className="w-4 h-4" />
             Área Administrativa
           </div>
        )}
        
        <div className="p-8">
          <div className="flex justify-center mb-8">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transform rotate-3 transition-colors duration-500 ${isAdminMode ? 'bg-indigo-600' : 'bg-brand-600'}`}>
              <Wallet className="w-7 h-7 text-white" />
            </div>
          </div>
          
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900">
              {isAdminMode ? 'Login Super Admin' : 'Bem-vindo de volta'}
            </h2>
            <p className="text-slate-500 mt-2">
              {isAdminMode ? 'Acesse o painel de controle mestre' : 'Acesse o painel da sua empresa'}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-100 rounded-lg flex items-center gap-2 text-sm text-rose-600">
                <AlertCircle className="w-4 h-4" />
                {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                <input 
                  type="email" 
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:bg-white transition-all ${isAdminMode ? 'focus:ring-indigo-500' : 'focus:ring-brand-500'}`}
                  placeholder={isAdminMode ? "admin@movicobranca.com" : "seu@email.com.br"}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-slate-700">Senha</label>
                {!isAdminMode && <a href="#" className="text-xs text-brand-600 hover:underline">Esqueceu a senha?</a>}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                <input 
                  type="password" 
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:bg-white transition-all ${isAdminMode ? 'focus:ring-indigo-500' : 'focus:ring-brand-500'}`}
                  placeholder="••••••••"
                />
              </div>
              {isAdminMode && (
                  <p className="text-[10px] text-slate-400 mt-1 text-right">Senha de teste: qualquer uma</p>
              )}
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className={`w-full text-white font-medium py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed ${isAdminMode ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-brand-600 hover:bg-brand-700'}`}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Acessar Painel'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {!isAdminMode && (
            <div className="mt-8 text-center">
              <p className="text-sm text-slate-500">
                Ainda não tem conta?{' '}
                <Link to="/signup" className="text-brand-600 font-semibold hover:underline">
                  Criar conta grátis
                </Link>
              </p>
            </div>
          )}

          {isAdminMode && (
            <div className="mt-8 text-center">
              <button onClick={() => setIsAdminMode(false)} className="text-sm text-indigo-600 font-semibold hover:underline">
                Voltar para Login de Empresa
              </button>
            </div>
          )}
        </div>
        
        <div className="bg-slate-50 p-4 border-t border-slate-100 text-center flex justify-between items-center px-8">
          <p className="text-xs text-slate-400">© 2024 Movicobrança.</p>
          {!isAdminMode && (
            <button 
                onClick={() => setIsAdminMode(true)}
                className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors"
            >
                <ShieldCheck className="w-3 h-3" />
                Acesso Administrativo
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
