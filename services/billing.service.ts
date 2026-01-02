import { supabase, supabaseAdmin } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Transaction = Database['public']['Tables']['transactions']['Row'];
type TransactionInsert = Database['public']['Tables']['transactions']['Insert'];
type TuitionInvoice = Database['public']['Tables']['tuition_invoices']['Row'];
type TuitionInvoiceInsert = Database['public']['Tables']['tuition_invoices']['Insert'];
type TuitionInvoiceUpdate = Database['public']['Tables']['tuition_invoices']['Update'];

// Type-safe helper to get table query builder
const fromTransactions = () => supabase.from('transactions');
const fromInvoices = () => supabase.from('tuition_invoices');

export const billingService = {
  // ==================== TRANSACTIONS ====================

  // Get all transactions
  async getTransactions() {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        student:profiles!student_id(id, name, email)
      `)
      .order('timestamp', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get transactions by type
  async getTransactionsByType(type: 'LEARNING_HUB' | 'OLYMPIAD') {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        student:profiles!student_id(id, name, email)
      `)
      .eq('type', type)
      .order('timestamp', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get transactions by student
  async getTransactionsByStudent(studentId: string) {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('student_id', studentId)
      .order('timestamp', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get successful transactions
  async getSuccessfulTransactions() {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        student:profiles!student_id(id, name, email)
      `)
      .eq('status', 'SUCCESS')
      .order('timestamp', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get transaction by ID
  async getTransactionById(id: string) {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        student:profiles!student_id(id, name, email)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Create transaction (uses admin client to bypass RLS)
  async createTransaction(transaction: TransactionInsert) {
    const { data, error } = await supabaseAdmin
      .from('transactions')
      .insert(transaction as any)
      .select()
      .single();

    if (error) throw error;
    return data as Transaction;
  },

  // Get transaction statistics
  async getTransactionStats() {
    const { data, error } = await supabase
      .from('transactions')
      .select('type, amount, status');

    if (error) throw error;

    const transactions = (data || []) as Pick<Transaction, 'type' | 'amount' | 'status'>[];
    const successful = transactions.filter(t => t.status === 'SUCCESS');
    const totalRevenue = successful.reduce((sum, t) => sum + t.amount, 0);
    const learningHubRevenue = successful
      .filter(t => t.type === 'LEARNING_HUB')
      .reduce((sum, t) => sum + t.amount, 0);
    const olympiadRevenue = successful
      .filter(t => t.type === 'OLYMPIAD')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalTransactions: transactions.length,
      successfulTransactions: successful.length,
      totalRevenue,
      learningHubRevenue,
      olympiadRevenue,
    };
  },

  // ==================== TUITION INVOICES ====================

  // Get all invoices
  async getInvoices() {
    const { data, error } = await supabase
      .from('tuition_invoices')
      .select(`
        *,
        student:profiles!student_id(id, name, email, phone)
      `)
      .order('due_date', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get invoices by month
  async getInvoicesByMonth(month: string) {
    const { data, error } = await supabase
      .from('tuition_invoices')
      .select(`
        *,
        student:profiles!student_id(id, name, email, phone)
      `)
      .eq('month', month)
      .order('student_name');

    if (error) throw error;
    return data;
  },

  // Get invoices by status
  async getInvoicesByStatus(status: 'PAID' | 'UNPAID') {
    const { data, error } = await supabase
      .from('tuition_invoices')
      .select(`
        *,
        student:profiles!student_id(id, name, email, phone)
      `)
      .eq('status', status)
      .order('due_date', { ascending: true });

    if (error) throw error;
    return data;
  },

  // Get invoices by student
  async getInvoicesByStudent(studentId: string) {
    const { data, error } = await supabase
      .from('tuition_invoices')
      .select('*')
      .eq('student_id', studentId)
      .order('due_date', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get overdue invoices
  async getOverdueInvoices() {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('tuition_invoices')
      .select(`
        *,
        student:profiles!student_id(id, name, email, phone)
      `)
      .eq('status', 'UNPAID')
      .lt('due_date', today)
      .order('due_date', { ascending: true });

    if (error) throw error;
    return data;
  },

  // Get invoice by ID
  async getInvoiceById(id: string) {
    const { data, error } = await supabase
      .from('tuition_invoices')
      .select(`
        *,
        student:profiles!student_id(id, name, email, phone)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Create invoice (uses admin client to bypass RLS)
  async createInvoice(invoice: TuitionInvoiceInsert) {
    const { data, error } = await supabaseAdmin
      .from('tuition_invoices')
      .insert(invoice as any)
      .select()
      .single();

    if (error) throw error;
    return data as TuitionInvoice;
  },

  // Create invoices for all students (batch) (uses admin client to bypass RLS)
  async createMonthlyInvoices(month: string, amount: number, dueDate: string, studentIds: string[]) {
    const invoices = await Promise.all(
      studentIds.map(async (studentId) => {
        const { data: student } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', studentId)
          .single();

        return {
          student_id: studentId,
          student_name: student?.name || 'Unknown',
          month,
          amount,
          due_date: dueDate,
          status: 'UNPAID' as const,
        };
      })
    );

    const { data, error } = await supabaseAdmin
      .from('tuition_invoices')
      .insert(invoices as any)
      .select();

    if (error) throw error;
    return data as TuitionInvoice[];
  },

  // Update invoice (uses admin client to bypass RLS)
  async updateInvoice(id: string, updates: TuitionInvoiceUpdate) {
    const { data, error } = await supabaseAdmin
      .from('tuition_invoices')
      .update(updates as any)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as TuitionInvoice;
  },

  // Mark invoice as paid
  async markAsPaid(id: string) {
    return this.updateInvoice(id, { status: 'PAID' });
  },

  // Mark invoice as unpaid
  async markAsUnpaid(id: string) {
    return this.updateInvoice(id, { status: 'UNPAID' });
  },

  // Record reminder sent
  async recordReminder(id: string) {
    return this.updateInvoice(id, { reminded_at: new Date().toISOString() });
  },

  // Delete invoice (uses admin client to bypass RLS)
  async deleteInvoice(id: string) {
    const { error } = await supabaseAdmin
      .from('tuition_invoices')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Get invoice statistics by month
  async getInvoiceStatsByMonth(month: string) {
    const { data, error } = await supabase
      .from('tuition_invoices')
      .select('amount, status')
      .eq('month', month);

    if (error) throw error;

    const invoices = (data || []) as Pick<TuitionInvoice, 'amount' | 'status'>[];
    const total = invoices.length;
    const paid = invoices.filter(i => i.status === 'PAID');
    const unpaid = invoices.filter(i => i.status === 'UNPAID');
    const totalAmount = invoices.reduce((sum, i) => sum + i.amount, 0);
    const collectedAmount = paid.reduce((sum, i) => sum + i.amount, 0);
    const outstandingAmount = unpaid.reduce((sum, i) => sum + i.amount, 0);

    return {
      total,
      paidCount: paid.length,
      unpaidCount: unpaid.length,
      totalAmount,
      collectedAmount,
      outstandingAmount,
      collectionRate: total > 0 ? (paid.length / total) * 100 : 0,
    };
  },
};

export default billingService;
