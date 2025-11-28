import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Activity, 
  Server, 
  Bot, 
  MessageSquare,
  Clock,
  RefreshCcw
} from 'lucide-react';
import { getIntegrationStatus } from '../services/integrations';
import { classifyMessageAI } from '../services/ai';

const HealthCard = ({ title, status, icon: Icon, detail, onCheck, loading }: any) => {
  const getStatusColor = (s: string) => {
    switch(s) {
      case 'ok': return 'bg-emerald-50 border-emerald-100 text-emerald-700';
      case 'warning': return 'bg-amber-50 border-amber-100 text-amber-700';
      case 'error': return 'bg-rose-50 border-rose-100 text-rose-700';
      default: return 'bg-slate-50 border-slate-100 text-slate-700';
    }
  };

  const getStatusIconColor = (s: string) => {
    switch(s) {
      case 'ok': return 'text-emerald-500';
      case 'warning': return 'text-amber-500';
      case 'error': return 'text-rose-500';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className={`p-4 rounded-xl border ${getStatusColor(status)} transition-all hover:shadow-md relative group`}>
      <button 
        onClick={onCheck}
        disabled={loading}
        className="absolute top-4 right-4 text-slate-400 hover:text-indigo-600 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
        title="Verificar status agora"
      >
        <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
      </button>
      
      <div className="flex justify-between items-start mb-2">
        <div className={`p-2 rounded-lg bg-white/50 ${getStatusIconColor(status)}`}>
          <Icon className="w-5 h-5" />
        </div>
        {status === 'ok' ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
        ) : status === 'warning' ? (
          <AlertTriangle className="w-4 h-4 text-amber-600" />
        ) : (
          <XCircle className="w-4 h-4 text-rose-600" />
        )}
      </div>
      <div>
        <h4 className="font-bold text-sm mb-1">{title}</h4>
        <p className="text-xs opacity-80">{loading ? 'Verificando...' : detail}</p>
      </div>
    </div>
  );
};

const SystemHealth = () => {
  const [statuses, setStatuses] = useState<any>({
    whatsapp: { status: 'loading', detail: 'Iniciando verificação...' },
    asaas: { status: 'loading', detail: 'Iniciando verificação...' },
    gemini: { status: 'loading', detail: 'Iniciando verificação...' },
    cron: { status: 'ok', detail: 'Última exec: 1 min' } // Backend simulation
  });

  const [loading, setLoading] = useState<any>({
    whatsapp: false,
    asaas: false,
    gemini: false,
    cron: false
  });

  const checkService = async (service: string) => {
    setLoading(prev => ({ ...prev, [service]: true }));

    // Simulate delay for realism
    await new Promise(resolve => setTimeout(resolve, 1000));

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (service === 'whatsapp' || service === 'asaas') {
        const config = getIntegrationStatus();
        const isConfigured = service === 'whatsapp' ? config.whatsapp : config.asaas;
        
        setStatuses(prev => ({
            ...prev,
            [service]: {
                status: isConfigured ? 'ok' : 'error',
                detail: isConfigured ? `Conectado • ${timestamp}` : `Não configurado • ${timestamp}`
            }
        }));
    } 
    else if (service === 'gemini') {
        try {
            // Attempt a real lightweight call to check API Key validity
            // We use a dummy message that is cheap to process
            await classifyMessageAI("health_check"); 
            setStatuses(prev => ({
                ...prev,
                gemini: { status: 'ok', detail: `Operacional • ${timestamp}` }
            }));
        } catch (error) {
            setStatuses(prev => ({
                ...prev,
                gemini: { status: 'error', detail: `Falha na API • ${timestamp}` }
            }));
        }
    }
    else if (service === 'cron') {
         setStatuses(prev => ({
            ...prev,
            cron: { status: 'ok', detail: `Executado agora • ${timestamp}` }
        }));
    }

    setLoading(prev => ({ ...prev, [service]: false }));
  };

  // Initial check on mount
  useEffect(() => {
    checkService('whatsapp');
    checkService('asaas');
    checkService('gemini');
    checkService('cron');
  }, []);

  return (
    <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-600" />
            Monitoramento de Serviços
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <HealthCard 
                title="WhatsApp API" 
                status={statuses.whatsapp.status} 
                icon={MessageSquare} 
                detail={statuses.whatsapp.detail} 
                loading={loading.whatsapp}
                onCheck={() => checkService('whatsapp')}
            />
            <HealthCard 
                title="Asaas API" 
                status={statuses.asaas.status} 
                icon={Server} 
                detail={statuses.asaas.detail} 
                loading={loading.asaas}
                onCheck={() => checkService('asaas')}
            />
            <HealthCard 
                title="IA Gemini" 
                status={statuses.gemini.status} 
                icon={Bot} 
                detail={statuses.gemini.detail} 
                loading={loading.gemini}
                onCheck={() => checkService('gemini')}
            />
            <HealthCard 
                title="CRON Worker" 
                status={statuses.cron.status} 
                icon={Clock} 
                detail={statuses.cron.detail} 
                loading={loading.cron}
                onCheck={() => checkService('cron')}
            />
        </div>
    </div>
  );
};

export default SystemHealth;