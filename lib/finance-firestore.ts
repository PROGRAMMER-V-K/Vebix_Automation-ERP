import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from '@firebase/firestore';

import { getFirestoreDb } from '@/lib/firebase';
import {
  Expense,
  Invoice,
  NewExpense,
  NewInvoice,
  NewPurchaseOrder,
  NewQuotation,
  PurchaseOrder,
  Quotation,
} from '@/types/finance';

// Helper date parsing (same standard as inventory)
function parseTimestampToIsoDate(timestamp: any): string {
  if (!timestamp) return new Date().toISOString().split('T')[0];
  if (typeof timestamp === 'object' && typeof timestamp.toDate === 'function') {
    return timestamp.toDate().toISOString().split('T')[0];
  }
  if (timestamp.seconds) {
    return new Date(timestamp.seconds * 1000).toISOString().split('T')[0];
  }
  return String(timestamp).split('T')[0];
}

// -------------------------------------------------------------
// INVOICES FIRESTORE LAYER
// -------------------------------------------------------------

function invoicesCollection() {
  return collection(getFirestoreDb(), 'invoices');
}

function invoiceDoc(id: string) {
  return doc(getFirestoreDb(), 'invoices', id);
}

export async function generateNextInvoiceId(): Promise<string> {
  const q = query(invoicesCollection(), orderBy('invoiceId', 'desc'), limit(1));
  const snap = await getDocs(q);
  const currentYear = new Date().getFullYear();
  if (snap.empty) {
    return `VEB-${currentYear}-001`;
  }
  const lastDoc = snap.docs[0].data();
  const lastId = lastDoc.invoiceId as string;
  const parts = lastId.split('-');
  if (parts.length === 3) {
    const lastNum = parseInt(parts[2], 10);
    const nextNum = isNaN(lastNum) ? 1 : lastNum + 1;
    return `VEB-${currentYear}-${String(nextNum).padStart(3, '0')}`;
  }
  return `VEB-${currentYear}-001`;
}

export function subscribeToInvoices(
  onData: (items: Invoice[]) => void,
  onError: (error: Error) => void,
) {
  const q = query(invoicesCollection(), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          invoiceId: data.invoiceId ?? '',
          clientName: data.clientName ?? '',
          clientEmail: data.clientEmail ?? '',
          clientAddress: data.clientAddress ?? '',
          clientContact: data.clientContact ?? '',
          items: data.items ?? [],
          gstRate: Number(data.gstRate ?? 18),
          subtotal: Number(data.subtotal ?? 0),
          gstAmount: Number(data.gstAmount ?? 0),
          total: Number(data.total ?? 0),
          dueDate: data.dueDate ?? '',
          date: data.date ?? '',
          status: data.status ?? 'Draft',
          shipToName: data.shipToName ?? 'Vebix AUTOMATION',
          shipToAddress: data.shipToAddress ?? '',
          shipToContact: data.shipToContact ?? '',
          shipToEmail: data.shipToEmail ?? '',
          requisitioner: data.requisitioner ?? '',
          shipVia: data.shipVia ?? '',
          fob: data.fob ?? '',
          shippingTerms: data.shippingTerms ?? '',
          shippingAmount: Number(data.shippingAmount ?? 0),
          otherAmount: Number(data.otherAmount ?? 0),
          comments: data.comments ?? '',
          createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : String(data.createdAt)) : '',
          updatedAt: data.updatedAt ? (data.updatedAt.toDate ? data.updatedAt.toDate().toISOString() : String(data.updatedAt)) : '',
          updatedBy: data.updatedBy ?? 'System',
        } as Invoice;
      });
      onData(items);
    },
    (error) => onError(error),
  );
}

