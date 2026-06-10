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
import { Expense, EXPENSE_CATEGORIES, ExpenseCategory, NewExpense } from '@/types/finance';

type ExpenseModalProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (item: NewExpense | Partial<Expense>) => Promise<{ ok: boolean; message?: string }>;
  editingItem: Expense | null;
};

export function ExpenseModal({
  visible,
  onClose,
  onSave,
  editingItem,
}: ExpenseModalProps) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Other');
  const [date, setDate] = useState('');
  const [project, setProject] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingItem) {
      setTitle(editingItem.title);
      setAmount(String(editingItem.amount));
      setCategory(editingItem.category);
      setDate(editingItem.date);
      setProject(editingItem.project);
      setAttachmentUrl(editingItem.attachmentUrl || '');
    } else {
      setTitle('');
      setAmount('');
      setCategory('Other');
      setDate(new Date().toISOString().split('T')[0]);
      setProject('');
      setAttachmentUrl('');
    }
    setErrors({});
  }, [editingItem, visible]);

  function validate(): boolean {
    const nextErrors: Record<string, string> = {};
    if (!title.trim()) nextErrors.title = 'Title is required';
    if (!project.trim()) nextErrors.project = 'Project is required';
    if (!date.trim()) {
      nextErrors.date = 'Date is required';
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(date.trim())) {
      nextErrors.date = 'Format must be YYYY-MM-DD';
    }

    const parsedAmt = parseFloat(amount);
    if (!amount.trim()) {
      nextErrors.amount = 'Amount is required';
    } else if (isNaN(parsedAmt) || parsedAmt <= 0) {
      nextErrors.amount = 'Amount must be a positive number';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;

    setSaving(true);
    const itemData = {
      title: title.trim(),
      amount: parseFloat(amount),
      category,
      date: date.trim(),
      project: project.trim(),
      attachmentUrl: attachmentUrl.trim(),
    };

    const res = await onSave(itemData);
    setSaving(false);
    if (res.ok) {
      onClose();
    } else {
      setErrors({ form: res.message || 'Failed to save expense.' });
    }
  }

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{editingItem ? 'Edit Expense' : 'Log Expense'}</Text>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <MaterialIcons name="close" size={22} color={HorizonColors.text} />
            </Pressable>
          </View>

          {/* Form Content */}
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            {errors.form ? (
              <View style={styles.formErrorBox}>
                <MaterialIcons name="error-outline" size={18} color="#DC2626" />
                <Text style={styles.formErrorText}>{errors.form}</Text>
              </View>
            ) : null}

            {/* Title */}
            <View style={styles.field}>
              <Text style={styles.label}>Expense Title *</Text>
              <TextInput
                style={[styles.input, errors.title && styles.inputError]}
                placeholder="e.g. Server hosting, Airfare to Delhi"
                placeholderTextColor={HorizonColors.textMuted}
                value={title}
                onChangeText={(val) => {
                  setTitle(val);
                  if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
                }}
              />
              {errors.title ? <Text style={styles.errorText}>{errors.title}</Text> : null}
            </View>

            {/* Amount */}
            <View style={styles.field}>
              <Text style={styles.label}>Amount (₹) *</Text>
              <TextInput
                style={[styles.input, errors.amount && styles.inputError]}
                placeholder="0.00"
                placeholderTextColor={HorizonColors.textMuted}
                keyboardType="numeric"
                value={amount}
                onChangeText={(val) => {
                  setAmount(val);
                  if (errors.amount) setErrors((prev) => ({ ...prev, amount: '' }));
                }}
              />
              {errors.amount ? <Text style={styles.errorText}>{errors.amount}</Text> : null}
            </View>

            {/* Category selection */}
            <View style={styles.field}>
              <Text style={styles.label}>Category</Text>
              <View style={styles.categoryRow}>
                {EXPENSE_CATEGORIES.map((cat) => {
                  const isSelected = category === cat;
                  return (
                    <Pressable
                      key={cat}
                      onPress={() => setCategory(cat)}
                      style={[
                        styles.categoryPill,
                        isSelected && styles.categoryPillActive,
                      ]}>
                      <Text
                        style={[
                          styles.categoryPillText,
                          isSelected && styles.categoryPillTextActive,
                        ]}>
                        {cat}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Project */}
            <View style={styles.field}>
              <Text style={styles.label}>Project *</Text>
              <TextInput
                style={[styles.input, errors.project && styles.inputError]}
                placeholder="e.g. Vebix Automation, Internal"
                placeholderTextColor={HorizonColors.textMuted}
                value={project}
                onChangeText={(val) => {
                  setProject(val);
                  if (errors.project) setErrors((prev) => ({ ...prev, project: '' }));
                }}
              />
              {errors.project ? <Text style={styles.errorText}>{errors.project}</Text> : null}
            </View>

            {/* Date */}
            <View style={styles.field}>
              <Text style={styles.label}>Date (YYYY-MM-DD) *</Text>
              <TextInput
                style={[styles.input, errors.date && styles.inputError]}
                placeholder="2026-06-10"
                placeholderTextColor={HorizonColors.textMuted}
                value={date}
                onChangeText={(val) => {
                  setDate(val);
                  if (errors.date) setErrors((prev) => ({ ...prev, date: '' }));
                }}
              />
              {errors.date ? <Text style={styles.errorText}>{errors.date}</Text> : null}
            </View>

            {/* Receipt URL / Attachment Link */}
            <View style={styles.field}>
              <Text style={styles.label}>Receipt URL / Proof Link</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. https://drive.google.com/..."
                placeholderTextColor={HorizonColors.textMuted}
                autoCapitalize="none"
                keyboardType="url"
                value={attachmentUrl}
                onChangeText={setAttachmentUrl}
              />
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
                    {editingItem ? 'Save Changes' : 'Log Expense'}
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
    backgroundColor: 'rgba(30, 58, 95, 0.4)',
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
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryPill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#FAFBFD',
    borderWidth: 1.5,
    borderColor: HorizonColors.border,
  },
  categoryPillActive: {
    backgroundColor: HorizonColors.primaryLight,
    borderColor: HorizonColors.primary,
  },
  categoryPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: HorizonColors.text,
  },
  categoryPillTextActive: {
    color: HorizonColors.primary,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '500',
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
    backgroundColor: '#FCFDFE',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
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
