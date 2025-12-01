import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import { supabase } from './services/supabase';
import { asaasService } from './services/asaas'; // Import asaas service
import { Loader2 } from 'lucide-react';

// Tenant Pages
import Dashboard from './pages/Dashboard';
import Conversations from './pages/Conversations';
import Integrations from './pages/Integrations';
import Billing from './pages/Billing'; // Unified Page
import AISettings from './pages/AISettings';
import UsersPage from './pages/Users';
import Contacts from './pages/Contacts';
import Automation from './pages/Automation';
import Subscription from './pages/Subscription';
import Campaigns from './pages/Campaigns';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import AcceptInvite from './pages/AcceptInvite';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCompanies from './pages/admin/AdminCompanies';
import AdminCompanyDetails from './pages/admin/AdminCompanyDetails';
import AdminActivity from './pages/admin/AdminActivity';
import AdminSettings from './pages/admin/AdminSettings';

// Auth Guard for Regular Users
const PrivateRoute = () => {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
        </div>
    );
  }

  return session ? (
    <Layout>
      <Outlet />
    </Layout>
  ) : (
    <Navigate to="/login" replace />
  );
};

// Auth Guard for Super Admin
const AdminRoute = () => {
  // Check for specific admin auth token (kept as local storage for simplicity in this hybrid migration)
  const isAdminAuthenticated = localStorage.getItem('movicobranca_admin_auth') === 'true';
  
  return isAdminAuthenticated ? (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  ) : (
    <Navigate to="/login" replace />
  );
};

const PublicRoute = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
  }, []);

  if (loading) return null;

  const isAdminAuthenticated = localStorage.getItem('movicobranca_admin_auth') === 'true';

  if (isAdminAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  if (session) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

const App = () => {
  // --- Background Scheduler Worker ---
  useEffect(() => {
    const checkSchedule = async () => {
        try {
            const config = await asaasService.getConfig();
            
            // Se autoSync não estiver habilitado, sai
            if (!config || !config.autoSync || !config.syncTime) return;

            const now = new Date();
            const currentHour = String(now.getHours()).padStart(2, '0');
            const currentMinute = String(now.getMinutes()).padStart(2, '0');
            const currentTimeStr = `${currentHour}:${currentMinute}`;

            // Verifica se é a hora de executar
            if (currentTimeStr === config.syncTime) {
                // Prevenção de execução múltipla no mesmo minuto
                const lastRun = localStorage.getItem('movicobranca_last_sync_run');
                const todayStr = now.toDateString() + currentTimeStr; // "Mon Jan 01 2024 08:00"

                if (lastRun !== todayStr) {
                    console.log(`[Scheduler] Horário agendado (${currentTimeStr}). Iniciando sincronização...`);
                    
                    // Executa a rotina
                    await asaasService.executeDailyRoutine();
                    
                    // Marca como executado hoje neste horário
                    localStorage.setItem('movicobranca_last_sync_run', todayStr);
                }
            }
        } catch (error) {
            console.error("[Scheduler] Erro ao verificar agendamento:", error);
        }
    };

    // Verificar a cada 60 segundos
    const intervalId = setInterval(checkSchedule, 60000);
    
    // Executa uma vez no mount para debug (opcional, pode remover em prod)
    // checkSchedule();

    return () => clearInterval(intervalId);
  }, []);

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/accept-invite" element={<AcceptInvite />} />
        </Route>

        {/* Tenant (Company) Routes */}
        <Route element={<PrivateRoute />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/conversations" element={<Conversations />} />
          <Route path="/integrations" element={<Integrations />} />
          {/* Unified Billing Route */}
          <Route path="/billing" element={<Billing />} />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="/ai-config" element={<AISettings />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/automation" element={<Automation />} />
          <Route path="/subscription" element={<Subscription />} />
        </Route>

        {/* Super Admin Routes */}
        <Route path="/admin" element={<AdminRoute />}>
           <Route index element={<AdminDashboard />} />
           <Route path="companies" element={<AdminCompanies />} />
           <Route path="companies/:id" element={<AdminCompanyDetails />} />
           <Route path="activity" element={<AdminActivity />} />
           <Route path="settings" element={<AdminSettings />} />
           <Route path="logs" element={<div className="p-8 font-bold text-slate-500">Logs do Sistema em Desenvolvimento</div>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;