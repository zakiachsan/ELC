import { useState, useEffect, useCallback } from 'react';
import { billingService } from '../services/billing.service';
import type { Database } from '../lib/database.types';

type Transaction = Database['public']['Tables']['transactions']['Row'];
type TuitionInvoice = Database['public']['Tables']['tuition_invoices']['Row'];
type TuitionInvoiceInsert = Database['public']['Tables']['tuition_invoices']['Insert'];

export const useTransactions = (type?: 'LEARNING_HUB' | 'OLYMPIAD') => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = type
        ? await billingService.getTransactionsByType(type)
        : await billingService.getTransactions();
      setTransactions(data || []);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return {
    transactions,
    loading,
    error,
    refetch: fetchTransactions,
  };
};

export const useInvoices = (month?: string, status?: 'PAID' | 'UNPAID') => {
  const [invoices, setInvoices] = useState<TuitionInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let data;
      if (month) {
        data = await billingService.getInvoicesByMonth(month);
      } else if (status) {
        data = await billingService.getInvoicesByStatus(status);
      } else {
        data = await billingService.getInvoices();
      }

      setInvoices(data || []);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [month, status]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const createInvoice = async (invoice: TuitionInvoiceInsert) => {
    const newInvoice = await billingService.createInvoice(invoice);
    setInvoices(prev => [newInvoice, ...prev]);
    return newInvoice;
  };

  const markAsPaid = async (id: string) => {
    const updated = await billingService.markAsPaid(id);
    setInvoices(prev => prev.map(i => i.id === id ? updated : i));
    return updated;
  };

  const markAsUnpaid = async (id: string) => {
    const updated = await billingService.markAsUnpaid(id);
    setInvoices(prev => prev.map(i => i.id === id ? updated : i));
    return updated;
  };

  const recordReminder = async (id: string) => {
    const updated = await billingService.recordReminder(id);
    setInvoices(prev => prev.map(i => i.id === id ? updated : i));
    return updated;
  };

  const deleteInvoice = async (id: string) => {
    await billingService.deleteInvoice(id);
    setInvoices(prev => prev.filter(i => i.id !== id));
  };

  return {
    invoices,
    loading,
    error,
    refetch: fetchInvoices,
    createInvoice,
    markAsPaid,
    markAsUnpaid,
    recordReminder,
    deleteInvoice,
  };
};

export const useInvoiceStats = (month: string) => {
  const [stats, setStats] = useState<{
    total: number;
    paidCount: number;
    unpaidCount: number;
    totalAmount: number;
    collectedAmount: number;
    outstandingAmount: number;
    collectionRate: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await billingService.getInvoiceStatsByMonth(month);
        setStats(data);
      } catch (err) {
        console.error('Error fetching invoice stats:', err);
      } finally {
        setLoading(false);
      }
    };

    if (month) {
      fetchStats();
    }
  }, [month]);

  return { stats, loading };
};

export default useInvoices;
