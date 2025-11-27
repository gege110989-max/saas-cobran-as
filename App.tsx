import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Conversations from './pages/Conversations';
import Integrations from './pages/Integrations';
import BillingSettings from './pages/BillingSettings';
import AISettings from './pages/AISettings';
import UsersPage from './pages/Users';

const App = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/conversations" element={<Conversations />} />
          <Route path="/integrations" element={<Integrations />} />
          <Route path="/billing" element={<BillingSettings />} />
          <Route path="/ai-config" element={<AISettings />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;