export async function addInvoice(item: NewInvoice, updatedBy: string): Promise<string> {
  const invoiceId = item.invoiceId || (await generateNextInvoiceId());
  const docRef = await addDoc(invoicesCollection(), {
    ...item,
    invoiceId,
    updatedBy,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateInvoice(
  id: string,
  data: Partial<Omit<Invoice, 'id' | 'createdAt' | 'updatedAt' | 'updatedBy'>>,
  updatedBy: string,
): Promise<void> {
  const updates: Record<string, any> = {
    ...data,
    updatedBy,
    updatedAt: serverTimestamp(),
  };
  Object.keys(updates).forEach((key) => {
    if (updates[key] === undefined) delete updates[key];
  });
  await updateDoc(invoiceDoc(id), updates);
}

export async function deleteInvoice(id: string): Promise<void> {
  await deleteDoc(invoiceDoc(id));
}

// -------------------------------------------------------------
// QUOTATIONS FIRESTORE LAYER
// -------------------------------------------------------------

function quotationsCollection() {
  return collection(getFirestoreDb(), 'quotations');
}

function quotationDoc(id: string) {
  return doc(getFirestoreDb(), 'quotations', id);
}

export async function generateNextQuotationId(): Promise<string> {
  const q = query(quotationsCollection(), orderBy('quoteId', 'desc'), limit(1));
  const snap = await getDocs(q);
  const currentYear = new Date().getFullYear();
  if (snap.empty) {
    return `QTN-${currentYear}-001`;
  }
  const lastDoc = snap.docs[0].data();
  const lastId = lastDoc.quoteId as string;
  const parts = lastId.split('-');
  if (parts.length === 3) {
    const lastNum = parseInt(parts[2], 10);
    const nextNum = isNaN(lastNum) ? 1 : lastNum + 1;
    return `QTN-${currentYear}-${String(nextNum).padStart(3, '0')}`;
  }
  return `QTN-${currentYear}-001`;
}

export function subscribeToQuotations(
  onData: (items: Quotation[]) => void,
  onError: (error: Error) => void,
) {
  const q = query(quotationsCollection(), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          quoteId: data.quoteId ?? '',
          clientName: data.clientName ?? '',
          clientEmail: data.clientEmail ?? '',
          clientAddress: data.clientAddress ?? '',
          clientContact: data.clientContact ?? '',
          items: data.items ?? [],
          gstRate: Number(data.gstRate ?? 18),
          subtotal: Number(data.subtotal ?? 0),
          gstAmount: Number(data.gstAmount ?? 0),
          total: Number(data.total ?? 0),
          validUntil: data.validUntil ?? '',
          date: data.date ?? '',
          status: data.status ?? 'Draft',
          shipToName: data.shipToName ?? 'Vebix AUTOMATION',
          shipToAddress: data.shipToAddress ?? '',
          shipToContact: data.shipToContact ?? '',
          shipToEmail: data.shipToEmail ?? '',
          requisitioner: data.requisitioner ?? '',
          shipVia: data.shipVia ?? '',
          fob: data.fob ?? '',
          shippingTerms: data.shippingTerms ?? '',
          shippingAmount: Number(data.shippingAmount ?? 0),
          otherAmount: Number(data.otherAmount ?? 0),
          comments: data.comments ?? '',
          createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : String(data.createdAt)) : '',
          updatedAt: data.updatedAt ? (data.updatedAt.toDate ? data.updatedAt.toDate().toISOString() : String(data.updatedAt)) : '',
          updatedBy: data.updatedBy ?? 'System',
        } as Quotation;
      });
      onData(items);
    },
    (error) => onError(error),
  );
}

