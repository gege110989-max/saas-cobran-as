
import { supabase } from './supabase';
import { authService } from './auth';
import { Contact } from '../types';

interface GetContactsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  source?: string;
}

export const getContacts = async (params: GetContactsParams = {}): Promise<{ data: Contact[], count: number }> => {
  const companyId = await authService.getCompanyId();
  if (!companyId) return { data: [], count: 0 };

  const { page = 1, limit = 50, search = '', status = 'all', source = 'all' } = params;
  
  // Calcular Range para Paginação do Supabase (0-based)
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  // Iniciar Query
  let query = supabase
    .from('contacts')
    .select('*', { count: 'exact' }) // Traz o total de registros para paginação
    .eq('company_id', companyId);

  // Aplicar Filtros Dinâmicos
  if (status !== 'all') {
    query = query.eq('status', status);
  }

  if (source !== 'all') {
    query = query.eq('source', source);
  }

  if (search) {
    // Lógica de Busca Avançada:
    // Remove caracteres não numéricos para buscar em campos CPF/Telefone mesmo se o usuário digitar formatado (ou vice-versa)
    const cleanSearch = search.replace(/\D/g, '');
    
    // Monta condições de busca
    const conditions = [
        `name.ilike.%${search}%`,
        `email.ilike.%${search}%`,
        `cpf_cnpj.ilike.%${search}%`,
        `phone.ilike.%${search}%`
    ];

    // Se houver números na busca e for diferente da busca original (ex: usuário digitou "123.456"),
    // adiciona a versão limpa ("123456") à query
    if (cleanSearch && cleanSearch !== search) {
        conditions.push(`cpf_cnpj.ilike.%${cleanSearch}%`);
        conditions.push(`phone.ilike.%${cleanSearch}%`);
    }

    // Aplica o OR com todas as condições
    query = query.or(conditions.join(','));
  }

  // Ordenação e Paginação
  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    console.error("Error fetching contacts:", error);
    return { data: [], count: 0 };
  }

  // Mapeamento de campos (Snake -> Camel)
  const mappedData = data.map(c => ({
      ...c,
      lastMessageAt: c.last_message_at || '-',
      totalPaid: c.total_paid || 0,
      openInvoices: c.open_invoices || 0
  })) as Contact[];

  return { data: mappedData, count: count || 0 };
};

export const createContact = async (contact: Omit<Contact, 'id'>) => {
  const companyId = await authService.getCompanyId();
  if (!companyId) throw new Error("Sem empresa vinculada");

  // Validar unicidade básica (opcional, mas recomendado)
  if (contact.email) {
      const { data: existing } = await supabase
        .from('contacts')
        .select('id')
        .eq('company_id', companyId)
        .eq('email', contact.email)
        .maybeSingle();
      
      if (existing) throw new Error("Já existe um contato com este e-mail.");
  }

  const { data, error } = await supabase
    .from('contacts')
    .insert([
      { 
        company_id: companyId,
        name: contact.name,
        phone: contact.phone,
        email: contact.email,
        cpf_cnpj: contact.cpfCnpj,
        source: 'manual',
        status: 'active'
      }
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteContactsBulk = async (ids: string[]) => {
  if (!ids || ids.length === 0) return;
  const companyId = await authService.getCompanyId();
  if (!companyId) throw new Error("Sem empresa vinculada");

  const { error } = await supabase
    .from('contacts')
    .delete()
    .in('id', ids)
    .eq('company_id', companyId); 

  if (error) throw error;
};

export const updateContactsStatusBulk = async (ids: string[], status: string) => {
  if (!ids || ids.length === 0) return;
  const companyId = await authService.getCompanyId();
  if (!companyId) throw new Error("Sem empresa vinculada");

  const { error } = await supabase
    .from('contacts')
    .update({ status: status })
    .in('id', ids)
    .eq('company_id', companyId);

  if (error) throw error;
};
