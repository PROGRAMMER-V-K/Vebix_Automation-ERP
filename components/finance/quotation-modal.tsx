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
import { Quotation, QuotationStatus, LineItem, NewQuotation } from '@/types/finance';

type QuotationModalProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (item: NewQuotation | Partial<Quotation>) => Promise<{ ok: boolean; message?: string }>;
  editingItem: Quotation | null;
};

export function QuotationModal({
  visible,
  onClose,
  onSave,
  editingItem,
}: QuotationModalProps) {
  const [quoteId, setQuoteId] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [gstRate, setGstRate] = useState('18'); // Default 18% GST
  const [validUntil, setValidUntil] = useState('');
  const [date, setDate] = useState('');
  const [status, setStatus] = useState<QuotationStatus>('Draft');
  
  // Line items state
  const [items, setItems] = useState<LineItem[]>([]);
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Sync edits
  useEffect(() => {
    if (editingItem) {
      setQuoteId(editingItem.quoteId);
      setClientName(editingItem.clientName);
      setClientEmail(editingItem.clientEmail);
      setGstRate(String(editingItem.gstRate));
      setValidUntil(editingItem.validUntil);
      setDate(editingItem.date);
      setStatus(editingItem.status);
      setItems(editingItem.items || []);
    } else {
      setQuoteId('');
      setClientName('');
      setClientEmail('');
      setGstRate('18');
      setDate(new Date().toISOString().split('T')[0]);
      setValidUntil(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]); // Default 30 days validity
      setStatus('Draft');
      setItems([{ description: '', quantity: 1, rate: 0, amount: 0 }]);
    }
    setErrors({});
  }, [editingItem, visible]);

  // Recalculate totals in real-time
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  const gstPercentage = parseFloat(gstRate) || 0;
  const gstAmount = (subtotal * gstPercentage) / 100;
  const total = subtotal + gstAmount;

  // Add line item
  const handleAddItem = () => {
    setItems((prev) => [...prev, { description: '', quantity: 1, rate: 0, amount: 0 }]);
  };

  // Remove line item
  const handleRemoveItem = (index: number) => {
    if (items.length === 1) return; // Keep at least one item
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Update line item property
  const handleUpdateItem = (index: number, key: keyof LineItem, val: any) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const updated = { ...item, [key]: val };
        
        // Recalculate item amount
        if (key === 'quantity' || key === 'rate') {
          const qty = key === 'quantity' ? parseInt(val, 10) || 0 : item.quantity;
          const rate = key === 'rate' ? parseFloat(val) || 0 : item.rate;
          updated.quantity = qty;
          updated.rate = rate;
          updated.amount = qty * rate;
        }
        return updated;
      })
    );
  };

  function validate(): boolean {
    const nextErrors: Record<string, string> = {};
    if (!clientName.trim()) nextErrors.clientName = 'Client name is required';
    if (!clientEmail.trim()) nextErrors.clientEmail = 'Client email is required';
    if (!date.trim()) {
      nextErrors.date = 'Date is required';
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(date.trim())) {
      nextErrors.date = 'Date format must be YYYY-MM-DD';
    }
    if (!validUntil.trim()) {
      nextErrors.validUntil = 'Validity date is required';
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(validUntil.trim())) {
      nextErrors.validUntil = 'Validity format must be YYYY-MM-DD';
    }

    // Line item validation
    const hasEmptyItem = items.some((item) => !item.description.trim() || item.quantity <= 0 || item.rate <= 0);
    if (hasEmptyItem) {
      nextErrors.items = 'All items must have a description, positive quantity, and rate';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;

    setSaving(true);
    const itemData = {
      quoteId, // Let backend generate if empty
      clientName: clientName.trim(),
      clientEmail: clientEmail.trim(),
      items: items.map((i) => ({
        description: i.description.trim(),
        quantity: i.quantity,
        rate: i.rate,
        amount: i.amount,
      })),
      gstRate: gstPercentage,
      subtotal,
      gstAmount,
      total,
      validUntil: validUntil.trim(),
      date: date.trim(),
      status,
    };

    const res = await onSave(itemData);
    setSaving(false);
    if (res.ok) {
      onClose();
    } else {
      setErrors({ form: res.message || 'Failed to save quotation.' });
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.root}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{editingItem ? `Edit Quotation (${editingItem.quoteId})` : 'New Quotation Draft'}</Text>
          <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
            <MaterialIcons name="close" size={24} color={HorizonColors.text} />
          </Pressable>
        </View>

        {/* Scroll Form Container */}
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {errors.form ? (
            <View style={styles.formErrorBox}>
              <MaterialIcons name="error-outline" size={18} color="#DC2626" />
              <Text style={styles.formErrorText}>{errors.form}</Text>
            </View>
          ) : null}

          {/* Block 1: Client Information */}
          <Text style={styles.sectionHeader}>Client Information</Text>
          <View style={styles.card}>
            <View style={styles.field}>
              <Text style={styles.label}>Client Name *</Text>
              <TextInput
                style={[styles.input, errors.clientName && styles.inputError]}
                placeholder="Client Name or Company"
                placeholderTextColor={HorizonColors.textMuted}
                value={clientName}
                onChangeText={(val) => {
                  setClientName(val);
                  if (errors.clientName) setErrors((prev) => ({ ...prev, clientName: '' }));
                }}
              />
              {errors.clientName ? <Text style={styles.errorText}>{errors.clientName}</Text> : null}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Client Email *</Text>
              <TextInput
                style={[styles.input, errors.clientEmail && styles.inputError]}
                placeholder="client@company.com"
                placeholderTextColor={HorizonColors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                value={clientEmail}
                onChangeText={(val) => {
                  setClientEmail(val);
                  if (errors.clientEmail) setErrors((prev) => ({ ...prev, clientEmail: '' }));
                }}
              />
              {errors.clientEmail ? <Text style={styles.errorText}>{errors.clientEmail}</Text> : null}
            </View>
          </View>

          {/* Block 2: Dates & Taxes */}
          <Text style={styles.sectionHeader}>Quotation Setup & Taxes</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>Date *</Text>
                <TextInput
                  style={[styles.input, errors.date && styles.inputError]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={HorizonColors.textMuted}
                  value={date}
                  onChangeText={(val) => {
                    setDate(val);
                    if (errors.date) setErrors((prev) => ({ ...prev, date: '' }));
                  }}
                />
                {errors.date ? <Text style={styles.errorText}>{errors.date}</Text> : null}
              </View>

              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>Valid Until *</Text>
                <TextInput
                  style={[styles.input, errors.validUntil && styles.inputError]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={HorizonColors.textMuted}
                  value={validUntil}
                  onChangeText={(val) => {
                    setValidUntil(val);
                    if (errors.validUntil) setErrors((prev) => ({ ...prev, validUntil: '' }));
                  }}
                />
                {errors.validUntil ? <Text style={styles.errorText}>{errors.validUntil}</Text> : null}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>GST Rate (%)</Text>
              <TextInput
                style={styles.input}
                placeholder="18"
                placeholderTextColor={HorizonColors.textMuted}
                keyboardType="numeric"
                value={gstRate}
                onChangeText={setGstRate}
              />
            </View>
          </View>

          {/* Block 3: Line Item Builder */}
          <View style={[styles.row, { justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }]}>
            <Text style={styles.sectionHeader}>Line Items</Text>
            <Pressable onPress={handleAddItem} style={styles.addItemBtn}>
              <MaterialIcons name="add" size={16} color={HorizonColors.primary} />
              <Text style={styles.addItemBtnText}>Add Item</Text>
            </Pressable>
          </View>
          {errors.items ? <Text style={[styles.errorText, { marginBottom: 12 }]}>{errors.items}</Text> : null}

          {items.map((item, idx) => (
            <View key={idx} style={[styles.card, { padding: 16, marginBottom: 10 }]}>
              <View style={[styles.row, { justifyContent: 'space-between', alignItems: 'center' }]}>
                <Text style={styles.itemIndexLabel}>Item #{idx + 1}</Text>
                {items.length > 1 ? (
                  <Pressable onPress={() => handleRemoveItem(idx)} hitSlop={6}>
                    <MaterialIcons name="delete-outline" size={18} color="#EF4444" />
                  </Pressable>
                ) : null}
              </View>

              <View style={[styles.field, { marginTop: 8 }]}>
                <TextInput
                  style={styles.input}
                  placeholder="Item description (e.g. Consulting, Hardware development)"
                  placeholderTextColor={HorizonColors.textMuted}
                  value={item.description}
                  onChangeText={(val) => handleUpdateItem(idx, 'description', val)}
                />
              </View>

              <View style={[styles.row, { marginTop: 10 }]}>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.itemLabelSmall}>Qty</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="1"
                    keyboardType="number-pad"
                    placeholderTextColor={HorizonColors.textMuted}
                    value={String(item.quantity)}
                    onChangeText={(val) => handleUpdateItem(idx, 'quantity', val)}
                  />
                </View>

                <View style={[styles.field, { flex: 1.5 }]}>
                  <Text style={styles.itemLabelSmall}>Rate (₹)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0.00"
                    keyboardType="numeric"
                    placeholderTextColor={HorizonColors.textMuted}
                    value={String(item.rate)}
                    onChangeText={(val) => handleUpdateItem(idx, 'rate', val)}
                  />
                </View>

                <View style={[styles.field, { flex: 1.5, justifyContent: 'flex-end', paddingBottom: 12 }]}>
                  <Text style={styles.itemLabelSmall}>Total</Text>
                  <Text style={styles.itemTotalVal}>₹{(item.quantity * item.rate).toLocaleString()}</Text>
                </View>
              </View>
            </View>
          ))}

          {/* Block 4: Calculations Block */}
          <View style={[styles.card, styles.totalsCard]}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalVal}>₹{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>GST ({gstRate}%)</Text>
              <Text style={styles.totalVal}>₹{gstAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
            </View>
            <View style={[styles.totalRow, styles.grandTotalRow]}>
              <Text style={styles.grandTotalLabel}>Grand Total</Text>
              <Text style={styles.grandTotalVal}>₹{total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
            </View>
          </View>

          {/* Block 5: Status selection */}
          <Text style={styles.sectionHeader}>Quotation Status</Text>
          <View style={[styles.card, styles.statusCard]}>
            {(['Draft', 'Sent', 'Converted', 'Expired'] as QuotationStatus[]).map((st) => {
              const isSelected = status === st;
              return (
                <Pressable
                  key={st}
                  onPress={() => setStatus(st)}
                  style={[
                    styles.statusPill,
                    isSelected && styles.statusPillActive,
                  ]}>
                  <Text
                    style={[
                      styles.statusPillText,
                      isSelected && styles.statusPillTextActive,
                    ]}>
                    {st}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        {/* Footer Actions */}
        <View style={styles.footer}>
          <Pressable onPress={onClose} disabled={saving} style={[styles.btn, styles.cancelBtn]}>
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
                  {editingItem ? 'Save Quotation' : 'Create Quotation'}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: HorizonColors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: HorizonColors.border,
    backgroundColor: HorizonColors.white,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: HorizonColors.text,
  },
  closeBtn: {
    padding: 4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginTop: 18,
  },
  card: {
    backgroundColor: HorizonColors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: HorizonColors.cardBorder,
    padding: 20,
    gap: 14,
  },
  formErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  formErrorText: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '500',
  },
  field: {
    gap: 6,
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
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '500',
  },
  addItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addItemBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: HorizonColors.primary,
  },
  itemIndexLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  itemLabelSmall: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  itemTotalVal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E3A5F',
  },
  totalsCard: {
    marginTop: 20,
    backgroundColor: '#FCFDFE',
    borderStyle: 'dashed',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  totalLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  totalVal: {
    fontSize: 14,
    color: '#1E3A5F',
    fontWeight: '600',
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 12,
    marginTop: 6,
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E3A5F',
  },
  grandTotalVal: {
    fontSize: 18,
    fontWeight: '800',
    color: HorizonColors.primary,
  },
  statusCard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 16,
  },
  statusPill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#FAFBFD',
    borderWidth: 1.5,
    borderColor: HorizonColors.border,
  },
  statusPillActive: {
    backgroundColor: HorizonColors.primaryLight,
    borderColor: HorizonColors.primary,
  },
  statusPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: HorizonColors.text,
  },
  statusPillTextActive: {
    color: HorizonColors.primary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderTopWidth: 1,
    borderTopColor: HorizonColors.border,
    backgroundColor: HorizonColors.white,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  cancelBtn: {
    backgroundColor: HorizonColors.white,
    borderWidth: 1,
    borderColor: HorizonColors.border,
  },
  cancelBtnText: {
    color: HorizonColors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: HorizonColors.primary,
  },
  saveBtnText: {
    color: HorizonColors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  btnPressed: {
    opacity: 0.88,
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