export async function addQuotation(item: NewQuotation, updatedBy: string): Promise<string> {
  const quoteId = item.quoteId || (await generateNextQuotationId());
  const docRef = await addDoc(quotationsCollection(), {
    ...item,
    quoteId,
    updatedBy,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateQuotation(
  id: string,
  data: Partial<Omit<Quotation, 'id' | 'createdAt' | 'updatedAt' | 'updatedBy'>>,
  updatedBy: string,
): Promise<void> {
  const updates: Record<string, any> = {
    ...data,
    updatedBy,
    updatedAt: serverTimestamp(),
  };
  Object.keys(updates).forEach((key) => {
    if (updates[key] === undefined) delete updates[key];
  });
  await updateDoc(quotationDoc(id), updates);
}

export async function deleteQuotation(id: string): Promise<void> {
  await deleteDoc(quotationDoc(id));
}

/**
 * Converts a Quotation directly to an Invoice draft
 */
export async function convertQuotationToInvoice(quoteId: string, updatedBy: string): Promise<string> {
  const qDocRef = quotationDoc(quoteId);
  const qSnap = await getDoc(qDocRef);
  if (!qSnap.exists()) {
    throw new Error('Quotation does not exist.');
  }

  const quoteData = qSnap.data();

  // Generate next sequential Invoice ID
  const nextInvoiceId = await generateNextInvoiceId();

  // Create Invoice draft object
  const invoiceData = {
    invoiceId: nextInvoiceId,
    clientName: quoteData.clientName ?? '',
    clientEmail: quoteData.clientEmail ?? '',
    clientAddress: quoteData.clientAddress ?? '',
    clientContact: quoteData.clientContact ?? '',
    shipToName: quoteData.shipToName ?? 'Vebix AUTOMATION',
    shipToAddress: quoteData.shipToAddress ?? '',
    shipToContact: quoteData.shipToContact ?? '',
    shipToEmail: quoteData.shipToEmail ?? '',
    requisitioner: quoteData.requisitioner ?? '',
    shipVia: quoteData.shipVia ?? '',
    fob: quoteData.fob ?? '',
    shippingTerms: quoteData.shippingTerms ?? '',
    items: quoteData.items ?? [],
    gstRate: Number(quoteData.gstRate ?? 18),
    subtotal: Number(quoteData.subtotal ?? 0),
    gstAmount: Number(quoteData.gstAmount ?? 0),
    shippingAmount: Number(quoteData.shippingAmount ?? 0),
    otherAmount: Number(quoteData.otherAmount ?? 0),
    total: Number(quoteData.total ?? 0),
    comments: quoteData.comments ?? '',
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 Days Default
    date: new Date().toISOString().split('T')[0],
    status: 'Draft' as const,
    updatedBy,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  // Add the Invoice
  const invoiceRef = await addDoc(collection(getFirestoreDb(), 'invoices'), invoiceData);

  // Update Quotation status to 'Converted'
  await updateDoc(qDocRef, {
    status: 'Converted',
    updatedAt: serverTimestamp(),
    updatedBy,
  });

  return invoiceRef.id;
}

// -------------------------------------------------------------
// EXPENSES FIRESTORE LAYER
// -------------------------------------------------------------

function expensesCollection() {
  return collection(getFirestoreDb(), 'expenses');
}

function expenseDoc(id: string) {
  return doc(getFirestoreDb(), 'expenses', id);
}

export function subscribeToExpenses(
  onData: (items: Expense[]) => void,
  onError: (error: Error) => void,
) {
  const q = query(expensesCollection(), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          title: data.title ?? '',
          amount: Number(data.amount ?? 0),
          category: data.category ?? 'Other',
          date: data.date ?? '',
          attachmentUrl: data.attachmentUrl ?? '',
          project: data.project ?? '',
          createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : String(data.createdAt)) : '',
          updatedAt: data.updatedAt ? (data.updatedAt.toDate ? data.updatedAt.toDate().toISOString() : String(data.updatedAt)) : '',
          updatedBy: data.updatedBy ?? 'System',
        } as Expense;
      });
      onData(items);
    },
    (error) => onError(error),
  );
}

