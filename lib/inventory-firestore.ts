/**
 * Firestore CRUD for inventory items.
 * Collection path: inventory
 */
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from '@firebase/firestore';

import { getFirestoreDb } from '@/lib/firebase';
import { InventoryItem, NewInventoryItem } from '@/types/inventory';

function inventoryCollection() {
  return collection(getFirestoreDb(), 'inventory');
}

function inventoryDoc(id: string) {
  return doc(getFirestoreDb(), 'inventory', id);
}

function mapDocToItem(id: string, data: Record<string, any>): InventoryItem {
  let parsedDate = '';
  if (data.date) {
    if (typeof data.date === 'object' && typeof data.date.toDate === 'function') {
      try {
        parsedDate = data.date.toDate().toISOString().split('T')[0];
      } catch (e) {
        parsedDate = new Date().toISOString().split('T')[0];
      }
    } else if (typeof data.date === 'string') {
      parsedDate = data.date;
    } else if (data.date.seconds) {
      try {
        parsedDate = new Date(data.date.seconds * 1000).toISOString().split('T')[0];
      } catch (e) {
        parsedDate = new Date().toISOString().split('T')[0];
      }
    } else {
      parsedDate = String(data.date);
    }
  } else {
    // Fallback to createdAt if date is missing
    if (data.createdAt) {
      if (typeof data.createdAt === 'object' && typeof data.createdAt.toDate === 'function') {
        try {
          parsedDate = data.createdAt.toDate().toISOString().split('T')[0];
        } catch (e) {
          parsedDate = new Date().toISOString().split('T')[0];
        }
      } else if (data.createdAt.seconds) {
        try {
          parsedDate = new Date(data.createdAt.seconds * 1000).toISOString().split('T')[0];
        } catch (e) {
          parsedDate = new Date().toISOString().split('T')[0];
        }
      } else {
        parsedDate = String(data.createdAt).split('T')[0];
      }
    } else {
      parsedDate = new Date().toISOString().split('T')[0];
    }
  }

  return {
    id,
    name: (data.name as string) ?? '',
    invoiceNo: (data.invoiceNo as string) ?? '',
    project: (data.project as string) ?? '',
    price: Number(data.price ?? 0),
    code: (data.code as string) ?? '',
    location: (data.location as string) ?? (data.category as string) ?? 'IN',
    quantity: Number(data.quantity ?? 1),
    date: parsedDate,
    createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : String(data.createdAt)) : '',
    updatedAt: data.updatedAt ? (data.updatedAt.toDate ? data.updatedAt.toDate().toISOString() : String(data.updatedAt)) : '',
    updatedBy: (data.updatedBy as string) ?? 'System',
  };
}

export function subscribeToInventory(
  onData: (items: InventoryItem[]) => void,
  onError: (error: Error) => void,
) {
  const q = query(inventoryCollection(), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => mapDocToItem(d.id, d.data()));
      onData(items);
    },
    (error) => onError(error),
  );
}

export async function addInventoryItem(item: NewInventoryItem, updatedBy: string): Promise<string> {
  const docRef = await addDoc(inventoryCollection(), {
    name: item.name,
    invoiceNo: item.invoiceNo,
    project: item.project,
    price: Number(item.price),
    code: item.code || `INV-${Math.floor(10000 + Math.random() * 90000)}`,
    location: item.location || 'IN',
    quantity: Number(item.quantity ?? 1),
    date: item.date || new Date().toISOString().split('T')[0],
    updatedBy,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateInventoryItem(
  id: string,
  data: Partial<Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt' | 'updatedBy'>>,
  updatedBy: string,
): Promise<void> {
  const updates: Record<string, any> = {
    ...data,
    updatedBy,
    updatedAt: serverTimestamp(),
  };
  
  // Clean undefined properties
  Object.keys(updates).forEach((key) => {
    if (updates[key] === undefined) {
      delete updates[key];
    }
  });

  await updateDoc(inventoryDoc(id), updates);
}

export async function deleteInventoryItem(id: string): Promise<void> {
  await deleteDoc(inventoryDoc(id));
}

export async function clearAllInventoryItems(ids: string[]): Promise<void> {
  const db = getFirestoreDb();
  const chunks = [];
  
  for (let i = 0; i < ids.length; i += 450) {
    chunks.push(ids.slice(i, i + 450));
  }

  for (const chunk of chunks) {
    const batch = writeBatch(db);
    for (const id of chunk) {
      batch.delete(doc(db, 'inventory', id));
    }
    await batch.commit();
  }
}

export async function importInventoryItems(
  items: NewInventoryItem[],
  updatedBy: string,
): Promise<void> {
  const db = getFirestoreDb();
  const chunks = [];
  
  for (let i = 0; i < items.length; i += 450) {
    chunks.push(items.slice(i, i + 450));
  }

  for (const chunk of chunks) {
    const batch = writeBatch(db);
    for (const item of chunk) {
      const docRef = doc(collection(db, 'inventory'));
      batch.set(docRef, {
        name: item.name,
        invoiceNo: item.invoiceNo,
        project: item.project,
        price: Number(item.price),
        code: item.code || `INV-${Math.floor(10000 + Math.random() * 90000)}`,
        location: item.location || 'IN',
        quantity: Number(item.quantity ?? 1),
        date: item.date || new Date().toISOString().split('T')[0],
        updatedBy,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    await batch.commit();
  }
}
