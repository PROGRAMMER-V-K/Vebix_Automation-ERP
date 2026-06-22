import { useCallback, useEffect, useState } from 'react';

import { useAuthUser } from '@/contexts/auth-context';
import { isFirebaseConfigured } from '@/lib/firebase';
import {
  subscribeToInvoices,
  subscribeToQuotations,
  subscribeToExpenses,
  subscribeToPurchaseOrders,
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
  addPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
  clearAllFinanceDocuments,
} from '@/lib/finance-firestore';
import {
  Invoice,
  Quotation,
  Expense,
  PurchaseOrder,
  NewInvoice,
  NewQuotation,
  NewExpense,
  NewPurchaseOrder,
} from '@/types/finance';

export function useFinance() {
  const { name: userName } = useAuthUser();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
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
    let unsubPurchaseOrders: (() => void) | undefined;

    let loadingInvoices = true;
    let loadingQuotes = true;
    let loadingExpenses = true;
    let loadingPurchaseOrders = true;

    const checkLoading = () => {
      if (!loadingInvoices && !loadingQuotes && !loadingExpenses && !loadingPurchaseOrders) {
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

      unsubPurchaseOrders = subscribeToPurchaseOrders(
        (data) => {
          setPurchaseOrders(data);
          loadingPurchaseOrders = false;
          checkLoading();
        },
        (err) => {
          setError(err.message);
          loadingPurchaseOrders = false;
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
      unsubPurchaseOrders?.();
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

  // Purchase Order CRUD Callbacks
  const createPurchaseOrder = useCallback(async (item: NewPurchaseOrder) => {
    try {
      const id = await addPurchaseOrder(item, userName);
      return { ok: true as const, id };
    } catch (err) {
      return {
        ok: false as const,
        message: err instanceof Error ? err.message : 'Failed to create purchase order.',
      };
    }
  }, [userName]);

  const editPurchaseOrder = useCallback(
    async (id: string, data: Partial<Omit<PurchaseOrder, 'id' | 'createdAt' | 'updatedAt' | 'updatedBy'>>) => {
      try {
        await updatePurchaseOrder(id, data, userName);
        return { ok: true as const };
      } catch (err) {
        return {
          ok: false as const,
          message: err instanceof Error ? err.message : 'Failed to update purchase order.',
        };
      }
    },
    [userName]
  );

  const removePurchaseOrder = useCallback(async (id: string) => {
    try {
      await deletePurchaseOrder(id);
      return { ok: true as const };
    } catch (err) {
      return {
        ok: false as const,
        message: err instanceof Error ? err.message : 'Failed to delete purchase order.',
      };
    }
  }, []);

  const clearAll = useCallback(async () => {
    try {
      const iIds = invoices.map(i => i.id);
      const qIds = quotations.map(q => q.id);
      const eIds = expenses.map(e => e.id);
      const poIds = purchaseOrders.map(po => po.id);
      await clearAllFinanceDocuments(iIds, qIds, eIds, poIds);
      return { ok: true as const };
    } catch (err) {
      return {
        ok: false as const,
        message: err instanceof Error ? err.message : 'Failed to clear database.',
      };
    }
  }, [invoices, quotations, expenses, purchaseOrders]);

  return {
    invoices,
    quotations,
    expenses,
    purchaseOrders,
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
    createPurchaseOrder,
    editPurchaseOrder,
    removePurchaseOrder,
    clearAll,
    isConfigured: isFirebaseConfigured(),
  };
}
