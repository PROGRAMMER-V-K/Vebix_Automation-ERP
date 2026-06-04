/**
 * Inventory item types stored in Firestore.
 */
export interface InventoryItem {
  id: string;          // Firestore Document ID
  name: string;        // Product Name
  invoiceNo: string;   // Invoice Number
  project: string;     // Project in which it is used
  price: number;       // Price of the product
  code: string;        // Product code (e.g. E23447 or INV-10023)
  category: string;    // Product Category (e.g. Device, Electronic, Cooking)
  quantity: number;    // Quantity of products in stock
  date: string;        // Date associated with invoice/entry (Format: YYYY-MM-DD)
  createdAt: string;   // ISO String timestamp
  updatedAt: string;   // ISO String timestamp
  updatedBy: string;   // Name of the user who created/modified this item
}

export type NewInventoryItem = Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt' | 'updatedBy'>;
