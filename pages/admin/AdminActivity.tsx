
import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Clock, 
  MessageSquare, 
  Server, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Play,
  Loader2,
  Bot,
  Zap
} from 'lucide-react';
import { CronLog, AILog } from '../../types';
import { getCronLogs, triggerCronJob, getNextCronRun } from '../../services/cron';
import { getAILogs } from '../../services/aiActivity';

const WebhookItem = ({ type, time, status, payload }: any) => (
  <div className="flex items-start gap-4 p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors last:border-0">
    <div className={`mt-1 p-2 rounded-lg ${status === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
        {type === 'whatsapp' ? <MessageSquare className="w-4 h-4" /> : <Server className="w-4 h-4" />}
    </div>
    <div className="flex-1">
        <div className="flex justify-between items-start">
            <h4 className="font-bold text-slate-900 text-sm uppercase">{type} Webhook</h4>
            <span className="text-xs text-slate-400">{time}</span>
        </div>
        <p className="text-sm text-slate-600 mt-1">{payload}</p>
        <div className="flex items-center gap-2 mt-2">
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${status === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                {status}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">ID: req_1293812039</span>
        </div>
    </div>
  </div>
);

const CronItem: React.FC<{ log: CronLog }> = ({ log }) => (
   <div className="flex items-center justify-between p-4 border border-slate-100 rounded-lg bg-white mb-3 hover:shadow-sm transition-shadow">
       <div className="flex items-center gap-4">
           <div className={`p-2 rounded-full ${log.status === 'success' ? 'bg-emerald-100 text-emerald-600' : log.status === 'warning' ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'}`}>
               <Clock className="w-4 h-4" />
           </div>
           <div>
               <div className="flex items-center gap-2">
                   <p className="font-bold text-slate-900 text-sm">
                       {log.type === 'daily_billing' ? 'Rotina Diária de Cobrança' : 'Disparo Manual'}
                   </p>
                   {log.type === 'manual_trigger' && <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 rounded font-bold uppercase">Manual</span>}
               </div>
               <p className="text-xs text-slate-500">Executado em {log.executionTime}</p>
           </div>
       </div>
       <div className="text-right">
           <p className="text-sm font-medium text-slate-900">{log.processed} itens processados</p>
           <div className="flex items-center justify-end gap-2 text-xs">
                <span className="text-slate-400">{(log.durationMs / 1000).toFixed(1)}s</span>
                <span className={`flex items-center gap-1 ${log.status === 'success' ? 'text-emerald-600' : log.status === 'warning' ? 'text-amber-600' : 'text-rose-600'}`}>
                    {log.status === 'success' ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                    {log.status === 'success' ? 'Sucesso' : `${log.errors} Erros`}
                </span>
           </div>
       </div>
   </div>
);

const AdminActivity = () => {
  const [activeTab, setActiveTab] = useState<'webhooks' | 'cron' | 'ai'>('webhooks');
  
  // Cron States
  const [cronLogs, setCronLogs] = useState<CronLog[]>([]);
  const [isCronLoading, setIsCronLoading] = useState(false);
  const [isRunningJob, setIsRunningJob] = useState(false);

  // AI States
  const [aiLogs, setAiLogs] = useState<AILog[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
      if (activeTab === 'cron') {
          loadCronLogs();
      } else if (activeTab === 'ai') {
          loadAiLogs();
      }
  }, [activeTab]);

  const loadCronLogs = async () => {
      setIsCronLoading(true);
      try {
          const logs = await getCronLogs();
          setCronLogs(logs);
      } catch (error) {
          console.error("Failed to load cron logs");
      } finally {
          setIsCronLoading(false);
      }
  };

  const loadAiLogs = async () => {
      setIsAiLoading(true);
      try {
          const logs = await getAILogs();
          setAiLogs(logs);
      } catch (error) {
          console.error("Failed to load AI logs");
      } finally {
          setIsAiLoading(false);
      }
  };

  const handleRunManualJob = async () => {
      setIsRunningJob(true);
      try {
          const newLog = await triggerCronJob();
          setCronLogs(prev => [newLog, ...prev]);
      } catch (error) {
          alert("Erro ao executar job manual.");
      } finally {
          setIsRunningJob(false);
      }
  };

  const handleRefresh = () => {
      if (activeTab === 'cron') loadCronLogs();
      else if (activeTab === 'ai') loadAiLogs();
      // Webhooks are hardcoded for demo, no reload needed logic here
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
        case 'success':
            return <span className="text-emerald-600 text-[10px] font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 flex items-center w-fit gap-1"><CheckCircle2 className="w-3 h-3" /> Sucesso</span>;
        case 'failed':
            return <span className="text-rose-600 text-[10px] font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-100 flex items-center w-fit gap-1"><XCircle className="w-3 h-3" /> Falha</span>;
        case 'rate_limit':
            return <span className="text-amber-600 text-[10px] font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-100 flex items-center w-fit gap-1"><Zap className="w-3 h-3" /> Rate Limit</span>;
        default:
            return <span>{status}</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Atividade do Sistema</h2>
        <p className="text-slate-500">Monitore eventos em tempo real, webhooks e rotinas automáticas.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
          <button 
            onClick={() => setActiveTab('webhooks')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'webhooks' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
              Webhooks (API)
          </button>
          <button 
            onClick={() => setActiveTab('cron')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'cron' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
              CRON & Jobs
          </button>
           <button 
            onClick={() => setActiveTab('ai')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'ai' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
              Logs da IA
          </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 min-h-[400px] flex flex-col">
          {/* Toolbar */}
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <div className="flex gap-2 text-xs">
                  <span className="flex items-center gap-1 text-emerald-600 font-medium"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div> Sistema Operacional</span>
              </div>
              <button 
                onClick={handleRefresh}
                className="text-slate-500 hover:text-indigo-600 transition-colors"
                title="Atualizar lista"
              >
                  <RefreshCw className={`w-4 h-4 ${(isCronLoading || isAiLoading) ? 'animate-spin' : ''}`} />
              </button>
          </div>

          {/* Webhooks Tab */}
          {activeTab === 'webhooks' && (
              <div className="divide-y divide-slate-100">
                  <WebhookItem type="whatsapp" time="Agora" status="success" payload="Message status update: READ (551199999999)" />
                  <WebhookItem type="asaas" time="2 min atrás" status="success" payload="Event: PAYMENT_RECEIVED | Invoice: 0923912" />
                  <WebhookItem type="whatsapp" time="15 min atrás" status="failed" payload="Error: Invalid token signature for Company ID 4" />
                  <WebhookItem type="whatsapp" time="30 min atrás" status="success" payload="New message received from 551188888888" />
              </div>
          )}

          {/* CRON Tab */}
          {activeTab === 'cron' && (
              <div className="flex flex-col h-full">
                  <div className="p-6 bg-slate-50 flex-1">
                      <div className="flex justify-between items-center mb-4">
                          <h4 className="font-bold text-slate-900">Histórico de Execução</h4>
                          <button 
                            onClick={handleRunManualJob}
                            disabled={isRunningJob}
                            className="text-xs bg-indigo-600 text-white px-3 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-70"
                          >
                             {isRunningJob ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                             Executar Agora
                          </button>
                      </div>

                      {isCronLoading && cronLogs.length === 0 ? (
                          <div className="py-10 text-center text-slate-400 text-sm">Carregando logs...</div>
                      ) : (
                          cronLogs.map(log => <CronItem key={log.id} log={log} />)
                      )}
                      
                      <div className="mt-8 p-4 bg-white rounded-lg border border-slate-200">
                          <h4 className="font-bold text-slate-900 mb-2">Status do Agendador</h4>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                  <p className="text-slate-500">Próxima Execução</p>
                                  <p className="font-mono font-medium">{getNextCronRun()}</p>
                              </div>
                              <div>
                                  <p className="text-slate-500">Fila de Processamento</p>
                                  <p className="font-mono font-medium text-emerald-600">Vazia (0)</p>
                              </div>
                               <div>
                                  <p className="text-slate-500">Uptime do Worker</p>
                                  <p className="font-mono font-medium">99.98%</p>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          )}

          {/* AI Logs Tab */}
           {activeTab === 'ai' && (
               <div className="p-0">
                   {isAiLoading ? (
                       <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                           <Loader2 className="w-8 h-8 animate-spin mb-2" />
                           <p className="text-sm">Carregando histórico da IA...</p>
                       </div>
                   ) : (
                       <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100 text-xs uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Timestamp</th>
                                    <th className="px-6 py-4">Empresa</th>
                                    <th className="px-6 py-4">Ação / Modelo</th>
                                    <th className="px-6 py-4">Consumo</th>
                                    <th className="px-6 py-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {aiLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 text-slate-500 font-mono text-xs whitespace-nowrap">
                                            {log.timestamp}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-900">
                                            {log.companyName}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-slate-700">{log.action}</span>
                                                <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                                                    <Bot className="w-3 h-3" /> {log.model}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-slate-600">{log.tokensUsed} tokens</span>
                                                <span className="text-[10px] text-slate-400">{log.latencyMs}ms</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(log.status)}
                                        </td>
                                    </tr>
                                ))}
                                {aiLogs.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                            Nenhum log de IA encontrado.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                       </div>
                   )}
               </div>
           )}
      </div>
    </div>
  );
};

export default AdminActivity;
