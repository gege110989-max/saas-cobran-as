
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wallet, Building2, User, Mail, Lock, CheckCircle2, Loader2, AlertCircle, Info, Image as ImageIcon } from 'lucide-react';
import { authService } from '../services/auth';

const SignUp = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    userName: '',
    email: '',
    password: '',
    logoUrl: ''
  });

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
        const result = await authService.signUp(
            formData.userName,
            formData.companyName,
            formData.email,
            formData.password,
            formData.logoUrl
        );

        if (result.requiresConfirmation) {
            setConfirmationSent(true);
        } else {
            navigate('/');
        }
    } catch (err: any) {
        console.error(err);
        let msg = "Erro ao criar conta.";
        if (err.message?.includes("already registered")) {
            msg = "Este e-mail já está em uso.";
        } else if (err.message?.includes("Password")) {
            msg = "A senha deve ter no mínimo 6 caracteres.";
        }
        setError(msg);
    } finally {
        setLoading(false);
    }
  };

  if (confirmationSent) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Mail className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Verifique seu E-mail</h2>
                <p className="text-slate-500 mb-6">
                    Enviamos um link de confirmação para <strong>{formData.email}</strong>. 
                    Clique no link para ativar sua conta e acessar o painel.
                </p>
                <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-600 mb-6">
                    <p className="font-medium mb-1">Não recebeu?</p>
                    <p>Verifique sua pasta de Spam ou Lixo Eletrônico.</p>
                </div>
                <Link 
                    to="/login"
                    className="block w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 rounded-lg transition-colors"
                >
                    Voltar para Login
                </Link>
            </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden flex flex-col md:flex-row">
        
        {/* Left Side - Hero */}
        <div className="bg-slate-900 md:w-5/12 p-8 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-brand-600 to-slate-900 opacity-90 z-0"></div>
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-brand-500 rounded-full blur-3xl opacity-20"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
               <div className="w-10 h-10 bg-brand-500 rounded-lg flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-white" />
               </div>
               <span className="text-xl font-bold tracking-tight">MOVICOBRANÇA</span>
            </div>
            
            <h2 className="text-3xl font-bold mb-4 leading-tight">Automatize suas cobranças hoje mesmo.</h2>
            <p className="text-slate-300 text-sm leading-relaxed mb-6">
              Junte-se a mais de 1.000 empresas que reduziram a inadimplência usando nossa IA financeira integrada ao WhatsApp.
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-slate-200">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Cobrança automática no WhatsApp</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-200">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Integração nativa com Asaas</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-200">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>IA que negocia e tira dúvidas</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-8 md:mt-0">
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 backdrop-blur-sm">
               <p className="text-xs text-slate-400 italic">"O Movicobrança recuperou R$ 150 mil em faturas atrasadas na primeira semana de uso."</p>
               <div className="mt-3 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-bold">JS</div>
                  <span className="text-xs font-medium text-slate-300">João Silva, CEO da TechFin</span>
               </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="p-8 md:w-7/12">
          <div className="text-center md:text-left mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Crie sua conta grátis</h2>
            <p className="text-slate-500 mt-2 text-sm">Comece seu teste de 7 dias. Sem cartão de crédito.</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-100 rounded-lg flex items-center gap-2 text-sm text-rose-600">
                <AlertCircle className="w-4 h-4" />
                {error}
            </div>
          )}

          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Empresa</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  required
                  value={formData.companyName}
                  onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all text-sm"
                  placeholder="Ex: Minha Empresa Ltda"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">URL da Logomarca (Opcional)</label>
              <div className="relative">
                <ImageIcon className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                <input 
                  type="url" 
                  value={formData.logoUrl}
                  onChange={(e) => setFormData({...formData, logoUrl: e.target.value})}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all text-sm"
                  placeholder="https://exemplo.com/logo.png"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Seu Nome Completo</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  required
                  value={formData.userName}
                  onChange={(e) => setFormData({...formData, userName: e.target.value})}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all text-sm"
                  placeholder="Ex: Maria Silva"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">E-mail Corporativo</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                <input 
                  type="email" 
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all text-sm"
                  placeholder="nome@empresa.com.br"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                <input 
                  type="password" 
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all text-sm"
                  placeholder="Mínimo de 6 caracteres"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 mt-6 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Criar Conta e Acessar Painel'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              Já possui uma conta?{' '}
              <Link to="/login" className="text-brand-600 font-semibold hover:underline">
                Fazer Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
