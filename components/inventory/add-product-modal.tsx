/**
 * Modal popup to add or edit an inventory product.
 * Fields: Product Name, Invoice No, Project, Price, Category, Quantity.
 */
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { HorizonColors } from '@/constants/horizon';
import { InventoryItem, NewInventoryItem } from '@/types/inventory';

const LOCATIONS = ['IN', 'OUT'];

// Helper to get today's date formatted as DD/MM/YYYY
function getTodayUserFormatted(): string {
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, '0');
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const yyyy = today.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

// Converts YYYY-MM-DD to DD/MM/YYYY
function toUserDateFormat(isoDate: string): string {
  if (!isoDate) return '';
  const parts = isoDate.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return isoDate;
}

// Converts DD/MM/YYYY to YYYY-MM-DD
function toDatabaseDateFormat(userDate: string): string {
  if (!userDate) return '';
  const parts = userDate.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return userDate;
}

type AddProductModalProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (item: NewInventoryItem | Partial<InventoryItem>) => Promise<{ ok: boolean; message?: string }>;
  editingItem: InventoryItem | null;
};

export function AddProductModal({
  visible,
  onClose,
  onSave,
  editingItem,
}: AddProductModalProps) {
  const [name, setName] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [date, setDate] = useState('');
  const [project, setProject] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [location, setLocation] = useState('IN');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Sync editing item
  useEffect(() => {
    if (editingItem) {
      setName(editingItem.name);
      setInvoiceNo(editingItem.invoiceNo);
      setDate(toUserDateFormat(editingItem.date));
      setProject(editingItem.project);
      setPrice(String(editingItem.price));
      setQuantity(String(editingItem.quantity));
      setLocation(editingItem.location || 'IN');
    } else {
      setName('');
      setInvoiceNo('');
      setDate(getTodayUserFormatted());
      setProject('');
      setPrice('');
      setQuantity('1');
      setLocation('IN');
    }
    setErrors({});
  }, [editingItem, visible]);

  function validate(): boolean {
    const nextErrors: Record<string, string> = {};
    if (!name.trim()) nextErrors.name = 'Product name is required';
    if (!invoiceNo.trim()) nextErrors.invoiceNo = 'Invoice number is required';
    if (!project.trim()) nextErrors.project = 'Project is required';

    if (!date.trim()) {
      nextErrors.date = 'Date is required';
    } else if (!/^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/.test(date.trim())) {
      nextErrors.date = 'Date format must be DD/MM/YYYY';
    }

    const parsedPrice = parseFloat(price);
    if (!price.trim()) {
      nextErrors.price = 'Price is required';
    } else if (isNaN(parsedPrice) || parsedPrice < 0) {
      nextErrors.price = 'Price must be a valid positive number';
    }

    const parsedQty = parseInt(quantity, 10);
    if (!quantity.trim()) {
      nextErrors.quantity = 'Quantity is required';
    } else if (isNaN(parsedQty) || parsedQty <= 0) {
      nextErrors.quantity = 'Quantity must be a positive integer';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;

    setSaving(true);
    const itemData = {
      name: name.trim(),
      invoiceNo: invoiceNo.trim(),
      project: project.trim(),
      price: parseFloat(price),
      quantity: parseInt(quantity, 10),
      location,
      code: editingItem?.code || `INV-${Math.floor(10000 + Math.random() * 90000)}`,
      date: toDatabaseDateFormat(date.trim()),
    };

    const res = await onSave(itemData);
    setSaving(false);

    if (res.ok) {
      onClose();
    } else {
      setErrors({ form: res.message || 'An error occurred while saving.' });
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {editingItem ? 'Edit Product' : 'Add New Product'}
            </Text>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <MaterialIcons name="close" size={22} color={HorizonColors.text} />
            </Pressable>
          </View>

          {/* Form Content */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}>

            {errors.form ? (
              <View style={styles.formErrorBox}>
                <MaterialIcons name="error-outline" size={18} color="#DC2626" />
                <Text style={styles.formErrorText}>{errors.form}</Text>
              </View>
            ) : null}

            {/* Product Name */}
            <View style={styles.field}>
              <Text style={styles.label}>Product Name *</Text>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                placeholder="Enter product name"
                placeholderTextColor={HorizonColors.textMuted}
                value={name}
                onChangeText={(val) => {
                  setName(val);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                }}
              />
              {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
            </View>

            {/* Invoice No & Date Row */}
            <View style={styles.row}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>Invoice Number *</Text>
                <TextInput
                  style={[styles.input, errors.invoiceNo && styles.inputError]}
                  placeholder="Enter invoice number"
                  placeholderTextColor={HorizonColors.textMuted}
                  value={invoiceNo}
                  onChangeText={(val) => {
                    setInvoiceNo(val);
                    if (errors.invoiceNo) setErrors((prev) => ({ ...prev, invoiceNo: '' }));
                  }}
                />
                {errors.invoiceNo ? <Text style={styles.errorText}>{errors.invoiceNo}</Text> : null}
              </View>

              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>Date (DD/MM/YYYY) *</Text>
                <TextInput
                  style={[styles.input, errors.date && styles.inputError]}
                  placeholder="DD/MM/YYYY"
                  placeholderTextColor={HorizonColors.textMuted}
                  value={date}
                  onChangeText={(val) => {
                    setDate(val);
                    if (errors.date) setErrors((prev) => ({ ...prev, date: '' }));
                  }}
                />
                {errors.date ? <Text style={styles.errorText}>{errors.date}</Text> : null}
              </View>
            </View>

            {/* Project */}
            <View style={styles.field}>
              <Text style={styles.label}>Project Used In *</Text>
              <TextInput
                style={[styles.input, errors.project && styles.inputError]}
                placeholder="Enter project name or ID"
                placeholderTextColor={HorizonColors.textMuted}
                value={project}
                onChangeText={(val) => {
                  setProject(val);
                  if (errors.project) setErrors((prev) => ({ ...prev, project: '' }));
                }}
              />
              {errors.project ? <Text style={styles.errorText}>{errors.project}</Text> : null}
            </View>

            {/* Price & Quantity Row */}
            <View style={styles.row}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>Price *</Text>
                <View style={styles.priceContainer}>
                  <Text style={styles.currencyPrefix}>₹</Text>
                  <TextInput
                    style={[styles.input, styles.priceInput, errors.price && styles.inputError]}
                    placeholder="0.00"
                    placeholderTextColor={HorizonColors.textMuted}
                    keyboardType="numeric"
                    value={price}
                    onChangeText={(val) => {
                      setPrice(val);
                      if (errors.price) setErrors((prev) => ({ ...prev, price: '' }));
                    }}
                  />
                </View>
                {errors.price ? <Text style={styles.errorText}>{errors.price}</Text> : null}
              </View>

              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>Quantity *</Text>
                <TextInput
                  style={[styles.input, errors.quantity && styles.inputError]}
                  placeholder="1"
                  placeholderTextColor={HorizonColors.textMuted}
                  keyboardType="number-pad"
                  value={quantity}
                  onChangeText={(val) => {
                    setQuantity(val);
                    if (errors.quantity) setErrors((prev) => ({ ...prev, quantity: '' }));
                  }}
                />
                {errors.quantity ? <Text style={styles.errorText}>{errors.quantity}</Text> : null}
              </View>
            </View>

            {/* Location selection */}
            <View style={styles.field}>
              <Text style={styles.label}>Location</Text>
              <View style={styles.locationRow}>
                {LOCATIONS.map((loc) => {
                  const isSelected = location === loc;
                  return (
                    <Pressable
                      key={loc}
                      onPress={() => setLocation(loc)}
                      style={[
                        styles.locationPill,
                        isSelected && styles.locationPillActive,
                      ]}>
                      <Text
                        style={[
                          styles.locationPillText,
                          isSelected && styles.locationPillTextActive,
                        ]}>
                        {loc}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <Pressable
              onPress={onClose}
              disabled={saving}
              style={[styles.btn, styles.cancelBtn]}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              disabled={saving}
              style={({ pressed }) => [
                styles.btn,
                styles.saveBtn,
                saving && styles.btnDisabled,
                pressed && styles.btnPressed,
              ]}>
              {saving ? (
                <ActivityIndicator size="small" color={HorizonColors.white} />
              ) : (
                <>
                  <MaterialIcons name="check" size={18} color={HorizonColors.white} />
                  <Text style={styles.saveBtnText}>
                    {editingItem ? 'Save Changes' : 'Add Product'}
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(30, 58, 95, 0.4)', // horizon brand tinted transparent overlay
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: HorizonColors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: HorizonColors.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: HorizonColors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: HorizonColors.text,
  },
  closeBtn: {
    padding: 4,
  },
  scrollContent: {
    padding: 24,
    gap: 16,
  },
  formErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
  },
  formErrorText: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '500',
  },
  field: {
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: HorizonColors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: HorizonColors.border,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    color: HorizonColors.text,
    backgroundColor: '#FAFBFD',
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: HorizonColors.border,
    borderRadius: 10,
    backgroundColor: '#FAFBFD',
    overflow: 'hidden',
  },
  currencyPrefix: {
    paddingLeft: 14,
    fontSize: 16,
    fontWeight: '600',
    color: HorizonColors.textMuted,
  },
  priceInput: {
    flex: 1,
    borderWidth: 0,
    backgroundColor: 'transparent',
    paddingLeft: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '500',
  },
  locationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  locationPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: HorizonColors.primaryLight,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  locationPillActive: {
    backgroundColor: HorizonColors.primary,
    borderColor: HorizonColors.primaryDark,
  },
  locationPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: HorizonColors.primary,
  },
  locationPillTextActive: {
    color: HorizonColors.white,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderTopWidth: 1,
    borderTopColor: HorizonColors.border,
  },
  btn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cancelBtn: {
    backgroundColor: 'transparent',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: HorizonColors.textMuted,
  },
  saveBtn: {
    backgroundColor: HorizonColors.primary,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: HorizonColors.white,
  },
  btnPressed: {
    opacity: 0.9,
  },
  btnDisabled: {
    opacity: 0.5,
  },
});
