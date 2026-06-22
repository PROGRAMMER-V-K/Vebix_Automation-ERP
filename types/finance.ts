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
  clientAddress?: string;
  clientContact?: string;
  items: LineItem[];
  gstRate: number;     // e.g. 18
  subtotal: number;
  gstAmount: number;
  total: number;
  validUntil: string;  // YYYY-MM-DD
  date: string;        // YYYY-MM-DD
  status: QuotationStatus;
  
  // Extra fields to match PO
  shipToName?: string;
  shipToAddress?: string;
  shipToContact?: string;
  shipToEmail?: string;
  requisitioner?: string;
  shipVia?: string;
  fob?: string;
  shippingTerms?: string;
  shippingAmount?: number;
  otherAmount?: number;
  comments?: string;
  
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
}

export interface Invoice {
  id: string;          // Firestore Doc ID
  invoiceId: string;   // e.g. VEB-2026-001
  clientName: string;
  clientEmail: string;
  clientAddress?: string;
  clientContact?: string;
  items: LineItem[];
  gstRate: number;     // e.g. 18
  subtotal: number;
  gstAmount: number;
  total: number;
  dueDate: string;     // YYYY-MM-DD
  date: string;        // YYYY-MM-DD
  status: InvoiceStatus;
  
  // Extra fields to match PO/Quote
  shipToName?: string;
  shipToAddress?: string;
  shipToContact?: string;
  shipToEmail?: string;
  requisitioner?: string;
  shipVia?: string;
  fob?: string;
  shippingTerms?: string;
  shippingAmount?: number;
  otherAmount?: number;
  comments?: string;
  
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

export type PurchaseOrderStatus = 'Draft' | 'Sent' | 'Approved' | 'Cancelled';

export interface PurchaseOrder {
  id: string;                    // Firestore Document ID
  poId: string;                  // e.g. SE/PO/25-26/01
  date: string;                  // YYYY-MM-DD
  supplierName: string;          // e.g. REL-FZ LLC MOSCOW RUSSIA
  supplierAddress: string;
  supplierContact: string;
  supplierEmail: string;
  supplierGst: string;
  
  shipToName: string;            // e.g. VEBIX AUTOMATION LLP
  shipToAddress: string;
  shipToContact: string;
  shipToEmail: string;
  
  requisitioner: string;         // e.g. Purchase Department
  shipVia: string;               // e.g. Road Transport
  fob: string;                   // e.g. Supplier
  shippingTerms: string;         // e.g. Freight packaging...
  
  items: LineItem[];             // description, quantity, rate, amount
  subtotal: number;
  taxRate: number;               // e.g. 18 (for 18% GST)
  taxAmount: number;
  shippingAmount: number;
  otherAmount: number;
  total: number;
  
  comments: string;              // Comments or Special Instructions
  status: PurchaseOrderStatus;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
}

export type NewPurchaseOrder = Omit<PurchaseOrder, 'id' | 'createdAt' | 'updatedAt' | 'updatedBy'>;

