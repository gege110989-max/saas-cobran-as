
import React, { useState, useEffect } from 'react';
import { 
  Search, 
  RefreshCcw, 
  Filter, 
  MoreHorizontal, 
  MessageCircle, 
  Download, 
  Plus, 
  User, 
  X, 
  Phone, 
  Mail, 
  FileText, 
  Trash2, 
  ExternalLink, 
  Wallet, 
  Building2, 
  History, 
  ArrowUpRight, 
  CheckSquare, 
  Square, 
  AlertCircle, 
  Tag, 
  Loader2 
} from 'lucide-react';
import { Contact } from '../types';
import { getContacts, createContact, deleteContactsBulk } from '../services/contacts';
import { asaasService } from '../services/asaas';

const Contacts = () => {
  // Data States
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  // UI States
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Confirmation Modal State
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    count: number;
    type: 'bulk' | 'single';
    id?: string;
  } | null>(null);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');

  // Metrics
  const totalContacts = contacts.length;
  const overdueContacts = contacts.filter(c => c.status === 'overdue').length;
  const newContacts = contacts.filter(c => c.source === 'whatsapp').length; 

  const fetchContacts = async () => {
      try {
          const data = await getContacts();
          setContacts(data);
      } catch (error) {
          console.error("Failed to load contacts", error);
      } finally {
          setIsLoadingData(false);
      }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  useEffect(() => {
    let result = contacts;

    if (searchTerm) {
        const lower = searchTerm.toLowerCase();
        result = result.filter(c => 
            c.name.toLowerCase().includes(lower) || 
            c.phone.includes(lower) ||
            c.cpfCnpj?.includes(lower) ||
            c.email?.toLowerCase().includes(lower)
        );
    }

    if (statusFilter !== 'all') {
        result = result.filter(c => c.status === statusFilter);
    }

    if (sourceFilter !== 'all') {
        result = result.filter(c => c.source === sourceFilter);
    }

    setFilteredContacts(result);
  }, [contacts, searchTerm, statusFilter, sourceFilter]);

  const handleSync = async () => {
      setIsSyncing(true);
      setSyncProgress(10);
      
      // Visual Progress Bar Simulation
      const progressInterval = setInterval(() => {
          setSyncProgress(prev => (prev < 90 ? prev + 5 : prev));
      }, 300);

      try {
          // Unified Logic: Will check if Sandbox or Production in Service
          await asaasService.syncCustomers();
          
          setSyncProgress(100);
          clearInterval(progressInterval);
          
          // Refresh Table
          await fetchContacts();
          
      } catch (error: any) {
          console.error("Sync failed", error);
          alert(`Erro na sincronização: ${error.message}`);
      } finally {
          setTimeout(() => {
              setIsSyncing(false);
              setSyncProgress(0);
          }, 500);
      }
  };

  const toggleSelectAll = () => {
      if (selectedIds.length === filteredContacts.length && filteredContacts.length > 0) {
          setSelectedIds([]);
      } else {
          setSelectedIds(filteredContacts.map(c => c.id));
      }
  };

  const toggleSelect = (id: string) => {
      if (selectedIds.includes(id)) {
          setSelectedIds(selectedIds.filter(sid => sid !== id));
      } else {
          setSelectedIds([...selectedIds, id]);
      }
  };

  // --- Funcionalidades de Ação em Massa e Unitária ---

  const handleBulkDelete = () => {
      if (selectedIds.length === 0) return;
      setConfirmationModal({
          isOpen: true,
          count: selectedIds.length,
          type: 'bulk'
      });
  };

  const handleDeleteContact = (id: string, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      setConfirmationModal({
          isOpen: true,
          count: 1,
          type: 'single',
          id
      });
  };

  const confirmDelete = async () => {
      if (!confirmationModal) return;
      
      setIsDeleting(true);
      try {
          if (confirmationModal.type === 'bulk') {
              await deleteContactsBulk(selectedIds);
              setContacts(prev => prev.filter(c => !selectedIds.includes(c.id)));
              setSelectedIds([]); 
          } else if (confirmationModal.type === 'single' && confirmationModal.id) {
              await deleteContactsBulk([confirmationModal.id]);
              setContacts(prev => prev.filter(c => c.id !== confirmationModal.id));
              setSelectedIds(prev => prev.filter(sid => sid !== confirmationModal.id));
              if (selectedContact?.id === confirmationModal.id) setSelectedContact(null);
          }
      } catch (error: any) {
          console.error(error);
          alert("Erro ao excluir contatos. Verifique se existem conversas vinculadas.");
      } finally {
          setIsDeleting(false);
          setConfirmationModal(null);
      }
  };

  const handleExport = () => {
      const contactsToExport = contacts.filter(c => selectedIds.includes(c.id));
      if (contactsToExport.length === 0) {
          alert("Selecione pelo menos um contato para exportar.");
          return;
      }

      const headers = ["Nome", "Telefone", "Email", "Documento", "Status", "Origem"];
      const csvContent = [
          headers.join(","),
          ...contactsToExport.map(c => [
              `"${c.name}"`, 
              c.phone, 
              c.email || "", 
              c.cpfCnpj || "", 
              c.status, 
              c.source
          ].join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      
      // Better cross-browser download handling
      const link = document.createElement("a");
      if (link.download !== undefined) {
          const url = URL.createObjectURL(blob);
          link.setAttribute("href", url);
          link.setAttribute("download", `contatos_export_${new Date().toISOString().slice(0,10)}.csv`);
          link.style.visibility = 'hidden';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
      }
  };

  // --- Funções de Filtro Rápido (Cards) ---

  const applyQuickFilter = (type: 'all' | 'overdue' | 'new') => {
      // Reset search to ensure filter works clearly
      setSearchTerm(''); 
      
      if (type === 'all') {
          setStatusFilter('all');
          setSourceFilter('all');
      } else if (type === 'overdue') {
          setStatusFilter('overdue');
          setSourceFilter('all');
      } else if (type === 'new') {
          setStatusFilter('all');
          setSourceFilter('whatsapp');
      }
  };

  const getStatusBadge = (status: string, size: 'sm' | 'md' = 'sm') => {
      const baseClass = "inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-wide";
      const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs';
      
      switch(status) {
          case 'paid': return <span className={`${baseClass} ${sizeClass} bg-emerald-100 text-emerald-700`}>Em dia</span>;
          case 'overdue': return <span className={`${baseClass} ${sizeClass} bg-rose-100 text-rose-700`}>Inadimplente</span>;
          case 'blocked': return <span className={`${baseClass} ${sizeClass} bg-slate-100 text-slate-600`}>Bloqueado</span>;
          default: return <span className={`${baseClass} ${sizeClass} bg-blue-100 text-blue-700`}>Ativo</span>;
      }
  };

  const getSourceIcon = (source: string) => {
      switch(source) {
          case 'asaas': return <span title="Asaas" className="flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-100">ASAAS</span>;
          case 'whatsapp': return <span title="WhatsApp" className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">WHATSAPP</span>;
          default: return <span title="Manual" className="flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-200">MANUAL</span>;
      }
  };

  return (
    <div className="space-y-6 relative h-full">
      {/* Confirmation Modal */}
      {confirmationModal && (
        <div 
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
          onClick={() => setConfirmationModal(null)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-rose-100 text-rose-600 flex-shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900">Confirmar Exclusão</h3>
                <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                  {confirmationModal.type === 'bulk' 
                    ? `Tem certeza que deseja excluir ${confirmationModal.count} contatos selecionados?`
                    : "Tem certeza que deseja excluir este contato permanentemente?"
                  }
                  <br/>
                  <span className="text-xs text-rose-600 font-medium mt-1 block">Esta ação não pode ser desfeita.</span>
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button 
                onClick={() => setConfirmationModal(null)}
                className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg font-medium transition-colors text-sm"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium shadow-sm transition-colors text-sm flex items-center gap-2"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {confirmationModal.type === 'bulk' ? 'Excluir Selecionados' : 'Excluir Contato'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drawer Overlay (Slide-over) */}
      {selectedContact && (
          <div className="fixed inset-0 z-[60] flex justify-end">
              <div 
                className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm transition-opacity" 
                onClick={() => setSelectedContact(null)}
              ></div>
              <div className="relative w-full max-w-md bg-white shadow-2xl h-full overflow-y-auto animate-in slide-in-from-right duration-300 border-l border-slate-200 flex flex-col">
                  {/* Drawer Header */}
                  <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                      <div className="flex justify-between items-start mb-4">
                          <button onClick={() => setSelectedContact(null)} className="p-2 -ml-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
                              <X className="w-5 h-5" />
                          </button>
                          <div className="flex gap-2">
                              <button 
                                onClick={(e) => handleDeleteContact(selectedContact.id, e)}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" 
                                title="Excluir"
                              >
                                  <Trash2 className="w-4 h-4" />
                              </button>
                              <button className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors" title="Editar">
                                  <FileText className="w-4 h-4" />
                              </button>
                          </div>
                      </div>

                      <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-xl font-bold text-brand-600 shadow-md border-2 border-slate-100">
                             {selectedContact.name?.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                             <h2 className="text-xl font-bold text-slate-900 leading-tight">{selectedContact.name}</h2>
                             <div className="flex items-center gap-2 mt-2">
                                 {getStatusBadge(selectedContact.status, 'sm')}
                                 <span className="text-xs text-slate-400 font-mono">{selectedContact.cpfCnpj || 'Sem Doc'}</span>
                             </div>
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-6">
                           <button className="flex items-center justify-center gap-2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
                               <MessageCircle className="w-4 h-4" />
                               WhatsApp
                           </button>
                           <button className="flex items-center justify-center gap-2 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium transition-colors shadow-sm">
                               <ExternalLink className="w-4 h-4" />
                               Abrir no Asaas
                           </button>
                      </div>
                  </div>

                  {/* Drawer Content */}
                  <div className="p-6 space-y-8 flex-1">
                      {/* Financial Stats */}
                      <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                              <p className="text-xs font-medium text-slate-500 uppercase mb-1">Total Pago (LTV)</p>
                              <p className="text-lg font-bold text-slate-900">R$ {selectedContact.totalPaid ? selectedContact.totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}</p>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                              <p className="text-xs font-medium text-slate-500 uppercase mb-1">Score de Crédito</p>
                              <div className="flex items-center gap-2">
                                  <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${selectedContact.score || 50}%` }}></div>
                                  </div>
                                  <span className="text-sm font-bold text-emerald-600">{selectedContact.score || 50}</span>
                              </div>
                          </div>
                      </div>

                      {/* Contact Info */}
                      <div>
                          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                              <User className="w-4 h-4 text-slate-400" /> Informações Pessoais
                          </h3>
                          <div className="space-y-3 pl-6 border-l-2 border-slate-100 ml-2">
                               <div className="flex items-center justify-between group">
                                   <span className="text-sm text-slate-500">Telefone</span>
                                   <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-slate-900">+55 {selectedContact.phone}</span>
                                        <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-100 rounded"><Phone className="w-3 h-3 text-slate-400" /></button>
                                   </div>
                               </div>
                               <div className="flex items-center justify-between group">
                                   <span className="text-sm text-slate-500">E-mail</span>
                                   <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-slate-900 truncate max-w-[180px]">{selectedContact.email || '-'}</span>
                                        <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-100 rounded"><Mail className="w-3 h-3 text-slate-400" /></button>
                                   </div>
                               </div>
                               <div className="flex items-center justify-between">
                                   <span className="text-sm text-slate-500">Origem</span>
                                   {getSourceIcon(selectedContact.source)}
                               </div>
                          </div>
                      </div>

                      {/* Open Invoices */}
                      <div>
                          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                              <Wallet className="w-4 h-4 text-slate-400" /> Faturas em Aberto
                              {selectedContact.openInvoices > 0 && <span className="bg-rose-100 text-rose-700 text-[10px] px-1.5 py-0.5 rounded-full">{selectedContact.openInvoices}</span>}
                          </h3>
                          {selectedContact.openInvoices > 0 ? (
                              <div className="bg-white border border-rose-100 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                                  <div className="flex justify-between items-start mb-2">
                                      <div className="flex items-center gap-2">
                                          <div className="p-1.5 bg-rose-50 text-rose-600 rounded">
                                              <FileText className="w-4 h-4" />
                                          </div>
                                          <span className="text-sm font-bold text-slate-900">Fatura Pendente</span>
                                      </div>
                                      <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded">Vencida</span>
                                  </div>
                                  <div className="flex justify-between items-end">
                                      <span className="text-xs text-slate-500">Verifique no Asaas</span>
                                      <span className="text-sm font-bold text-slate-900">R$ --,--</span>
                                  </div>
                              </div>
                          ) : (
                              <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-lg text-center">
                                  <p className="text-sm text-emerald-800 font-medium">Tudo certo! Nenhuma pendência.</p>
                              </div>
                          )}
                      </div>

                      {/* Timeline */}
                      <div>
                          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                              <History className="w-4 h-4 text-slate-400" /> Linha do Tempo
                          </h3>
                          <div className="space-y-4 pl-2">
                              <div className="flex gap-3 relative pb-4">
                                  <div className="absolute left-[5px] top-6 bottom-0 w-0.5 bg-slate-200"></div>
                                  <div className="w-3 h-3 bg-brand-500 rounded-full mt-1.5 ring-4 ring-white relative z-10 shrink-0"></div>
                                  <div>
                                      <p className="text-sm font-medium text-slate-900">Atividade Recente</p>
                                      <p className="text-[10px] text-slate-400 mt-1">{selectedContact.lastMessageAt || 'N/A'}</p>
                                  </div>
                              </div>
                              <div className="flex gap-3 relative">
                                  <div className="w-3 h-3 bg-slate-300 rounded-full mt-1.5 ring-4 ring-white relative z-10 shrink-0"></div>
                                  <div>
                                      <p className="text-sm font-medium text-slate-900">Contato Criado</p>
                                      <p className="text-xs text-slate-500 mt-0.5">Sincronizado.</p>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Metrics Header - Clickable for Filtering */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div 
            onClick={() => applyQuickFilter('all')}
            className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden group cursor-pointer hover:border-brand-300 hover:shadow-md transition-all"
          >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <User className="w-16 h-16 text-brand-600" />
              </div>
              <p className="text-sm font-medium text-slate-500">Base Total</p>
              <div className="flex items-end gap-2 mt-1">
                  <h3 className="text-3xl font-bold text-slate-900">{totalContacts}</h3>
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded mb-1 flex items-center">
                      <ArrowUpRight className="w-3 h-3 mr-0.5" /> 12%
                  </span>
              </div>
          </div>
          <div 
            onClick={() => applyQuickFilter('overdue')}
            className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden group cursor-pointer hover:border-rose-300 hover:shadow-md transition-all"
          >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <AlertCircle className="w-16 h-16 text-rose-600" />
              </div>
              <p className="text-sm font-medium text-slate-500">Inadimplentes</p>
              <div className="flex items-end gap-2 mt-1">
                  <h3 className="text-3xl font-bold text-slate-900">{overdueContacts}</h3>
                  <span className="text-xs font-medium text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded mb-1">
                      Ação Necessária
                  </span>
              </div>
          </div>
           <div 
            onClick={() => applyQuickFilter('new')}
            className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden group cursor-pointer hover:border-emerald-300 hover:shadow-md transition-all"
          >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <MessageCircle className="w-16 h-16 text-emerald-600" />
              </div>
              <p className="text-sm font-medium text-slate-500">Novos (WhatsApp)</p>
              <div className="flex items-end gap-2 mt-1">
                  <h3 className="text-3xl font-bold text-slate-900">{newContacts}</h3>
                  <span className="text-xs font-medium text-slate-500 mb-1">
                      Esta semana
                  </span>
              </div>
          </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 pt-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Contatos</h2>
          <p className="text-slate-500">Gerencie sua base de clientes sincronizada.</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg font-medium shadow-sm transition-colors"
            >
                <Plus className="w-4 h-4" />
                Manual
            </button>
            <button 
                onClick={handleSync}
                disabled={isSyncing}
                className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-all disabled:opacity-70 relative overflow-hidden group"
            >
                {isSyncing && (
                    <div 
                        className="absolute left-0 top-0 bottom-0 bg-white/20 transition-all duration-300 ease-out" 
                        style={{ width: `${syncProgress}%` }}
                    />
                )}
                <RefreshCcw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} relative z-10`} />
                <span className="relative z-10">{isSyncing ? 'Sincronizando...' : 'Sincronizar Asaas'}</span>
            </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Toolbar */}
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col xl:flex-row gap-4 justify-between items-center">
              <div className="relative w-full xl:max-w-md group">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
                  <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por nome, telefone, documento..." 
                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 transition-all"
                  />
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto justify-end">
                   <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1">
                      <Filter className="w-4 h-4 text-slate-400 ml-2" />
                      <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-transparent border-none text-slate-700 text-sm focus:ring-0 cursor-pointer py-1 pr-8"
                      >
                          <option value="all">Status: Todos</option>
                          <option value="active">Ativos</option>
                          <option value="paid">Em Dia</option>
                          <option value="overdue">Inadimplentes</option>
                          <option value="blocked">Bloqueados</option>
                      </select>
                   </div>

                   <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>

                   <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1">
                      <Tag className="w-4 h-4 text-slate-400 ml-2" />
                      <select 
                        value={sourceFilter}
                        onChange={(e) => setSourceFilter(e.target.value)}
                        className="bg-transparent border-none text-slate-700 text-sm focus:ring-0 cursor-pointer py-1 pr-8"
                      >
                          <option value="all">Origem: Todas</option>
                          <option value="asaas">Asaas</option>
                          <option value="whatsapp">WhatsApp</option>
                          <option value="manual">Manual</option>
                      </select>
                   </div>
              </div>
          </div>

          {/* Bulk Actions Bar */}
          {selectedIds.length > 0 && (
              <div className="bg-slate-900 text-white px-6 py-2 flex items-center justify-between animate-in slide-in-from-top-2">
                  <span className="text-sm font-medium">{selectedIds.length} contatos selecionados</span>
                  <div className="flex gap-2">
                      <button 
                        onClick={handleExport}
                        className="px-3 py-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center gap-2"
                      >
                          <Download className="w-3 h-3" /> Exportar
                      </button>
                      <button 
                        onClick={handleBulkDelete}
                        disabled={isDeleting}
                        className="px-3 py-1.5 text-xs font-medium bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 hover:text-rose-100 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                          {isDeleting ? <Loader2 className="w-3 h-3 animate-spin"/> : <Trash2 className="w-3 h-3" />}
                          Excluir
                      </button>
                  </div>
              </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <th className="px-6 py-4 w-4">
                            <button onClick={toggleSelectAll} className="text-slate-400 hover:text-brand-600 transition-colors">
                                {selectedIds.length === filteredContacts.length && filteredContacts.length > 0 ? (
                                    <CheckSquare className="w-5 h-5 text-brand-600" />
                                ) : (
                                    <Square className="w-5 h-5" />
                                )}
                            </button>
                        </th>
                        <th className="px-6 py-4">Cliente</th>
                        <th className="px-6 py-4">Contato</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Origem</th>
                        <th className="px-6 py-4">Última Atividade</th>
                        <th className="px-6 py-4 text-right">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {filteredContacts.length === 0 ? (
                        <tr>
                            <td colSpan={7} className="px-6 py-16 text-center text-slate-500">
                                <div className="flex flex-col items-center justify-center">
                                    <div className="bg-slate-50 p-4 rounded-full mb-3">
                                        <Search className="w-8 h-8 text-slate-300" />
                                    </div>
                                    <p className="font-medium">Nenhum contato encontrado.</p>
                                    <p className="text-xs mt-1">
                                        {isLoadingData ? 'Carregando...' : 'Tente sincronizar com o Asaas ou adicionar manualmente.'}
                                    </p>
                                </div>
                            </td>
                        </tr>
                    ) : (
                        filteredContacts.map((contact) => (
                        <tr 
                            key={contact.id} 
                            onClick={() => setSelectedContact(contact)}
                            className={`transition-all hover:bg-slate-50 cursor-pointer group ${selectedIds.includes(contact.id) ? 'bg-slate-50' : ''}`}
                        >
                            <td className="px-6 py-4" onClick={(e) => { e.stopPropagation(); toggleSelect(contact.id); }}>
                                {selectedIds.includes(contact.id) ? (
                                    <CheckSquare className="w-5 h-5 text-brand-600" />
                                ) : (
                                    <Square className="w-5 h-5 text-slate-300 group-hover:text-slate-400 transition-colors" />
                                )}
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 border border-slate-100 shadow-sm group-hover:scale-105 transition-transform">
                                        {contact.name?.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-900 text-sm group-hover:text-brand-600 transition-colors">{contact.name}</div>
                                        <div className="text-xs text-slate-400 font-mono mt-0.5">{contact.cpfCnpj || '---'}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-1.5 text-sm text-slate-600">
                                        <Phone className="w-3.5 h-3.5 text-slate-400"/> +55 {contact.phone}
                                    </div>
                                    {contact.email && (
                                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                            <Mail className="w-3 h-3"/> {contact.email}
                                        </div>
                                    )}
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                {getStatusBadge(contact.status)}
                            </td>
                            <td className="px-6 py-4">
                                {getSourceIcon(contact.source)}
                            </td>
                            <td className="px-6 py-4">
                                <span className="text-sm text-slate-600">{contact.lastMessageAt || '-'}</span>
                            </td>
                            <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        className="p-1.5 text-brand-600 hover:bg-brand-50 rounded-lg transition-colors border border-transparent hover:border-brand-100" 
                                        title="Iniciar Conversa"
                                    >
                                        <MessageCircle className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={(e) => handleDeleteContact(contact.id, e)}
                                        className="p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors"
                                        title="Excluir Contato"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    )))}
                </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
              <span className="text-xs text-slate-500 font-medium">
                  Mostrando {filteredContacts.length} resultados
              </span>
              <div className="flex gap-2">
                  <button className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 text-xs font-medium text-slate-600 shadow-sm transition-colors">Anterior</button>
                  <button className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-xs font-medium text-slate-600 shadow-sm transition-colors">Próximo</button>
              </div>
          </div>
      </div>

      {/* Manual Add Modal */}
      {isAddModalOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in duration-200">
                  <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm">
                            <Plus className="w-4 h-4 text-brand-600" />
                        </div>
                        <h3 className="font-bold text-slate-900">Novo Cliente Manual</h3>
                      </div>
                      <button onClick={() => setIsAddModalOpen(false)} className="p-1 hover:bg-slate-200 rounded-full transition-colors">
                          <X className="w-5 h-5 text-slate-400" />
                      </button>
                  </div>
                  <div className="p-6 space-y-5">
                      <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg flex gap-3 text-amber-800 text-sm">
                          <Building2 className="w-5 h-5 shrink-0 mt-0.5" />
                          <p>Clientes manuais <strong>não sincronizam</strong> automaticamente com o Asaas a menos que você gere uma cobrança depois.</p>
                      </div>
                      
                      <div className="space-y-4">
                          <div>
                              <label className="block text-sm font-bold text-slate-700 mb-1">Nome Completo</label>
                              <input type="text" className="w-full border-slate-200 rounded-lg focus:ring-brand-500 focus:border-brand-500 text-sm" placeholder="Ex: João Silva" />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">CPF/CNPJ</label>
                                <input type="text" className="w-full border-slate-200 rounded-lg focus:ring-brand-500 focus:border-brand-500 text-sm" placeholder="000.000.000-00" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Telefone (WhatsApp)</label>
                                <input type="text" className="w-full border-slate-200 rounded-lg focus:ring-brand-500 focus:border-brand-500 text-sm" placeholder="(11) 99999-9999" />
                            </div>
                          </div>
                          <div>
                              <label className="block text-sm font-bold text-slate-700 mb-1">E-mail</label>
                              <input type="email" className="w-full border-slate-200 rounded-lg focus:ring-brand-500 focus:border-brand-500 text-sm" placeholder="joao@email.com" />
                          </div>
                      </div>

                      <div className="pt-2 flex gap-3">
                          <button onClick={() => setIsAddModalOpen(false)} className="flex-1 py-2.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium transition-colors">Cancelar</button>
                          <button onClick={() => { setIsAddModalOpen(false); }} className="flex-1 py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-medium shadow-sm transition-colors">Salvar Cliente</button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Contacts;
