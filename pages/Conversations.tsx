
import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Send, 
  Paperclip, 
  Bot, 
  User, 
  MoreVertical, 
  Phone,
  CheckCheck,
  BrainCircuit,
  MessageCircle,
  Sparkles,
  Loader2,
  CheckCircle2,
  Filter,
  X
} from 'lucide-react';
import { Conversation, Message } from '../types';
import { generateSmartReply } from '../services/ai';
import { getConversations, updateConversationStatus, getMessages, sendMessage } from '../services/conversations';

const Conversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [selectedChat, setSelectedChat] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [inputText, setInputText] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  
  // Filtering & Sorting State
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'status' | 'unread'>('recent');
  
  // Async States
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  
  // Feedback
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load Chats
  useEffect(() => {
    loadConversations();
  }, []);

  // Load Messages when Chat Selected
  useEffect(() => {
      if (selectedChat) {
          loadMessages(selectedChat.id);
          setAiSuggestion(null); // Clear suggestion on chat change
      }
  }, [selectedChat?.id]);

  // Auto-scroll to bottom
  useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  const loadConversations = async () => {
    try {
      const data = await getConversations();
      setConversations(data);
      // Optional: Auto-select first chat
      // if (data.length > 0 && !selectedChat) setSelectedChat(data[0]);
    } catch (error) {
      console.error("Failed to load chats", error);
    } finally {
      setIsLoadingChats(false);
    }
  };

  const loadMessages = async (chatId: string) => {
      setIsLoadingMessages(true);
      try {
          const msgs = await getMessages(chatId);
          setMessages(msgs);
      } catch (error) {
          console.error("Failed to load messages", error);
      } finally {
          setIsLoadingMessages(false);
      }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSend = async () => {
    if (!inputText.trim() || !selectedChat) return;
    
    const text = inputText;
    setInputText(''); // Optimistic clear

    try {
        const newMessage = await sendMessage(selectedChat.id, text, 'agent');
        setMessages(prev => [...prev, newMessage]);
        
        // Update local conversation list order/preview
        setConversations(prev => prev.map(c => 
            c.id === selectedChat.id 
            ? { ...c, lastMessage: text, updatedAt: new Date().toISOString() } 
            : c
        ).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));

    } catch (error) {
        alert("Erro ao enviar mensagem.");
        setInputText(text); // Restore on failure
    }
  };

  const toggleMode = async () => {
    if (!selectedChat) return;
    setIsUpdatingStatus(true);
    
    const newStatus = selectedChat.status === 'ai' ? 'human' : 'ai';
    
    try {
      const updatedChat = await updateConversationStatus(selectedChat.id, newStatus);
      
      setConversations(conversations.map(c => c.id === updatedChat.id ? updatedChat : c));
      setSelectedChat(updatedChat);
      setAiSuggestion(null);
      
      showToast(
        newStatus === 'human' 
          ? "Modo Humano ativado. A IA foi pausada." 
          : "Modo IA ativado. O sistema responderá automaticamente."
      );
    } catch (error) {
      showToast("Erro ao alterar status da conversa.", "error");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleGenerateAI = async () => {
    if (!selectedChat) return;
    setIsGenerating(true);
    
    const history = messages
      .map(m => `${m.sender.toUpperCase()}: ${m.content}`)
      .join('\n');

    try {
      const reply = await generateSmartReply(
        "Empresa de Cobrança. Cliente: " + selectedChat.contact.name, 
        history || "Início da conversa."
      );
      
      if (reply) {
        setInputText(reply.trim());
      }
    } catch (error) {
      alert('Erro ao gerar resposta com IA.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePeekAI = async () => {
    if (!selectedChat) return;
    setIsGenerating(true);
    setAiSuggestion(null);

    const history = messages
      .map(m => `${m.sender.toUpperCase()}: ${m.content}`)
      .join('\n');

    try {
      const reply = await generateSmartReply(
        "Você é a IA da Movicobrança. Gere a próxima resposta para este contexto, mas NÃO envie. Apenas sugira.", 
        history || "Início da conversa."
      );
      
      if (reply) {
        setAiSuggestion(reply.trim());
      }
    } catch (error) {
      showToast('Erro ao gerar sugestão.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Logic to Filter and Sort Conversations
  const getProcessedConversations = () => {
    let result = [...conversations];

    if (searchTerm) {
      result = result.filter(c => 
        c.contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.contact.phone.includes(searchTerm)
      );
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'status':
          if (a.status === b.status) return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
          return a.status === 'human' ? -1 : 1;
        case 'unread':
           if (a.unreadCount === b.unreadCount) return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
           return b.unreadCount - a.unreadCount;
        case 'recent':
        default:
           return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });

    return result;
  };

  const displayedConversations = getProcessedConversations();

  return (
    <div className="flex h-[calc(100vh-2rem)] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`absolute top-4 left-1/2 transform -translate-x-1/2 px-5 py-3 rounded-lg shadow-xl text-white text-sm font-medium animate-in slide-in-from-top-5 fade-in duration-300 z-[60] flex items-center gap-3 ${toast.type === 'success' ? 'bg-slate-900' : 'bg-rose-600'}`}>
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
            {toast.message}
        </div>
      )}

      {/* List (Left) */}
      <div className="w-80 border-r border-slate-200 flex flex-col bg-slate-50">
        <div className="p-4 border-b border-slate-200 bg-white space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar contato..." 
              className="w-full pl-9 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                  <Filter className="w-3.5 h-3.5" />
                  Filtrar:
              </div>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-xs bg-slate-100 border-none rounded-md py-1.5 pl-2 pr-6 focus:ring-1 focus:ring-brand-500 text-slate-700 cursor-pointer font-medium"
              >
                  <option value="recent">Mais Recentes</option>
                  <option value="status">Status (Humano)</option>
                  <option value="unread">Não Lidas</option>
              </select>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {isLoadingChats ? (
            <div className="p-4 text-center text-slate-400">
               <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
               <span className="text-xs">Carregando conversas...</span>
            </div>
          ) : displayedConversations.length === 0 ? (
            <div className="p-8 text-center text-slate-400 flex flex-col items-center">
                <Search className="w-8 h-8 mb-2 opacity-30" />
                <span className="text-sm font-medium">Nenhum resultado</span>
                <span className="text-xs mt-1">Tente outro termo de busca.</span>
            </div>
          ) : (
            displayedConversations.map((chat) => (
                <div 
                key={chat.id}
                onClick={() => setSelectedChat(chat)}
                className={`p-4 border-b border-slate-100 cursor-pointer transition-colors hover:bg-slate-100 ${selectedChat?.id === chat.id ? 'bg-brand-50 border-l-4 border-l-brand-500' : ''}`}
                >
                <div className="flex justify-between items-start mb-1">
                    <h4 className={`font-semibold text-sm ${selectedChat?.id === chat.id ? 'text-brand-900' : 'text-slate-900'}`}>{chat.contact.name}</h4>
                    <span className="text-xs text-slate-400">
                        {new Date(chat.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                </div>
                <p className="text-xs text-slate-500 truncate mb-2">{chat.lastMessage || "Iniciar conversa..."}</p>
                <div className="flex items-center gap-2">
                    {chat.status === 'ai' ? (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-100 text-indigo-800">
                        <Bot className="w-3 h-3 mr-1" /> IA
                    </span>
                    ) : (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-800">
                        <User className="w-3 h-3 mr-1" /> HUMANO
                    </span>
                    )}
                    {chat.unreadCount > 0 && (
                    <span className="ml-auto bg-brand-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-sm">
                        {chat.unreadCount}
                    </span>
                    )}
                </div>
                </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area (Right) */}
      <div className="flex-1 flex flex-col bg-slate-50/50">
        {selectedChat ? (
          <>
            {/* Header */}
            <div className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold">
                  {selectedChat.contact.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{selectedChat.contact.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                    <span className="text-xs text-slate-500">WhatsApp Oficial • +55 {selectedChat.contact.phone}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
                    <button 
                        onClick={selectedChat.status === 'human' ? toggleMode : undefined}
                        disabled={isUpdatingStatus}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-2 ${selectedChat.status === 'ai' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        {isUpdatingStatus && selectedChat.status === 'human' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BrainCircuit className="w-3.5 h-3.5" />}
                        Modo IA
                    </button>
                    <button 
                        onClick={selectedChat.status === 'ai' ? toggleMode : undefined}
                        disabled={isUpdatingStatus}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-2 ${selectedChat.status === 'human' ? 'bg-white shadow text-amber-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        {isUpdatingStatus && selectedChat.status === 'ai' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <User className="w-3.5 h-3.5" />}
                        Modo Humano
                    </button>
                </div>
                <div className="h-6 w-px bg-slate-200"></div>
                <button className="text-slate-400 hover:text-brand-600"><Phone className="w-5 h-5" /></button>
                <button className="text-slate-400 hover:text-brand-600"><MoreVertical className="w-5 h-5" /></button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#e5ddd5] bg-opacity-10" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
              {isLoadingMessages ? (
                  <div className="flex justify-center pt-10"><Loader2 className="w-8 h-8 animate-spin text-slate-300" /></div>
              ) : messages.length === 0 ? (
                  <div className="text-center text-slate-400 pt-20">
                      <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">Nenhuma mensagem ainda.</p>
                  </div>
              ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-3 shadow-sm text-sm ${
                        msg.sender === 'user' 
                        ? 'bg-white text-slate-800 rounded-tl-none border border-slate-100' 
                        : msg.sender === 'ai'
                            ? 'bg-indigo-50 text-indigo-900 rounded-tr-none border border-indigo-100'
                            : 'bg-brand-600 text-white rounded-tr-none'
                    }`}>
                        {msg.sender === 'ai' && (
                            <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-400 mb-1 uppercase tracking-wider">
                                <Bot className="w-3 h-3" /> Resposta Automática
                            </div>
                        )}
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${msg.sender === 'agent' ? 'text-brand-200' : 'text-slate-400'}`}>
                        <span>{msg.timestamp}</span>
                        {msg.sender !== 'user' && <CheckCheck className="w-3 h-3" />}
                        </div>
                    </div>
                    </div>
                ))
              )}
              
              {/* Typing Indicator */}
              {isGenerating && (
                <div className="flex justify-end animate-in fade-in slide-in-from-bottom-2">
                    <div className="bg-indigo-50 text-indigo-900 rounded-2xl rounded-tr-none border border-indigo-100 px-4 py-3 shadow-sm flex items-center gap-2">
                        <Bot className="w-4 h-4 text-indigo-400" />
                        <span className="text-xs font-medium">IA pensando...</span>
                        <div className="flex gap-1">
                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
                        </div>
                    </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-slate-200">
                {selectedChat.status === 'ai' ? (
                     <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 transition-all">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <div className="bg-indigo-100 p-2 rounded-full">
                                    <Bot className="w-5 h-5 text-indigo-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-indigo-900">A IA está controlando esta conversa</p>
                                    <p className="text-xs text-indigo-600">O cliente está sendo atendido automaticamente.</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={handlePeekAI}
                                    disabled={isGenerating}
                                    className="bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 px-3 py-2 rounded-lg text-xs font-medium transition-colors shadow-sm flex items-center gap-2"
                                >
                                    <Sparkles className="w-3 h-3" />
                                    Ver o que a IA diria
                                </button>
                                <button 
                                    onClick={toggleMode}
                                    disabled={isUpdatingStatus}
                                    className="bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-lg text-xs font-medium transition-colors shadow-sm flex items-center gap-2"
                                >
                                    {isUpdatingStatus ? <Loader2 className="w-3 h-3 animate-spin" /> : <User className="w-3 h-3" />}
                                    Assumir conversa
                                </button>
                            </div>
                        </div>
                        
                        {/* Suggestion Box */}
                        {aiSuggestion && (
                            <div className="mt-3 p-3 bg-white rounded border border-indigo-100 relative animate-in fade-in slide-in-from-top-1">
                                <button 
                                    onClick={() => setAiSuggestion(null)} 
                                    className="absolute top-2 right-2 text-slate-300 hover:text-slate-500"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block mb-1">Sugestão da IA</span>
                                <p className="text-sm text-slate-600 italic">"{aiSuggestion}"</p>
                            </div>
                        )}
                     </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <button className="p-2 text-slate-400 hover:text-brand-600 transition-colors rounded-full hover:bg-slate-100">
                        <Paperclip className="w-5 h-5" />
                        </button>
                        <input 
                        type="text" 
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Digite uma mensagem..." 
                        className="flex-1 bg-slate-100 border-none rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-brand-500 text-sm"
                        />
                        <button 
                        onClick={handleSend}
                        className="p-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors shadow-md hover:shadow-lg"
                        >
                        <Send className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="flex justify-end">
                       <button 
                          onClick={handleGenerateAI}
                          disabled={isGenerating}
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 transition-colors disabled:opacity-50"
                        >
                          {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                          Sugestão Inteligente (Gemini)
                       </button>
                    </div>
                  </div>
                )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <MessageCircle className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg font-medium">Selecione uma conversa</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Conversations;
