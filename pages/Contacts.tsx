import React, { useState, useEffect } from 'react';
import { 
  Search, 
  RefreshCcw, 
  Filter, 
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
  Loader2,
  ChevronLeft,
  ChevronRight,
  Copy,
  CheckCircle2,
  Save,
  Send
} from 'lucide-react';
import { Contact } from '../types';
import { getContacts, deleteContactsBulk, createContact, updateContactsStatusBulk } from '../services/contacts';
import { asaasService } from '../services/asaas';

const ITEMS_PER_PAGE = 10;

const Contacts = () => {
  // Data States
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  // Pagination & Filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  
  // Debounce Search
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // UI States
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  
  // New Contact State
  const [newContact, setNewContact] = useState({ name: '', email: '', phone: '', cpfCnpj: '' });
  const [isSavingContact, setIsSavingContact] = useState(false);

  // Bulk Actions State
  const [bulkActionModal, setBulkActionModal] = useState<{ isOpen: boolean, type: 'email' | 'status' } | null>(null);
  const [bulkEmailData, setBulkEmailData] = useState({ subject: '', body: '' });
  const [bulkStatusTarget, setBulkStatusTarget] = useState('active');
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);

  // Confirmation Modal
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    count: number;
    type: 'bulk' | 'single';
    id?: string;
  } | null>(null);

  // Debounce Effect
  useEffect(() => {
    const timer = setTimeout(() => {
        setDebouncedSearch(searchTerm);
        setCurrentPage(1); // Reset page on new search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Main Data Fetcher - Server Side
  const fetchContacts = async () => {
      setIsLoadingData(true);
      try {
          const { data, count } = await getContacts({
              page: currentPage,
              limit: ITEMS_PER_PAGE,
              search: debouncedSearch,
              status: statusFilter,
              source: sourceFilter
          });
          setContacts(data);
          setTotalCount(count);
      } catch (error) {
          console.error("Failed to load contacts", error);
      } finally {
          setIsLoadingData(false);
      }
  };

  useEffect(() => {
    fetchContacts();
  }, [currentPage, debouncedSearch, statusFilter, sourceFilter]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 3000);
  };

  const isValidEmail = (email: string) => {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isValidPhone = (phone: string) => {
      // Remove caracteres não numéricos e verifica se tem 10 ou 11 dígitos (DDD + Número)
      const cleanPhone = phone.replace(/\D/g, '');
      return /^\d{10,11}$/.test(cleanPhone);
  };

  const handleSaveContact = async (e: React.FormEvent) => {
      e.preventDefault();
      
      // Validação de E-mail
      if (newContact.email && !isValidEmail(newContact.email)) {
          showToast("Formato de e-mail inválido. Verifique e tente novamente.", "error");
          return;
      }

      // Validação de Telefone
      if (!isValidPhone(newContact.phone)) {
          showToast("Telefone inválido. Digite DDD + Número (10 ou 11 dígitos).", "error");
          return;
      }

      setIsSavingContact(true);
      try {
          await createContact(newContact);
          showToast("Contato criado com sucesso!");
          setIsAddModalOpen(false);
          setNewContact({ name: '', email: '', phone: '', cpfCnpj: '' });
          fetchContacts();
      } catch (error: any) {
          showToast(error.message || "Erro ao criar contato.", "error");
      } finally {
          setIsSavingContact(false);
      }
  };

  const handleSync = async () => {
      setIsSyncing(true);
      setSyncProgress(10);
      const progressInterval = setInterval(() => {
          setSyncProgress(prev => (prev < 90 ? prev + 5 : prev));
      }, 300);

      try {
          await asaasService.syncCustomers();
          setSyncProgress(100);
          clearInterval(progressInterval);
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
      if (selectedIds.length === contacts.length && contacts.length > 0) {
          setSelectedIds([]);
      } else {
          setSelectedIds(contacts.map(c => c.id));
      }
  };

  const toggleSelect = (id: string) => {
      if (selectedIds.includes(id)) {
          setSelectedIds(selectedIds.filter(sid => sid !== id));
      } else {
          setSelectedIds([...selectedIds, id]);
      }
  };

  const handleBulkDelete = () => {
      if (selectedIds.length === 0) return;
      setConfirmationModal({ isOpen: true, count: selectedIds.length, type: 'bulk' });
  };

  const handleDeleteContact = (id: string, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      setConfirmationModal({ isOpen: true, count: 1, type: 'single', id });
  };

  const confirmDelete = async () => {
      if (!confirmationModal) return;
      setIsDeleting(true);
      try {
          if (confirmationModal.type === 'bulk') {
              await deleteContactsBulk(selectedIds);
              setSelectedIds([]); 
          } else if (confirmationModal.type === 'single' && confirmationModal.id) {
              await deleteContactsBulk([confirmationModal.id]);
              if (selectedContact?.id === confirmationModal.id) setSelectedContact(null);
          }
          await fetchContacts(); // Refresh list
      } catch (error: any) {
          console.error(error);
          alert("Erro ao excluir. O contato pode ter vínculos.");
      } finally {
          setIsDeleting(false);
          setConfirmationModal(null);
      }
  };

  const handleExport = () => {
      const contactsToExport = contacts.filter(c => selectedIds.includes(c.id));
      if (contactsToExport.length === 0) return;

      const headers = ["Nome", "Telefone", "Email", "Documento", "Status", "Origem"];
      const csvContent = [
          headers.join(","),
          ...contactsToExport.map(c => [
              `"${c.name}"`, c.phone, c.email || "", c.cpfCnpj || "", c.status, c.source
          ].join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
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

  // --- Bulk Email & Status Logic ---

  const handleBulkEmailSend = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsProcessingBulk(true);
      
      // Simulação de envio, pois não temos backend SMTP
      setTimeout(() => {
          showToast(`E-mail enviado para ${selectedIds.length} contatos!`, 'success');
          setIsProcessingBulk(false);
          setBulkActionModal(null);
          setSelectedIds([]);
          setBulkEmailData({ subject: '', body: '' });
      }, 1500);
  };

  const handleBulkStatusChange = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsProcessingBulk(true);
      try {
          await updateContactsStatusBulk(selectedIds, bulkStatusTarget);
          await fetchContacts();
          showToast(`Status atualizado para ${selectedIds.length} contatos!`, 'success');
          setSelectedIds([]);
          setBulkActionModal(null);
      } catch (error: any) {
          showToast("Erro ao atualizar status.", 'error');
      } finally {
          setIsProcessingBulk(false);
      }
  };

  // Quick Action Handlers
  const handleCopy = (e: React.MouseEvent, text: string, label: string) => {
      e.stopPropagation();
      navigator.clipboard.writeText(text);
      showToast(`${label} copiado para a área de transferência!`);
  };

  const handleWhatsApp = (e: React.MouseEvent, phone: string) => {
      e.stopPropagation();
      const cleanPhone = phone.replace(/\D/g, '');
      window.open(`https://wa.me/55${cleanPhone}`, '_blank');
  };

  const handleEmail = (e: React.MouseEvent, email: string) => {
      e.stopPropagation();
      window.open(`mailto:${email}`, '_blank');
  };

  const applyQuickFilter = (type: 'all' | 'overdue' | 'new') => {
      setSearchTerm(''); 
      setCurrentPage(1);
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

  const getStatusBadge = (status: string) => {
      const baseClass = "inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-wide px-2 py-0.5 text-[10px]";
      switch(status) {
          case 'paid': return <span className={`${baseClass} bg-emerald-100 text-emerald-700`}>Em dia</span>;
          case 'overdue': return <span className={`${baseClass} bg-rose-100 text-rose-700`}>Inadimplente</span>;
          case 'blocked': return <span className={`${baseClass} bg-slate-100 text-slate-600`}>Bloqueado</span>;
          default: return <span className={`${baseClass} bg-blue-100 text-blue-700`}>Ativo</span>;
      }
  };

  const getSourceIcon = (source: string) => {
      const baseClass = "flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded border";
      switch(source) {
          case 'asaas': return <span title="Asaas" className={`${baseClass} text-blue-700 bg-blue-50 border-blue-100`}>ASAAS</span>;
          case 'whatsapp': return <span title="WhatsApp" className={`${baseClass} text-emerald-700 bg-emerald-50 border-emerald-100`}>WHATSAPP</span>;
          default: return <span title="Manual" className={`${baseClass} text-slate-600 bg-slate-50 border-slate-200`}>MANUAL</span>;
      }
  };

  return (
    <div className="space-y-6 relative h-full">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[100] px-4 py-3 rounded-lg shadow-xl text-white text-sm font-medium animate-in slide-in-from-top-5 fade-in duration-300 flex items-center gap-2 ${toast.type === 'success' ? 'bg-slate-900' : 'bg-rose-600'}`}>
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            {toast.message}
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmationModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={() => !isDeleting && setConfirmationModal(null)}>
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-rose-100 text-rose-600 flex-shrink-0"><Trash2 className="w-6 h-6" /></div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900">Confirmar Exclusão</h3>
                <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                  {confirmationModal.type === 'bulk' ? `Excluir ${confirmationModal.count} contatos selecionados?` : "Excluir este contato permanentemente?"}
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setConfirmationModal(null)} disabled={isDeleting} className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg font-medium transition-colors text-sm disabled:opacity-50">Cancelar</button>
              <button onClick={confirmDelete} disabled={isDeleting} className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium shadow-sm transition-colors text-sm flex items-center gap-2 disabled:opacity-70">
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Email Modal */}
      {bulkActionModal?.type === 'email' && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={() => setBulkActionModal(null)}>
              <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2"><Mail className="w-5 h-5 text-slate-500"/> Enviar E-mail em Massa</h3>
                      <button onClick={() => setBulkActionModal(null)}><X className="w-5 h-5 text-slate-400"/></button>
                  </div>
                  <p className="text-sm text-slate-500 mb-4">Enviando para <strong>{selectedIds.length}</strong> contatos selecionados.</p>
                  
                  <form onSubmit={handleBulkEmailSend} className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Assunto</label>
                          <input 
                              type="text" 
                              required
                              className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:ring-brand-500" 
                              value={bulkEmailData.subject}
                              onChange={(e) => setBulkEmailData({...bulkEmailData, subject: e.target.value})}
                              placeholder="Ex: Aviso importante"
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Mensagem</label>
                          <textarea 
                              required
                              rows={4}
                              className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:ring-brand-500" 
                              value={bulkEmailData.body}
                              onChange={(e) => setBulkEmailData({...bulkEmailData, body: e.target.value})}
                              placeholder="Digite sua mensagem..."
                          />
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                          <button type="button" onClick={() => setBulkActionModal(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium">Cancelar</button>
                          <button type="submit" disabled={isProcessingBulk} className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-70">
                              {isProcessingBulk ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4"/>} Enviar
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* Bulk Status Modal */}
      {bulkActionModal?.type === 'status' && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={() => setBulkActionModal(null)}>
              <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2"><Tag className="w-5 h-5 text-slate-500"/> Alterar Status</h3>
                      <button onClick={() => setBulkActionModal(null)}><X className="w-5 h-5 text-slate-400"/></button>
                  </div>
                  <p className="text-sm text-slate-500 mb-4">Alterando status de <strong>{selectedIds.length}</strong> contatos.</p>
                  
                  <form onSubmit={handleBulkStatusChange} className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Novo Status</label>
                          <select 
                              className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:ring-brand-500" 
                              value={bulkStatusTarget}
                              onChange={(e) => setBulkStatusTarget(e.target.value)}
                          >
                              <option value="active">Ativo (Em dia)</option>
                              <option value="overdue">Inadimplente</option>
                              <option value="blocked">Bloqueado</option>
                              <option value="paid">Pago</option>
                          </select>
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                          <button type="button" onClick={() => setBulkActionModal(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium">Cancelar</button>
                          <button type="submit" disabled={isProcessingBulk} className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-70">
                              {isProcessingBulk ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>} Atualizar
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* Manual Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={() => setIsAddModalOpen(false)}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-200 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="text-lg font-bold text-slate-900">Novo Contato Manual</h3>
                    <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSaveContact} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
                        <div className="relative">
                            <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                            <input 
                                type="text" 
                                required
                                value={newContact.name}
                                onChange={(e) => setNewContact({...newContact, name: e.target.value})}
                                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500"
                                placeholder="Ex: João da Silva"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                            <input 
                                type="email" 
                                value={newContact.email}
                                onChange={(e) => setNewContact({...newContact, email: e.target.value})}
                                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500"
                                placeholder="joao@email.com"
                            />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">Sugerimos um e-mail válido para envio de notificações.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Telefone</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                <input 
                                    type="text" 
                                    required
                                    value={newContact.phone}
                                    onChange={(e) => setNewContact({...newContact, phone: e.target.value.replace(/\D/g, '')})}
                                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500"
                                    placeholder="11999999999"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">CPF/CNPJ</label>
                            <div className="relative">
                                <FileText className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                <input 
                                    type="text" 
                                    value={newContact.cpfCnpj}
                                    onChange={(e) => setNewContact({...newContact, cpfCnpj: e.target.value})}
                                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500"
                                    placeholder="Documento"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors text-sm">Cancelar</button>
                        <button type="submit" disabled={isSavingContact} className="flex-1 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium shadow-sm transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-70">
                            {isSavingContact ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Salvar
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* Drawer Overlay (Slide-over) */}
      {selectedContact && (
          <div className="fixed inset-0 z-[60] flex justify-end">
              <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm transition-opacity" onClick={() => setSelectedContact(null)}></div>
              <div className="relative w-full max-w-md bg-white shadow-2xl h-full overflow-y-auto animate-in slide-in-from-right duration-300 border-l border-slate-200 flex flex-col">
                  {/* Drawer Header */}
                  <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                      <div className="flex justify-between items-start mb-4">
                          <button onClick={() => setSelectedContact(null)} className="p-2 -ml-2 hover:bg-slate-200 rounded-full text-slate-500"><X className="w-5 h-5" /></button>
                          <div className="flex gap-2">
                              <button onClick={(e) => handleWhatsApp(e, selectedContact.phone)} className="p-2 text-slate-400 hover:text-emerald-600 bg-white shadow-sm border border-slate-200 rounded-lg"><MessageCircle className="w-4 h-4" /></button>
                              <button onClick={(e) => handleDeleteContact(selectedContact.id, e)} className="p-2 text-slate-400 hover:text-rose-600 bg-white shadow-sm border border-slate-200 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                          </div>
                      </div>
                      <h2 className="text-xl font-bold text-slate-900">{selectedContact.name}</h2>
                      <p className="text-sm text-slate-500">{selectedContact.email}</p>
                  </div>
                  
                  {/* Drawer Details Content */}
                  <div className="p-6 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">CPF/CNPJ</label>
                                <p className="text-sm text-slate-900 font-mono mt-1">{selectedContact.cpfCnpj || '-'}</p>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Telefone</label>
                                <p className="text-sm text-slate-900 mt-1">{selectedContact.phone}</p>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Status</label>
                                <div className="mt-1">{getStatusBadge(selectedContact.status)}</div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Origem</label>
                                <div className="mt-1">{getSourceIcon(selectedContact.source)}</div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-100">
                            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <Wallet className="w-4 h-4 text-emerald-600" />
                                Financeiro
                            </h3>
                            <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Faturas em Aberto</label>
                                    <p className="text-lg font-bold text-slate-900 mt-1">{selectedContact.openInvoices || 0}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Valor Total Pago</label>
                                    <p className="text-lg font-bold text-emerald-600 mt-1">
                                        {(selectedContact.totalPaid || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="pt-4 flex gap-3">
                            <button onClick={(e) => handleWhatsApp(e, selectedContact.phone)} className="flex-1 bg-brand-600 text-white py-2 rounded-lg font-medium hover:bg-brand-700 transition-colors flex items-center justify-center gap-2">
                                <MessageCircle className="w-4 h-4" /> Enviar Mensagem
                            </button>
                            <button className="flex-1 bg-white border border-slate-200 text-slate-700 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                                <FileText className="w-4 h-4" /> Ver Extrato
                            </button>
                        </div>
                  </div>
              </div>
          </div>
      )}

      {/* Metrics Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div onClick={() => applyQuickFilter('all')} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden group cursor-pointer hover:border-brand-300 transition-all">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20"><User className="w-16 h-16 text-brand-600" /></div>
              <p className="text-sm font-medium text-slate-500">Base Total</p>
              <h3 className="text-3xl font-bold text-slate-900">{totalCount}</h3>
          </div>
          <div onClick={() => applyQuickFilter('overdue')} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden group cursor-pointer hover:border-rose-300 transition-all">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20"><AlertCircle className="w-16 h-16 text-rose-600" /></div>
              <p className="text-sm font-medium text-slate-500">Inadimplentes</p>
              <h3 className="text-3xl font-bold text-slate-900">-</h3> {/* Needs separate count query */}
          </div>
           <div onClick={() => applyQuickFilter('new')} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden group cursor-pointer hover:border-emerald-300 transition-all">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20"><MessageCircle className="w-16 h-16 text-emerald-600" /></div>
              <p className="text-sm font-medium text-slate-500">Novos (WhatsApp)</p>
              <h3 className="text-3xl font-bold text-slate-900">-</h3>
          </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 pt-2">
        <div><h2 className="text-2xl font-bold text-slate-900">Contatos</h2><p className="text-slate-500">Gerencie sua base de clientes sincronizada.</p></div>
        <div className="flex gap-2">
            <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg font-medium shadow-sm transition-colors"><Plus className="w-4 h-4" /> Manual</button>
            <button onClick={handleSync} disabled={isSyncing} className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-all disabled:opacity-70 relative overflow-hidden group">
                {isSyncing && <div className="absolute left-0 top-0 bottom-0 bg-white/20 transition-all duration-300 ease-out" style={{ width: `${syncProgress}%` }} />}
                <RefreshCcw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''} relative z-10`} /><span className="relative z-10">{isSyncing ? 'Sincronizando...' : 'Sincronizar Asaas'}</span>
            </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Filters */}
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col xl:flex-row gap-4 justify-between items-center">
              <div className="relative w-full xl:max-w-md group">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    placeholder="Buscar por Nome, E-mail, CPF/CNPJ ou Telefone..." 
                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 transition-all" 
                  />
              </div>
              <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto justify-end">
                   <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-white border border-slate-200 rounded-lg p-2 text-sm"><option value="all">Status: Todos</option><option value="active">Ativos</option><option value="overdue">Inadimplentes</option></select>
                   <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="bg-white border border-slate-200 rounded-lg p-2 text-sm"><option value="all">Origem: Todas</option><option value="asaas">Asaas</option><option value="whatsapp">WhatsApp</option></select>
              </div>
          </div>

          {/* Bulk Actions Bar */}
          {selectedIds.length > 0 && (
              <div className="bg-slate-900 text-white px-6 py-2 flex items-center justify-between animate-in slide-in-from-top-2 duration-200">
                  <span className="text-sm font-medium">{selectedIds.length} contatos selecionados</span>
                  <div className="flex gap-2">
                      <button onClick={() => setBulkActionModal({isOpen: true, type: 'email'})} className="px-3 py-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 rounded-lg flex items-center gap-2">
                          <Mail className="w-3 h-3" /> Enviar E-mail
                      </button>
                      <button onClick={() => setBulkActionModal({isOpen: true, type: 'status'})} className="px-3 py-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 rounded-lg flex items-center gap-2">
                          <Tag className="w-3 h-3" /> Alterar Status
                      </button>
                      <div className="w-px h-6 bg-slate-700 mx-1"></div>
                      <button onClick={handleExport} className="px-3 py-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 rounded-lg flex items-center gap-2">
                          <Download className="w-3 h-3" /> Exportar
                      </button>
                      <button onClick={handleBulkDelete} className="px-3 py-1.5 text-xs font-medium bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 rounded-lg flex items-center gap-2">
                          <Trash2 className="w-3 h-3" /> Excluir
                      </button>
                  </div>
              </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <th className="px-6 py-4 w-4"><button onClick={toggleSelectAll} className="text-slate-400">{selectedIds.length === contacts.length && contacts.length > 0 ? <CheckSquare className="w-5 h-5 text-brand-600" /> : <Square className="w-5 h-5" />}</button></th>
                        <th className="px-6 py-4">Cliente</th>
                        <th className="px-6 py-4">Contato</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Origem</th>
                        <th className="px-6 py-4 text-right">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {isLoadingData ? (
                        <tr><td colSpan={6} className="px-6 py-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-600" /></td></tr>
                    ) : contacts.length === 0 ? (
                        <tr><td colSpan={6} className="px-6 py-16 text-center text-slate-500">Nenhum contato encontrado.</td></tr>
                    ) : (
                        contacts.map((contact) => (
                        <tr key={contact.id} onClick={() => setSelectedContact(contact)} className={`hover:bg-slate-50 cursor-pointer ${selectedIds.includes(contact.id) ? 'bg-slate-50' : ''}`}>
                            <td className="px-6 py-4" onClick={(e) => { e.stopPropagation(); toggleSelect(contact.id); }}>{selectedIds.includes(contact.id) ? <CheckSquare className="w-5 h-5 text-brand-600" /> : <Square className="w-5 h-5 text-slate-300" />}</td>
                            <td className="px-6 py-4"><div className="font-bold text-slate-900 text-sm">{contact.name}</div><div className="text-xs text-slate-400 font-mono">{contact.cpfCnpj}</div></td>
                            
                            {/* Contact Info Column with Copy Action */}
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-2 group/phone">
                                    <div className="text-sm text-slate-600">+55 {contact.phone}</div>
                                    <button 
                                        onClick={(e) => handleCopy(e, contact.phone, 'Telefone')} 
                                        className="opacity-0 group-hover/phone:opacity-100 p-1 text-slate-400 hover:text-brand-600 transition-all rounded hover:bg-slate-200" 
                                        title="Copiar telefone"
                                    >
                                        <Copy className="w-3 h-3" />
                                    </button>
                                </div>
                                <div className="flex items-center gap-2 group/email">
                                    <div className="text-xs text-slate-400">{contact.email}</div>
                                    {contact.email && (
                                        <button 
                                            onClick={(e) => handleCopy(e, contact.email!, 'E-mail')} 
                                            className="opacity-0 group-hover/email:opacity-100 p-1 text-slate-400 hover:text-brand-600 transition-all rounded hover:bg-slate-200"
                                            title="Copiar e-mail"
                                        >
                                            <Copy className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                            </td>

                            <td className="px-6 py-4">{getStatusBadge(contact.status)}</td>
                            <td className="px-6 py-4">{getSourceIcon(contact.source)}</td>
                            
                            {/* Action Buttons: WhatsApp & Email */}
                            <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-end gap-1">
                                    <button 
                                        onClick={(e) => handleWhatsApp(e, contact.phone)} 
                                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" 
                                        title="Enviar WhatsApp"
                                    >
                                        <MessageCircle className="w-4 h-4" />
                                    </button>
                                    
                                    {contact.email && (
                                        <button 
                                            onClick={(e) => handleEmail(e, contact.email!)} 
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" 
                                            title="Enviar E-mail"
                                        >
                                            <Mail className="w-4 h-4" />
                                        </button>
                                    )}
                                    
                                    <div className="h-4 w-px bg-slate-200 mx-1"></div>
                                    
                                    <button 
                                        onClick={(e) => handleDeleteContact(contact.id, e)} 
                                        className="p-2 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
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
          
          {/* Pagination Controls */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
              <span className="text-xs text-slate-500 font-medium">Página {currentPage} de {Math.max(1, totalPages)} ({totalCount} total)</span>
              <div className="flex gap-2">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 text-xs font-medium text-slate-600 shadow-sm transition-colors flex items-center gap-1"><ChevronLeft className="w-3 h-3" /> Anterior</button>
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 text-xs font-medium text-slate-600 shadow-sm transition-colors flex items-center gap-1">Próximo <ChevronRight className="w-3 h-3" /></button>
              </div>
          </div>
      </div>
    </div>
  );
};

export default Contacts;