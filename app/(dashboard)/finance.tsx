import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import * as Print from 'expo-print';

import { ExpenseModal } from '@/components/finance/expense-modal';
import { FinanceAnalytics } from '@/components/finance/finance-analytics';
import { FinanceTableCard } from '@/components/finance/finance-table-card';
import { InvoiceWorkspace, generateInvoiceHtml } from '@/components/finance/invoice-workspace';
import { PurchaseOrderWorkspace, generatePOHtml } from '@/components/finance/po-workspace';
import { QuotationWorkspace, generateQuoteHtml } from '@/components/finance/quote-workspace';
import { HorizonColors } from '@/constants/horizon';
import { useFinance } from '@/hooks/use-finance';
import { Invoice, Quotation, Expense, PurchaseOrder } from '@/types/finance';

type TabType = 'Overview' | 'Invoices' | 'Quotations' | 'Expenses' | 'Purchase Orders';

export default function FinanceScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const {
    invoices,
    quotations,
    expenses,
    purchaseOrders,
    loading,
    error,
    createInvoice,
    editInvoice,
    removeInvoice,
    createQuotation,
    editQuotation,
    removeQuotation,
    convertQuote,
    createExpense,
    editExpense,
    removeExpense,
    createPurchaseOrder,
    editPurchaseOrder,
    removePurchaseOrder,
    isConfigured,
  } = useFinance();

  // Active Tab state
  const [activeTab, setActiveTab] = useState<TabType>('Overview');

  // Modal visibility states
  const [invoiceWorkspaceActive, setInvoiceWorkspaceActive] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  const [quoteWorkspaceActive, setQuoteWorkspaceActive] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);

  const [expenseModalVisible, setExpenseModalVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Purchase Order workspace states
  const [poWorkspaceActive, setPoWorkspaceActive] = useState(false);
  const [editingPurchaseOrder, setEditingPurchaseOrder] = useState<PurchaseOrder | null>(null);

  // Save Handlers
  const handleSaveInvoice = async (itemData: any) => {
    if (editingInvoice) {
      const res = await editInvoice(editingInvoice.id, itemData);
      if (res.ok) {
        Alert.alert('Success', 'Invoice updated successfully.');
        setEditingInvoice(null);
        return { ok: true };
      }
      return { ok: false, message: res.message };
    } else {
      const res = await createInvoice(itemData);
      if (res.ok) {
        Alert.alert('Success', 'Invoice created successfully.');
        return { ok: true };
      }
      return { ok: false, message: res.message };
    }
  };

  const handleSaveQuotation = async (itemData: any) => {
    if (editingQuotation) {
      const res = await editQuotation(editingQuotation.id, itemData);
      if (res.ok) {
        Alert.alert('Success', 'Quotation updated successfully.');
        setEditingQuotation(null);
        return { ok: true };
      }
      return { ok: false, message: res.message };
    } else {
      const res = await createQuotation(itemData);
      if (res.ok) {
        Alert.alert('Success', 'Quotation created successfully.');
        return { ok: true };
      }
      return { ok: false, message: res.message };
    }
  };

  const handleSaveExpense = async (itemData: any) => {
    if (editingExpense) {
      const res = await editExpense(editingExpense.id, itemData);
      if (res.ok) {
        Alert.alert('Success', 'Expense updated successfully.');
        setEditingExpense(null);
        return { ok: true };
      }
      return { ok: false, message: res.message };
    } else {
      const res = await createExpense(itemData);
      if (res.ok) {
        Alert.alert('Success', 'Expense logged successfully.');
        return { ok: true };
      }
      return { ok: false, message: res.message };
    }
  };

  const handleSavePurchaseOrder = async (itemData: any) => {
    if (editingPurchaseOrder) {
      const res = await editPurchaseOrder(editingPurchaseOrder.id, itemData);
      if (res.ok) {
        Alert.alert('Success', 'Purchase Order updated successfully.');
        setEditingPurchaseOrder(null);
        return { ok: true };
      }
      return { ok: false, message: res.message };
    } else {
      const res = await createPurchaseOrder(itemData);
      if (res.ok) {
        Alert.alert('Success', 'Purchase Order created successfully.');
        return { ok: true };
      }
      return { ok: false, message: res.message };
    }
  };

  // Delete Handlers
  const handleDeleteInvoice = async (id: string) => {
    const res = await removeInvoice(id);
    if (!res.ok) {
      Alert.alert('Error', res.message || 'Failed to delete invoice.');
    }
  };

  const handleDeleteQuotation = async (id: string) => {
    const res = await removeQuotation(id);
    if (!res.ok) {
      Alert.alert('Error', res.message || 'Failed to delete quotation.');
    }
  };

  const handleDeleteExpense = async (id: string) => {
    const res = await removeExpense(id);
    if (!res.ok) {
      Alert.alert('Error', res.message || 'Failed to delete expense.');
    }
  };

  const handleDeletePurchaseOrder = async (id: string) => {
    const res = await removePurchaseOrder(id);
    if (!res.ok) {
      Alert.alert('Error', res.message || 'Failed to delete Purchase Order.');
    }
  };

  // Convert Quotation Trigger
  const handleConvertQuote = async (quoteId: string) => {
    const res = await convertQuote(quoteId);
    if (res.ok) {
      Alert.alert(
        'Success',
        'Quotation converted to Invoice draft! We are redirecting you to Invoices.',
        [{ text: 'OK', onPress: () => setActiveTab('Invoices') }]
      );
    } else {
      Alert.alert('Error', res.message || 'Failed to convert quotation.');
    }
  };

  // Trigger Add dialogs
  const handleOpenAddInvoice = () => {
    setEditingInvoice(null);
    setInvoiceWorkspaceActive(true);
  };

  const handlePrintInvoice = async (invoice: Invoice) => {
    try {
      const htmlContent = generateInvoiceHtml(invoice);
      if (Platform.OS === 'web') {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(htmlContent);
          printWindow.document.close();
          printWindow.focus();
          setTimeout(() => {
            printWindow.print();
          }, 500);
        } else {
          Alert.alert('Pop-up Blocked', 'Please allow pop-ups for this site to print PDF.');
        }
      } else {
        await Print.printAsync({ html: htmlContent });
      }
    } catch (err) {
      Alert.alert('Printing Failed', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handleOpenAddQuotation = () => {
    setEditingQuotation(null);
    setQuoteWorkspaceActive(true);
  };

  const handlePrintQuote = async (quote: Quotation) => {
    try {
      const htmlContent = generateQuoteHtml(quote);
      if (Platform.OS === 'web') {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(htmlContent);
          printWindow.document.close();
          printWindow.focus();
          setTimeout(() => {
            printWindow.print();
          }, 500);
        } else {
          Alert.alert('Pop-up Blocked', 'Please allow pop-ups for this site to print PDF.');
        }
      } else {
        await Print.printAsync({ html: htmlContent });
      }
    } catch (err) {
      Alert.alert('Printing Failed', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handleOpenAddExpense = () => {
    setEditingExpense(null);
    setExpenseModalVisible(true);
  };

  const handleOpenAddPo = () => {
    setEditingPurchaseOrder(null);
    setPoWorkspaceActive(true);
  };

  const handlePrintPo = async (po: PurchaseOrder) => {
    try {
      const htmlContent = generatePOHtml(po);
      if (Platform.OS === 'web') {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(htmlContent);
          printWindow.document.close();
          printWindow.focus();
          setTimeout(() => {
            printWindow.print();
          }, 500);
        } else {
          Alert.alert('Pop-up Blocked', 'Please allow pop-ups for this site to print PDF.');
        }
      } else {
        await Print.printAsync({ html: htmlContent });
      }
    } catch (err) {
      Alert.alert('Printing Failed', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  // Trigger Edit dialogs
  const handleEditPress = (item: any) => {
    if (activeTab === 'Invoices') {
      setEditingInvoice(item);
      setInvoiceWorkspaceActive(true);
    } else if (activeTab === 'Quotations') {
      setEditingQuotation(item);
      setQuoteWorkspaceActive(true);
    } else if (activeTab === 'Expenses') {
      setEditingExpense(item);
      setExpenseModalVisible(true);
    } else if (activeTab === 'Purchase Orders') {
      setEditingPurchaseOrder(item);
      setPoWorkspaceActive(true);
    }
  };

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
        <Text style={styles.title}>Finance Workspace</Text>
        <View style={styles.errorCard}>
          <MaterialIcons name="cloud-off" size={32} color={HorizonColors.warning} />
          <Text style={styles.errorTitle}>Firebase Config Required</Text>
          <Text style={styles.errorText}>
            {error ?? 'Configure your EXPO_PUBLIC_FIREBASE_* environment variables to use the Finance module.'}
          </Text>
        </View>
      </View>
    );
  }

  if (poWorkspaceActive) {
    return (
      <PurchaseOrderWorkspace
        editingItem={editingPurchaseOrder}
        onClose={() => {
          setPoWorkspaceActive(false);
          setEditingPurchaseOrder(null);
        }}
        onSave={handleSavePurchaseOrder}
      />
    );
  }

  if (quoteWorkspaceActive) {
    return (
      <QuotationWorkspace
        editingItem={editingQuotation}
        onClose={() => {
          setQuoteWorkspaceActive(false);
          setEditingQuotation(null);
        }}
        onSave={handleSaveQuotation}
      />
    );
  }

  if (invoiceWorkspaceActive) {
    return (
      <InvoiceWorkspace
        editingItem={editingInvoice}
        onClose={() => {
          setInvoiceWorkspaceActive(false);
          setEditingInvoice(null);
        }}
        onSave={handleSaveInvoice}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Area */}
      <View style={isDesktop ? styles.headerWide : styles.headerMobile}>
        <View>
          <Text style={styles.title}>Finance Workspace</Text>
          <Text style={styles.subtitle}>
            Manage invoices, create quotations, log business expenses, and review margins.
          </Text>
        </View>

        {/* Action Buttons horizontal strip */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.actionHeaderScroll}
          contentContainerStyle={styles.actionHeaderRow}
        >
          {/* Quick Log Expense */}
          <Pressable
            style={({ pressed }) => [styles.quickActionBtn, pressed && styles.btnPressed]}
            onPress={handleOpenAddExpense}>
            <View style={[styles.quickIconCircle, { backgroundColor: '#FEE2E2' }]}>
              <MaterialIcons name="trending-down" size={16} color="#EF4444" />
            </View>
            <Text style={styles.quickActionText}>Log Expense</Text>
          </Pressable>

          {/* Quick Create Invoice */}
          <Pressable
            style={({ pressed }) => [styles.quickActionBtn, pressed && styles.btnPressed]}
            onPress={handleOpenAddInvoice}>
            <View style={[styles.quickIconCircle, { backgroundColor: '#E0F2FE' }]}>
              <MaterialIcons name="receipt" size={16} color={HorizonColors.primary} />
            </View>
            <Text style={styles.quickActionText}>Create Invoice</Text>
          </Pressable>

          {/* Quick Create Quotation */}
          <Pressable
            style={({ pressed }) => [styles.quickActionBtn, pressed && styles.btnPressed]}
            onPress={handleOpenAddQuotation}>
            <View style={[styles.quickIconCircle, { backgroundColor: '#DCFCE7' }]}>
              <MaterialIcons name="description" size={16} color="#16A34A" />
            </View>
            <Text style={styles.quickActionText}>Create Quote</Text>
          </Pressable>

          {/* Quick Create PO */}
          <Pressable
            style={({ pressed }) => [styles.quickActionBtn, pressed && styles.btnPressed]}
            onPress={handleOpenAddPo}>
            <View style={[styles.quickIconCircle, { backgroundColor: '#F3E8FF' }]}>
              <MaterialIcons name="shopping-cart" size={16} color="#8B5CF6" />
            </View>
            <Text style={styles.quickActionText}>Create PO</Text>
          </Pressable>
        </ScrollView>
      </View>

      {/* Main Tab Switcher */}
      <View style={styles.tabContainer}>
        {(['Overview', 'Invoices', 'Quotations', 'Expenses', 'Purchase Orders'] as TabType[]).map((tab) => {
          const isTabActive = activeTab === tab;
          return (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tabBtn, isTabActive && styles.tabBtnActive]}>
              <Text style={[styles.tabText, isTabActive && styles.tabTextActive]}>{tab}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Tab Render Switch */}
      {activeTab === 'Overview' && (
        <FinanceAnalytics invoices={invoices} expenses={expenses} />
      )}

      {activeTab === 'Invoices' && (
        <View>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Invoices Listing</Text>
            <Pressable style={styles.sectionAddBtn} onPress={handleOpenAddInvoice}>
              <MaterialIcons name="add" size={16} color={HorizonColors.white} />
              <Text style={styles.sectionAddBtnText}>Add Invoice</Text>
            </Pressable>
          </View>
          <FinanceTableCard
            type="invoice"
            data={invoices}
            onEdit={handleEditPress}
            onDelete={handleDeleteInvoice}
            onPrintPo={handlePrintInvoice}
          />
        </View>
      )}

      {activeTab === 'Quotations' && (
        <View>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Quotations Listing</Text>
            <Pressable style={styles.sectionAddBtn} onPress={handleOpenAddQuotation}>
              <MaterialIcons name="add" size={16} color={HorizonColors.white} />
              <Text style={styles.sectionAddBtnText}>Add Quotation</Text>
            </Pressable>
          </View>
          <FinanceTableCard
            type="quotation"
            data={quotations}
            onEdit={handleEditPress}
            onDelete={handleDeleteQuotation}
            onConvertQuote={handleConvertQuote}
            onPrintPo={handlePrintQuote}
          />
        </View>
      )}

      {activeTab === 'Expenses' && (
        <View>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Business Expenses</Text>
            <Pressable style={styles.sectionAddBtn} onPress={handleOpenAddExpense}>
              <MaterialIcons name="add" size={16} color={HorizonColors.white} />
              <Text style={styles.sectionAddBtnText}>Log Expense</Text>
            </Pressable>
          </View>
          <FinanceTableCard
            type="expense"
            data={expenses}
            onEdit={handleEditPress}
            onDelete={handleDeleteExpense}
          />
        </View>
      )}

      {activeTab === 'Purchase Orders' && (
        <View>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Purchase Orders Listing</Text>
            <Pressable style={styles.sectionAddBtn} onPress={handleOpenAddPo}>
              <MaterialIcons name="add" size={16} color={HorizonColors.white} />
              <Text style={styles.sectionAddBtnText}>Add Purchase Order</Text>
            </Pressable>
          </View>
          <FinanceTableCard
            type="purchase_order"
            data={purchaseOrders}
            onEdit={handleEditPress}
            onDelete={handleDeletePurchaseOrder}
            onPrintPo={handlePrintPo}
          />
        </View>
      )}

      {/* Modals Popup Controllers */}



      <ExpenseModal
        visible={expenseModalVisible}
        onClose={() => {
          setExpenseModalVisible(false);
          setEditingExpense(null);
        }}
        onSave={handleSaveExpense}
        editingItem={editingExpense}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 16,
  },
  headerMobile: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 12,
    marginBottom: 16,
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
    maxWidth: 600,
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
  quickActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: HorizonColors.white,
    borderWidth: 1,
    borderColor: HorizonColors.border,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    shadowColor: '#1E3A5F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  quickIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: HorizonColors.text,
  },
  btnPressed: {
    opacity: 0.82,
    backgroundColor: '#F1F5F9',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: HorizonColors.border,
    marginBottom: 16,
    gap: 16,
  },
  tabBtn: {
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: HorizonColors.primary,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: HorizonColors.textMuted,
  },
  tabTextActive: {
    color: HorizonColors.primary,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E3A5F',
  },
  sectionAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: HorizonColors.primary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  sectionAddBtnText: {
    fontSize: 13,
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
});
