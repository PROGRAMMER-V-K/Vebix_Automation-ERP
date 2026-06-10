import { useCallback, useEffect, useState } from 'react';

import { useAuthUser } from '@/contexts/auth-context';
import { isFirebaseConfigured } from '@/lib/firebase';
import {
  subscribeToInvoices,
  subscribeToQuotations,
  subscribeToExpenses,
  addInvoice,
  updateInvoice,
  deleteInvoice,
  addQuotation,
  updateQuotation,
  deleteQuotation,
  convertQuotationToInvoice,
  addExpense,
  updateExpense,
  deleteExpense,
  clearAllFinanceDocuments,
} from '@/lib/finance-firestore';
import {
  Invoice,
  Quotation,
  Expense,
  NewInvoice,
  NewQuotation,
  NewExpense,
} from '@/types/finance';

export function useFinance() {
  const { name: userName } = useAuthUser();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setError('Firebase is not configured. Configure your EXPO_PUBLIC_FIREBASE_* keys.');
      setLoading(false);
      return;
    }

    let unsubInvoices: (() => void) | undefined;
    let unsubQuotes: (() => void) | undefined;
    let unsubExpenses: (() => void) | undefined;

    let loadingInvoices = true;
    let loadingQuotes = true;
    let loadingExpenses = true;

    const checkLoading = () => {
      if (!loadingInvoices && !loadingQuotes && !loadingExpenses) {
        setLoading(false);
      }
    };

    try {
      unsubInvoices = subscribeToInvoices(
        (data) => {
          setInvoices(data);
          loadingInvoices = false;
          checkLoading();
        },
        (err) => {
          setError(err.message);
          loadingInvoices = false;
          checkLoading();
        }
      );

      unsubQuotes = subscribeToQuotations(
        (data) => {
          setQuotations(data);
          loadingQuotes = false;
          checkLoading();
        },
        (err) => {
          setError(err.message);
          loadingQuotes = false;
          checkLoading();
        }
      );

      unsubExpenses = subscribeToExpenses(
        (data) => {
          setExpenses(data);
          loadingExpenses = false;
          checkLoading();
        },
        (err) => {
          setError(err.message);
          loadingExpenses = false;
          checkLoading();
        }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync finance data.');
      setLoading(false);
    }

    return () => {
      unsubInvoices?.();
      unsubQuotes?.();
      unsubExpenses?.();
    };
  }, []);

  // Invoice CRUD Callbacks
  const createInvoice = useCallback(async (item: NewInvoice) => {
    try {
      const id = await addInvoice(item, userName);
      return { ok: true as const, id };
    } catch (err) {
      return {
        ok: false as const,
        message: err instanceof Error ? err.message : 'Failed to create invoice.',
      };
    }
  }, [userName]);

  const editInvoice = useCallback(
    async (id: string, data: Partial<Omit<Invoice, 'id' | 'createdAt' | 'updatedAt' | 'updatedBy'>>) => {
      try {
        await updateInvoice(id, data, userName);
        return { ok: true as const };
      } catch (err) {
        return {
          ok: false as const,
          message: err instanceof Error ? err.message : 'Failed to update invoice.',
        };
      }
    },
    [userName]
  );

  const removeInvoice = useCallback(async (id: string) => {
    try {
      await deleteInvoice(id);
      return { ok: true as const };
    } catch (err) {
      return {
        ok: false as const,
        message: err instanceof Error ? err.message : 'Failed to delete invoice.',
      };
    }
  }, []);

  // Quotation CRUD Callbacks
  const createQuotation = useCallback(async (item: NewQuotation) => {
    try {
      const id = await addQuotation(item, userName);
      return { ok: true as const, id };
    } catch (err) {
      return {
        ok: false as const,
        message: err instanceof Error ? err.message : 'Failed to create quotation.',
      };
    }
  }, [userName]);

  const editQuotation = useCallback(
    async (id: string, data: Partial<Omit<Quotation, 'id' | 'createdAt' | 'updatedAt' | 'updatedBy'>>) => {
      try {
        await updateQuotation(id, data, userName);
        return { ok: true as const };
      } catch (err) {
        return {
          ok: false as const,
          message: err instanceof Error ? err.message : 'Failed to update quotation.',
        };
      }
    },
    [userName]
  );

  const removeQuotation = useCallback(async (id: string) => {
    try {
      await deleteQuotation(id);
      return { ok: true as const };
    } catch (err) {
      return {
        ok: false as const,
        message: err instanceof Error ? err.message : 'Failed to delete quotation.',
      };
    }
  }, []);

  const convertQuote = useCallback(async (quoteId: string) => {
    try {
      const invoiceDocId = await convertQuotationToInvoice(quoteId, userName);
      return { ok: true as const, invoiceDocId };
    } catch (err) {
      return {
        ok: false as const,
        message: err instanceof Error ? err.message : 'Failed to convert quotation.',
      };
    }
  }, [userName]);

  // Expense CRUD Callbacks
  const createExpense = useCallback(async (item: NewExpense) => {
    try {
      const id = await addExpense(item, userName);
      return { ok: true as const, id };
    } catch (err) {
      return {
        ok: false as const,
        message: err instanceof Error ? err.message : 'Failed to log expense.',
      };
    }
  }, [userName]);

  const editExpense = useCallback(
    async (id: string, data: Partial<Omit<Expense, 'id' | 'createdAt' | 'updatedAt' | 'updatedBy'>>) => {
      try {
        await updateExpense(id, data, userName);
        return { ok: true as const };
      } catch (err) {
        return {
          ok: false as const,
          message: err instanceof Error ? err.message : 'Failed to update expense.',
        };
      }
    },
    [userName]
  );

  const removeExpense = useCallback(async (id: string) => {
    try {
      await deleteExpense(id);
      return { ok: true as const };
    } catch (err) {
      return {
        ok: false as const,
        message: err instanceof Error ? err.message : 'Failed to delete expense.',
      };
    }
  }, []);

  const clearAll = useCallback(async () => {
    try {
      const iIds = invoices.map(i => i.id);
      const qIds = quotations.map(q => q.id);
      const eIds = expenses.map(e => e.id);
      await clearAllFinanceDocuments(iIds, qIds, eIds);
      return { ok: true as const };
    } catch (err) {
      return {
        ok: false as const,
        message: err instanceof Error ? err.message : 'Failed to clear database.',
      };
    }
  }, [invoices, quotations, expenses]);

  return {
    invoices,
    quotations,
    expenses,
    loading,
    error,
    createInvoice,
    editInvoice,
    removeInvoice,
    createQuotation,
    editQuotation,
    removeQuotation,
    convertQuote,
    createExpense,
    editExpense,
    removeExpense,
    clearAll,
    isConfigured: isFirebaseConfigured(),
  };
}
