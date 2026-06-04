/**
 * Hook for real-time Firestore sync of inventory items and CRUD operations.
 */
import { useCallback, useEffect, useState } from 'react';

import {
  addInventoryItem,
  deleteInventoryItem,
  subscribeToInventory,
  updateInventoryItem,
  importInventoryItems,
} from '@/lib/inventory-firestore';
import { useAuthUser } from '@/contexts/auth-context';
import { isFirebaseConfigured } from '@/lib/firebase';
import { InventoryItem, NewInventoryItem } from '@/types/inventory';

export function useInventory() {
  const { name: userName } = useAuthUser();
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setError(
        'Firebase is not configured. Create a .env file with your EXPO_PUBLIC_FIREBASE_* keys.',
      );
      setLoading(false);
      return;
    }

    let unsubscribe: (() => void) | undefined;

    async function start() {
      try {
        unsubscribe = subscribeToInventory(
          (items) => {
            setInventoryItems(items);
            setError(null);
            setLoading(false);
          },
          (err) => {
            setError(err.message);
            setLoading(false);
          },
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load inventory.');
        setLoading(false);
      }
    }

    start();

    return () => {
      unsubscribe?.();
    };
  }, []);

  const addItem = useCallback(async (item: NewInventoryItem) => {
    try {
      const id = await addInventoryItem(item, userName);
      return { ok: true as const, id };
    } catch (err) {
      return {
        ok: false as const,
        message: err instanceof Error ? err.message : 'Failed to add inventory item.',
      };
    }
  }, [userName]);

  const updateItem = useCallback(
    async (id: string, data: Partial<Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt' | 'updatedBy'>>) => {
      try {
        await updateInventoryItem(id, data, userName);
        return { ok: true as const };
      } catch (err) {
        return {
          ok: false as const,
          message: err instanceof Error ? err.message : 'Failed to update inventory item.',
        };
      }
    },
    [userName],
  );

  const deleteItem = useCallback(async (id: string) => {
    try {
      await deleteInventoryItem(id);
      return { ok: true as const };
    } catch (err) {
      return {
        ok: false as const,
        message: err instanceof Error ? err.message : 'Failed to delete inventory item.',
      };
    }
  }, []);

  const importItems = useCallback(async (items: NewInventoryItem[]) => {
    try {
      await importInventoryItems(items, userName);
      return { ok: true as const };
    } catch (err) {
      return {
        ok: false as const,
        message: err instanceof Error ? err.message : 'Failed to import inventory items.',
      };
    }
  }, [userName]);

  return {
    inventoryItems,
    loading,
    error,
    addItem,
    updateItem,
    deleteItem,
    importItems,
    isConfigured: isFirebaseConfigured(),
  };
}
