/**
 * Type declarations and constants for the Finance Management module.
 */

export interface LineItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export type QuotationStatus = 'Draft' | 'Sent' | 'Converted' | 'Expired';
export type InvoiceStatus = 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Cancelled';
export type ExpenseCategory = 'Hardware' | 'Software Subscriptions' | 'Travel' | 'Logistics' | 'Other';

export interface Quotation {
  id: string;          // Firestore Doc ID
  quoteId: string;     // e.g. QTN-2026-001
  clientName: string;
  clientEmail: string;
  items: LineItem[];
  gstRate: number;     // e.g. 18
  subtotal: number;
  gstAmount: number;
  total: number;
  validUntil: string;  // YYYY-MM-DD
  date: string;        // YYYY-MM-DD
  status: QuotationStatus;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
}

export interface Invoice {
  id: string;          // Firestore Doc ID
  invoiceId: string;   // e.g. VEB-2026-001
  clientName: string;
  clientEmail: string;
  items: LineItem[];
  gstRate: number;     // e.g. 18
  subtotal: number;
  gstAmount: number;
  total: number;
  dueDate: string;     // YYYY-MM-DD
  date: string;        // YYYY-MM-DD
  status: InvoiceStatus;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
}

export interface Expense {
  id: string;          // Firestore Doc ID
  title: string;
  amount: number;
  category: ExpenseCategory;
  date: string;        // YYYY-MM-DD
  attachmentUrl: string;
  project: string;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
}

export type NewQuotation = Omit<Quotation, 'id' | 'createdAt' | 'updatedAt' | 'updatedBy'>;
export type NewInvoice = Omit<Invoice, 'id' | 'createdAt' | 'updatedAt' | 'updatedBy'>;
export type NewExpense = Omit<Expense, 'id' | 'createdAt' | 'updatedAt' | 'updatedBy'>;

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Hardware',
  'Software Subscriptions',
  'Travel',
  'Logistics',
  'Other',
];

export const INVOICE_STATUSES: InvoiceStatus[] = [
  'Draft',
  'Sent',
  'Paid',
  'Overdue',
  'Cancelled',
];

export const QUOTATION_STATUSES: QuotationStatus[] = [
  'Draft',
  'Sent',
  'Converted',
  'Expired',
];