export async function addExpense(item: NewExpense, updatedBy: string): Promise<string> {
  const docRef = await addDoc(expensesCollection(), {
    ...item,
    updatedBy,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateExpense(
  id: string,
  data: Partial<Omit<Expense, 'id' | 'createdAt' | 'updatedAt' | 'updatedBy'>>,
  updatedBy: string,
): Promise<void> {
  const updates: Record<string, any> = {
    ...data,
    updatedBy,
    updatedAt: serverTimestamp(),
  };
  Object.keys(updates).forEach((key) => {
    if (updates[key] === undefined) delete updates[key];
  });
  await updateDoc(expenseDoc(id), updates);
}

export async function deleteExpense(id: string): Promise<void> {
  await deleteDoc(expenseDoc(id));
}

// -------------------------------------------------------------
// PURCHASE ORDERS FIRESTORE LAYER
// -------------------------------------------------------------

function purchaseOrdersCollection() {
  return collection(getFirestoreDb(), 'purchase_orders');
}

function purchaseOrderDoc(id: string) {
  return doc(getFirestoreDb(), 'purchase_orders', id);
}

function getIndianFiscalYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-11
  let startYear = year;
  let endYear = year + 1;

  if (month < 3) { // Jan, Feb, Mar (fiscal year started last year)
    startYear = year - 1;
    endYear = year;
  }

  const startYearStr = String(startYear).slice(-2);
  const endYearStr = String(endYear).slice(-2);
  return `${startYearStr}-${endYearStr}`;
}

export async function generateNextPurchaseOrderId(): Promise<string> {
  const fiscalYear = getIndianFiscalYear();
  const q = query(
    purchaseOrdersCollection(),
    orderBy('poId', 'desc'),
    limit(20) // Search recent to find current fiscal year sequences
  );
  const snap = await getDocs(q);
  if (snap.empty) {
    return `SE/PO/${fiscalYear}/01`;
  }

  // Find the highest sequence number for the CURRENT fiscal year
  let maxSeqNum = 0;
  for (const d of snap.docs) {
    const poId = d.data().poId as string;
    // Format should be SE/PO/YY-YY/NN
    const parts = poId.split('/');
    if (parts.length === 4 && parts[2] === fiscalYear) {
      const seq = parseInt(parts[3], 10);
      if (!isNaN(seq) && seq > maxSeqNum) {
        maxSeqNum = seq;
      }
    }
  }

  const nextNum = maxSeqNum + 1;
  return `SE/PO/${fiscalYear}/${String(nextNum).padStart(2, '0')}`;
}

export function subscribeToPurchaseOrders(
  onData: (items: PurchaseOrder[]) => void,
  onError: (error: Error) => void,
) {
  const q = query(purchaseOrdersCollection(), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          poId: data.poId ?? '',
          date: data.date ?? '',
          supplierName: data.supplierName ?? '',
          supplierAddress: data.supplierAddress ?? '',
          supplierContact: data.supplierContact ?? '',
          supplierEmail: data.supplierEmail ?? '',
          supplierGst: data.supplierGst ?? '',

          shipToName: data.shipToName ?? '',
          shipToAddress: data.shipToAddress ?? '',
          shipToContact: data.shipToContact ?? '',
          shipToEmail: data.shipToEmail ?? '',

          requisitioner: data.requisitioner ?? '',
          shipVia: data.shipVia ?? '',
          fob: data.fob ?? '',
          shippingTerms: data.shippingTerms ?? '',

          items: data.items ?? [],
          subtotal: Number(data.subtotal ?? 0),
          taxRate: Number(data.taxRate ?? 18),
          taxAmount: Number(data.taxAmount ?? 0),
          shippingAmount: Number(data.shippingAmount ?? 0),
          otherAmount: Number(data.otherAmount ?? 0),
          total: Number(data.total ?? 0),

          comments: data.comments ?? '',
          status: data.status ?? 'Draft',
          createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : String(data.createdAt)) : '',
          updatedAt: data.updatedAt ? (data.updatedAt.toDate ? data.updatedAt.toDate().toISOString() : String(data.updatedAt)) : '',
          updatedBy: data.updatedBy ?? 'System',
        } as PurchaseOrder;
      });
      onData(items);
    },
    (error) => onError(error),
  );
}

export async function addPurchaseOrder(item: NewPurchaseOrder, updatedBy: string): Promise<string> {
  const docRef = await addDoc(purchaseOrdersCollection(), {
    ...item,
    updatedBy,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updatePurchaseOrder(
  id: string,
  data: Partial<Omit<PurchaseOrder, 'id' | 'createdAt' | 'updatedAt' | 'updatedBy'>>,
  updatedBy: string,
): Promise<void> {
  const updates: Record<string, any> = {
    ...data,
    updatedBy,
    updatedAt: serverTimestamp(),
  };
  Object.keys(updates).forEach((key) => {
    if (updates[key] === undefined) delete updates[key];
  });
  await updateDoc(purchaseOrderDoc(id), updates);
}

export async function deletePurchaseOrder(id: string): Promise<void> {
  await deleteDoc(purchaseOrderDoc(id));
}

// -------------------------------------------------------------
// CLEAR / MASS BATCH OPS (for testing or resets)
// -------------------------------------------------------------

export async function clearAllFinanceDocuments(
  invoiceIds: string[],
  quoteIds: string[],
  expenseIds: string[],
  poIds?: string[],
): Promise<void> {
  const db = getFirestoreDb();
  const batch = writeBatch(db);

  invoiceIds.forEach((id) => {
    batch.delete(doc(db, 'invoices', id));
  });

  quoteIds.forEach((id) => {
    batch.delete(doc(db, 'quotations', id));
  });

  expenseIds.forEach((id) => {
    batch.delete(doc(db, 'expenses', id));
  });

  if (poIds) {
    poIds.forEach((id) => {
      batch.delete(doc(db, 'purchase_orders', id));
    });
  }

  await batch.commit();
}
