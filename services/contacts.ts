
import { supabase } from './supabase';
import { authService } from './auth';
import { Contact } from '../types';

export const getContacts = async (): Promise<Contact[]> => {
  const companyId = await authService.getCompanyId();
  if (!companyId) return [];

  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching contacts:", error);
    return [];
  }

  // Map database fields to frontend types if necessary (snake_case to camelCase)
  // Assuming the Types match the SQL provided earlier
  return data.map(c => ({
      ...c,
      lastMessageAt: c.last_message_at || '-',
      totalPaid: c.total_paid,
      openInvoices: c.open_invoices
  })) as any;
};

export const createContact = async (contact: Omit<Contact, 'id'>) => {
  const companyId = await authService.getCompanyId();
  if (!companyId) throw new Error("Sem empresa vinculada");

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
    .eq('company_id', companyId); // Garante que só deleta da própria empresa

  if (error) throw error;
};

export const syncContactsFromAsaasMock = async () => {
    // This maintains the mock logic for "sync" but could save to DB
    // Ideally, the backend webhook handles the sync.
    // For now, we simulate a sync by adding a dummy contact to Supabase
    const companyId = await authService.getCompanyId();
    if (!companyId) return;

    await supabase.from('contacts').insert([{
        company_id: companyId,
        name: "Cliente Sincronizado Asaas",
        phone: "11999998888",
        email: "cliente@asaas.com",
        source: "asaas",
        status: "active"
    }]);
};
