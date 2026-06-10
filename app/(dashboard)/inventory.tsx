/**
 * Inventory screen route.
 * Displays the main inventory list page, "+ Add product" action, search,
 * and the Add/Edit Product popup modal.
 */
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { AddProductModal } from '@/components/inventory/add-product-modal';
import { GoogleSheetImportModal } from '@/components/inventory/google-sheet-import-modal';
import { InventoryAnalytics } from '@/components/inventory/inventory-analytics';
import { InventoryTableCard } from '@/components/inventory/inventory-table-card';
import { HorizonColors } from '@/constants/horizon';
import { useInventory } from '@/hooks/use-inventory';
import { InventoryItem, NewInventoryItem } from '@/types/inventory';

export default function InventoryScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const { inventoryItems, loading, error, addItem, updateItem, deleteItem, importItems, isConfigured } = useInventory();
  const [modalVisible, setModalVisible] = useState(false);
  const [sheetModalVisible, setSheetModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(true);
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

 



  async function handleSaveProduct(itemData: NewInventoryItem | Partial<InventoryItem>) {
    if (editingItem) {
      const res = await updateItem(editingItem.id, itemData);
      if (res.ok) {
        Alert.alert('Success', 'Product updated successfully.');
        setEditingItem(null);
        return { ok: true };
      } else {
        return { ok: false, message: res.message };
      }
    } else {
      const res = await addItem(itemData as NewInventoryItem);
      if (res.ok) {
        Alert.alert('Success', 'Product added successfully.');
        return { ok: true };
      } else {
        return { ok: false, message: res.message };
      }
    }
  }

  function handleEditPress(item: InventoryItem) {
    setEditingItem(item);
    setModalVisible(true);
  }

  async function handleDeleteConfirm(id: string) {
    const res = await deleteItem(id);
    if (!res.ok) {
      Alert.alert('Error', res.message || 'Failed to delete product.');
    } else {
      Alert.alert('Success', 'Product deleted successfully.');
    }
  }

  function handleOpenAddModal() {
    setEditingItem(null);
    setModalVisible(true);
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={HorizonColors.primary} />
      </View>
    );
  }

  if (!isConfigured || error) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Inventory List</Text>
        <View style={styles.errorCard}>
          <MaterialIcons name="cloud-off" size={32} color={HorizonColors.warning} />
          <Text style={styles.errorTitle}>Firebase Config Required</Text>
          <Text style={styles.errorText}>
            {error ?? 'Configure your EXPO_PUBLIC_FIREBASE_* environment variables to use the Inventory management module.'}
          </Text>
        </View>
      </View>
    );
  }

  async function handleImportProducts(items: NewInventoryItem[]) {
    return await importItems(items);
  }

  return (
    <View style={styles.container}>
      {/* Header Area */}
      <View style={isDesktop ? styles.headerWide : styles.headerMobile}>
        <View>
          <Text style={styles.title}>Inventory List</Text>
          <Text style={styles.subtitle}>
            Track products, invoices, prices, and project details in real-time.
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.actionHeaderScroll}
          contentContainerStyle={styles.actionHeaderRow}
        >
          {/* Toggle Analytics Button */}
          <Pressable
            style={({ pressed }) => [
              styles.analyticsToggleBtn,
              showAnalytics && styles.analyticsToggleBtnActive,
              pressed && styles.btnPressed,
            ]}
            onPress={() => setShowAnalytics(!showAnalytics)}>
            <MaterialIcons
              name="bar-chart"
              size={18}
              color={showAnalytics ? HorizonColors.primary : HorizonColors.text}
            />
            <Text style={[styles.analyticsToggleBtnText, showAnalytics && { color: HorizonColors.primary }]}>
              Analytics
            </Text>
          </Pressable>

          {/* Import Google Sheet Button */}
          <Pressable
            style={({ pressed }) => [
              styles.importBtn,
              pressed && styles.importBtnPressed,
            ]}
            onPress={() => setSheetModalVisible(true)}>
            <MaterialIcons name="cloud-download" size={18} color={HorizonColors.success} />
            <Text style={styles.importBtnText}>Import sheet</Text>
          </Pressable>

          {/* Add Product Button */}
          <Pressable
            style={({ pressed }) => [
              styles.addProductBtn,
              pressed && styles.addProductBtnPressed,
            ]}
            onPress={handleOpenAddModal}>
            <MaterialIcons name="add" size={18} color={HorizonColors.white} />
            <Text style={styles.addProductBtnText}>Add product</Text>
          </Pressable>
        </ScrollView>
      </View>

      {/* Analytics Dashboard */}
      {showAnalytics && (
        <InventoryAnalytics
          items={filteredItems}
          selectedProjects={selectedProjects}
          onSelectedProjectsChange={setSelectedProjects}
          selectedMonth={selectedMonth}
          onSelectedMonthChange={setSelectedMonth}
        />
      )}

      {/* Main Table Card */}
      <InventoryTableCard
        items={inventoryItems}
        onEdit={handleEditPress}
        onDelete={handleDeleteConfirm}
        onFilteredItemsChange={setFilteredItems}
        selectedProjects={selectedProjects}
        onSelectedProjectsChange={setSelectedProjects}
        selectedMonth={selectedMonth}
        onSelectedMonthChange={setSelectedMonth}
      />

      {/* Add / Edit Popup Modal */}
      <AddProductModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setEditingItem(null);
        }}
        onSave={handleSaveProduct}
        editingItem={editingItem}
      />

      {/* Google Sheet Import Modal */}
      <GoogleSheetImportModal
        visible={sheetModalVisible}
        onClose={() => setSheetModalVisible(false)}
        existingItems={inventoryItems}
        onImport={handleImportProducts}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  headerWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 8,
  },
  headerMobile: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 12,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: HorizonColors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: HorizonColors.textMuted,
    lineHeight: 20,
  },
  actionHeaderScroll: {
    flexGrow: 0,
  },
  actionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 4,
  },
  importBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: HorizonColors.success,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#FAFBFD',
  },
  importBtnPressed: {
    backgroundColor: HorizonColors.successLight,
    opacity: 0.9,
  },
  importBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: HorizonColors.success,
  },
  addProductBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 8,
    paddingVertical: 11,
    paddingHorizontal: 16,
    backgroundColor: HorizonColors.primary,
  },
  addProductBtnPressed: {
    backgroundColor: HorizonColors.primaryDark,
    opacity: 0.9,
  },
  addProductBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: HorizonColors.white,
  },
  errorCard: {
    borderWidth: 1,
    borderColor: HorizonColors.cardBorder,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    backgroundColor: HorizonColors.warningLight,
    marginTop: 20,
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: HorizonColors.text,
  },
  errorText: {
    fontSize: 14,
    color: HorizonColors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  analyticsToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: HorizonColors.border,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#FAFBFD',
  },
  analyticsToggleBtnActive: {
    borderColor: HorizonColors.primary,
    backgroundColor: HorizonColors.primaryLight,
  },
  analyticsToggleBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: HorizonColors.text,
  },

  btnPressed: {
    opacity: 0.85,
  },
  clearAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#FAFBFD',
  },
  clearAllBtnPressed: {
    backgroundColor: '#FEE2E2',
    opacity: 0.9,
  },
  clearAllBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
});
