import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useState, useMemo } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import { HorizonColors } from '@/constants/horizon';
import { Invoice, Quotation, Expense, InvoiceStatus, QuotationStatus, PurchaseOrder, PurchaseOrderStatus } from '@/types/finance';

type FinanceTableCardProps = {
  type: 'invoice' | 'quotation' | 'expense' | 'purchase_order';
  data: any[]; // Invoice[] | Quotation[] | Expense[] | PurchaseOrder[]
  onEdit: (item: any) => void;
  onDelete: (id: string) => void;
  onConvertQuote?: (quoteId: string) => void;
  onPrintPo?: (item: any) => void;
};

export function FinanceTableCard({
  type,
  data,
  onEdit,
  onDelete,
  onConvertQuote,
  onPrintPo,
}: FinanceTableCardProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Clear filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('All');
    setCategoryFilter('All');
  };

  // Filter logic
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // 1. Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (type === 'expense') {
          const exp = item as Expense;
          const matches =
            exp.title.toLowerCase().includes(q) ||
            exp.project.toLowerCase().includes(q) ||
            exp.category.toLowerCase().includes(q);
          if (!matches) return false;
        } else if (type === 'purchase_order') {
          const po = item as PurchaseOrder;
          const matches =
            po.poId.toLowerCase().includes(q) ||
            po.supplierName.toLowerCase().includes(q) ||
            (po.supplierEmail && po.supplierEmail.toLowerCase().includes(q));
          if (!matches) return false;
        } else {
          const invoiceOrQuote = item as Invoice | Quotation;
          const idStr = type === 'invoice' ? (item as Invoice).invoiceId : (item as Quotation).quoteId;
          const matches =
            idStr.toLowerCase().includes(q) ||
            invoiceOrQuote.clientName.toLowerCase().includes(q) ||
            invoiceOrQuote.clientEmail.toLowerCase().includes(q);
          if (!matches) return false;
        }
      }

      // 2. Status filter
      if (type !== 'expense' && statusFilter !== 'All') {
        if (item.status !== statusFilter) return false;
      }

      // 3. Category filter (Expenses)
      if (type === 'expense' && categoryFilter !== 'All') {
        if (item.category !== categoryFilter) return false;
      }

      return true;
    });
  }, [data, searchQuery, statusFilter, categoryFilter, type]);

  const handleDeleteConfirm = (item: any) => {
    const title = type === 'invoice' ? item.invoiceId : type === 'quotation' ? item.quoteId : type === 'purchase_order' ? item.poId : item.title;
    Alert.alert(
      'Delete Document',
      `Are you sure you want to delete "${title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(item.id) },
      ]
    );
  };

  const openAttachment = (url: string) => {
    if (!url) return;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open receipt URL.');
    });
  };

  // Status color mapper
  const getStatusStyle = (status: InvoiceStatus | QuotationStatus | PurchaseOrderStatus) => {
    switch (status) {
      case 'Paid':
      case 'Converted':
      case 'Approved':
        return { bg: '#DCFCE7', text: '#16A34A' };
      case 'Sent':
        return { bg: '#FEF3C7', text: '#D97706' };
      case 'Overdue':
      case 'Expired':
        return { bg: '#FEE2E2', text: '#EF4444' };
      case 'Cancelled':
        return { bg: '#F1F5F9', text: '#64748B' };
      case 'Draft':
      default:
        return { bg: '#E2E8F0', text: '#475569' };
    }
  };

  // RENDER DESKTOP TABLES
  const renderDesktopTable = () => {
    if (type === 'invoice') {
      return (
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.columnHeader, { flex: 1.2 }]}>INVOICE ID</Text>
            <Text style={[styles.columnHeader, { flex: 2 }]}>CLIENT</Text>
            <Text style={[styles.columnHeader, { flex: 1.2 }]}>DATE</Text>
            <Text style={[styles.columnHeader, { flex: 1.2 }]}>DUE DATE</Text>
            <Text style={[styles.columnHeader, { flex: 1.5, textAlign: 'right' }]}>TOTAL</Text>
            <Text style={[styles.columnHeader, { flex: 1.2, textAlign: 'center' }]}>STATUS</Text>
            <Text style={[styles.columnHeader, { flex: 1.2, textAlign: 'center' }]}>ACTIONS</Text>
          </View>
          {filteredData.map((item: Invoice, index) => {
            const isEven = index % 2 === 0;
            const statusStyle = getStatusStyle(item.status);
            return (
              <View key={item.id} style={[styles.tableRow, isEven ? styles.rowEven : styles.rowOdd]}>
                <Text style={[styles.colValue, { flex: 1.2, fontWeight: '700' }]}>{item.invoiceId}</Text>
                <View style={{ flex: 2 }}>
                  <Text style={styles.clientNameText} numberOfLines={1}>{item.clientName}</Text>
                  <Text style={styles.clientEmailText} numberOfLines={1}>{item.clientEmail}</Text>
                </View>
                <Text style={[styles.colValue, { flex: 1.2 }]}>{item.date}</Text>
                <Text style={[styles.colValue, { flex: 1.2 }]}>{item.dueDate}</Text>
                <Text style={[styles.colValue, { flex: 1.5, textAlign: 'right', fontWeight: '700', color: HorizonColors.primary }]}>
                  ₹{item.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Text>
                <View style={{ flex: 1.2, alignItems: 'center' }}>
                  <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                    <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>{item.status}</Text>
                  </View>
                </View>
                <View style={[styles.actionsColumn, { flex: 1.2 }]}>
                  {onPrintPo && (
                    <Pressable style={styles.actionIconBtn} onPress={() => onPrintPo(item)} hitSlop={6}>
                      <MaterialIcons name="print" size={18} color={HorizonColors.primary} />
                    </Pressable>
                  )}
                  <Pressable style={styles.actionIconBtn} onPress={() => onEdit(item)} hitSlop={6}>
                    <MaterialIcons name="edit" size={18} color={HorizonColors.textMuted} />
                  </Pressable>
                  <Pressable style={styles.actionIconBtn} onPress={() => handleDeleteConfirm(item)} hitSlop={6}>
                    <MaterialIcons name="delete-outline" size={18} color="#EF4444" />
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      );
    }

    if (type === 'quotation') {
      return (
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.columnHeader, { flex: 1.2 }]}>QUOTE ID</Text>
            <Text style={[styles.columnHeader, { flex: 2 }]}>CLIENT</Text>
            <Text style={[styles.columnHeader, { flex: 1.2 }]}>DATE</Text>
            <Text style={[styles.columnHeader, { flex: 1.2 }]}>VALID UNTIL</Text>
            <Text style={[styles.columnHeader, { flex: 1.5, textAlign: 'right' }]}>TOTAL</Text>
            <Text style={[styles.columnHeader, { flex: 1.2, textAlign: 'center' }]}>STATUS</Text>
            <Text style={[styles.columnHeader, { flex: 1.8, textAlign: 'center' }]}>ACTIONS</Text>
          </View>
          {filteredData.map((item: Quotation, index) => {
            const isEven = index % 2 === 0;
            const statusStyle = getStatusStyle(item.status);
            return (
              <View key={item.id} style={[styles.tableRow, isEven ? styles.rowEven : styles.rowOdd]}>
                <Text style={[styles.colValue, { flex: 1.2, fontWeight: '700' }]}>{item.quoteId}</Text>
                <View style={{ flex: 2 }}>
                  <Text style={styles.clientNameText} numberOfLines={1}>{item.clientName}</Text>
                  <Text style={styles.clientEmailText} numberOfLines={1}>{item.clientEmail}</Text>
                </View>
                <Text style={[styles.colValue, { flex: 1.2 }]}>{item.date}</Text>
                <Text style={[styles.colValue, { flex: 1.2 }]}>{item.validUntil}</Text>
                <Text style={[styles.colValue, { flex: 1.5, textAlign: 'right', fontWeight: '700' }]}>
                  ₹{item.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Text>
                <View style={{ flex: 1.2, alignItems: 'center' }}>
                  <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                    <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>{item.status}</Text>
                  </View>
                </View>
                <View style={[styles.actionsColumn, { flex: 1.8 }]}>
                  {item.status !== 'Converted' && onConvertQuote && (
                    <Pressable
                      style={styles.convertBtn}
                      onPress={() => onConvertQuote(item.id)}
                      hitSlop={6}>
                      <MaterialIcons name="transform" size={14} color={HorizonColors.primary} />
                      <Text style={styles.convertBtnText}>Invoice</Text>
                    </Pressable>
                  )}
                  {onPrintPo && (
                    <Pressable style={styles.actionIconBtn} onPress={() => onPrintPo(item)} hitSlop={6}>
                      <MaterialIcons name="print" size={18} color={HorizonColors.primary} />
                    </Pressable>
                  )}
                  <Pressable style={styles.actionIconBtn} onPress={() => onEdit(item)} hitSlop={6}>
                    <MaterialIcons name="edit" size={18} color={HorizonColors.textMuted} />
                  </Pressable>
                  <Pressable style={styles.actionIconBtn} onPress={() => handleDeleteConfirm(item)} hitSlop={6}>
                    <MaterialIcons name="delete-outline" size={18} color="#EF4444" />
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      );
    }

    if (type === 'purchase_order') {
      return (
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.columnHeader, { flex: 1.5 }]}>PO ID</Text>
            <Text style={[styles.columnHeader, { flex: 2.2 }]}>SUPPLIER</Text>
            <Text style={[styles.columnHeader, { flex: 1.2 }]}>DATE</Text>
            <Text style={[styles.columnHeader, { flex: 2 }]}>SHIPPING TERMS</Text>
            <Text style={[styles.columnHeader, { flex: 1.5, textAlign: 'right' }]}>TOTAL</Text>
            <Text style={[styles.columnHeader, { flex: 1.2, textAlign: 'center' }]}>STATUS</Text>
            <Text style={[styles.columnHeader, { flex: 1.5, textAlign: 'center' }]}>ACTIONS</Text>
          </View>
          {filteredData.map((item: any, index) => {
            const isEven = index % 2 === 0;
            const statusStyle = getStatusStyle(item.status);
            return (
              <View key={item.id} style={[styles.tableRow, isEven ? styles.rowEven : styles.rowOdd]}>
                <Text style={[styles.colValue, { flex: 1.5, fontWeight: '700' }]}>{item.poId}</Text>
                <View style={{ flex: 2.2 }}>
                  <Text style={styles.clientNameText} numberOfLines={1}>{item.supplierName}</Text>
                  <Text style={styles.clientEmailText} numberOfLines={1}>{item.supplierEmail || '—'}</Text>
                </View>
                <Text style={[styles.colValue, { flex: 1.2 }]}>{item.date}</Text>
                <Text style={[styles.colValue, { flex: 2 }]} numberOfLines={2}>{item.shippingTerms || '—'}</Text>
                <Text style={[styles.colValue, { flex: 1.5, textAlign: 'right', fontWeight: '700', color: HorizonColors.primary }]}>
                  ₹{item.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Text>
                <View style={{ flex: 1.2, alignItems: 'center' }}>
                  <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                    <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>{item.status}</Text>
                  </View>
                </View>
                <View style={[styles.actionsColumn, { flex: 1.5 }]}>
                  {onPrintPo && (
                    <Pressable style={styles.actionIconBtn} onPress={() => onPrintPo(item)} hitSlop={6}>
                      <MaterialIcons name="print" size={18} color={HorizonColors.primary} />
                    </Pressable>
                  )}
                  <Pressable style={styles.actionIconBtn} onPress={() => onEdit(item)} hitSlop={6}>
                    <MaterialIcons name="edit" size={18} color={HorizonColors.textMuted} />
                  </Pressable>
                  <Pressable style={styles.actionIconBtn} onPress={() => handleDeleteConfirm(item)} hitSlop={6}>
                    <MaterialIcons name="delete-outline" size={18} color="#EF4444" />
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      );
    }

    // Expense table
    return (
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.columnHeader, { flex: 2 }]}>EXPENSE TITLE</Text>
          <Text style={[styles.columnHeader, { flex: 1.5 }]}>CATEGORY</Text>
          <Text style={[styles.columnHeader, { flex: 1.2 }]}>DATE</Text>
          <Text style={[styles.columnHeader, { flex: 1.5 }]}>PROJECT</Text>
          <Text style={[styles.columnHeader, { flex: 1.5, textAlign: 'right' }]}>AMOUNT</Text>
          <Text style={[styles.columnHeader, { flex: 1.2, textAlign: 'center' }]}>RECEIPT</Text>
          <Text style={[styles.columnHeader, { flex: 1.2, textAlign: 'center' }]}>ACTIONS</Text>
        </View>
        {filteredData.map((item: Expense, index) => {
          const isEven = index % 2 === 0;
          return (
            <View key={item.id} style={[styles.tableRow, isEven ? styles.rowEven : styles.rowOdd]}>
              <Text style={[styles.colValue, { flex: 2, fontWeight: '600' }]} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={[styles.colValue, { flex: 1.5 }]} numberOfLines={1}>
                {item.category}
              </Text>
              <Text style={[styles.colValue, { flex: 1.2 }]}>{item.date}</Text>
              <Text style={[styles.colValue, { flex: 1.5 }]} numberOfLines={1}>
                {item.project}
              </Text>
              <Text style={[styles.colValue, { flex: 1.5, textAlign: 'right', fontWeight: '700', color: '#DC2626' }]}>
                ₹{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </Text>
              <View style={{ flex: 1.2, alignItems: 'center' }}>
                {item.attachmentUrl ? (
                  <Pressable style={styles.receiptLinkBtn} onPress={() => openAttachment(item.attachmentUrl)} hitSlop={6}>
                    <MaterialIcons name="receipt" size={16} color={HorizonColors.primary} />
                    <Text style={styles.receiptLinkText}>View</Text>
                  </Pressable>
                ) : (
                  <Text style={styles.noReceiptText}>—</Text>
                )}
              </View>
              <View style={[styles.actionsColumn, { flex: 1.2 }]}>
                <Pressable style={styles.actionIconBtn} onPress={() => onEdit(item)} hitSlop={6}>
                  <MaterialIcons name="edit" size={18} color={HorizonColors.textMuted} />
                </Pressable>
                <Pressable style={styles.actionIconBtn} onPress={() => handleDeleteConfirm(item)} hitSlop={6}>
                  <MaterialIcons name="delete-outline" size={18} color="#EF4444" />
                </Pressable>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  // RENDER MOBILE CARDS
  const renderMobileCards = () => {
    return (
      <View style={styles.mobileList}>
        {filteredData.map((item) => {
          if (type === 'invoice') {
            const inv = item as Invoice;
            const statusStyle = getStatusStyle(inv.status);
            return (
              <View key={inv.id} style={styles.mobileCard}>
                <View style={styles.mobileCardHeader}>
                  <Text style={styles.mobileCardId}>{inv.invoiceId}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                    <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>{inv.status}</Text>
                  </View>
                </View>

                <Text style={styles.mobileCardClient} numberOfLines={1}>Client: {inv.clientName}</Text>
                
                <View style={styles.mobileCardDates}>
                  <Text style={styles.mobileCardDateText}>Date: {inv.date}</Text>
                  <Text style={styles.mobileCardDateText}>Due: {inv.dueDate}</Text>
                </View>

                <View style={styles.mobileCardFooter}>
                  <Text style={styles.mobileCardTotal}>
                    ₹{inv.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </Text>
                  <View style={styles.mobileCardActions}>
                    {onPrintPo && (
                      <Pressable style={styles.mobileActionBtn} onPress={() => onPrintPo(inv)} hitSlop={8}>
                        <MaterialIcons name="print" size={16} color={HorizonColors.primary} />
                      </Pressable>
                    )}
                    <Pressable style={styles.mobileActionBtn} onPress={() => onEdit(inv)} hitSlop={8}>
                      <MaterialIcons name="edit" size={16} color={HorizonColors.primary} />
                    </Pressable>
                    <Pressable style={[styles.mobileActionBtn, styles.mobileDeleteBtn]} onPress={() => handleDeleteConfirm(inv)} hitSlop={8}>
                      <MaterialIcons name="delete-outline" size={16} color="#EF4444" />
                    </Pressable>
                  </View>
                </View>
              </View>
            );
          }

          if (type === 'quotation') {
            const qtn = item as Quotation;
            const statusStyle = getStatusStyle(qtn.status);
            return (
              <View key={qtn.id} style={styles.mobileCard}>
                <View style={styles.mobileCardHeader}>
                  <Text style={styles.mobileCardId}>{qtn.quoteId}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                    <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>{qtn.status}</Text>
                  </View>
                </View>

                <Text style={styles.mobileCardClient} numberOfLines={1}>Client: {qtn.clientName}</Text>
                
                <View style={styles.mobileCardDates}>
                  <Text style={styles.mobileCardDateText}>Date: {qtn.date}</Text>
                  <Text style={styles.mobileCardDateText}>Valid: {qtn.validUntil}</Text>
                </View>

                <View style={styles.mobileCardFooter}>
                  <Text style={styles.mobileCardTotal}>
                    ₹{qtn.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </Text>
                  <View style={styles.mobileCardActions}>
                    {qtn.status !== 'Converted' && onConvertQuote && (
                      <Pressable style={styles.mobileConvertBtn} onPress={() => onConvertQuote(qtn.id)} hitSlop={8}>
                        <MaterialIcons name="transform" size={14} color={HorizonColors.primary} />
                        <Text style={styles.mobileConvertText}>Invoice</Text>
                      </Pressable>
                    )}
                    {onPrintPo && (
                      <Pressable style={styles.mobileActionBtn} onPress={() => onPrintPo(qtn)} hitSlop={8}>
                        <MaterialIcons name="print" size={16} color={HorizonColors.primary} />
                      </Pressable>
                    )}
                    <Pressable style={styles.mobileActionBtn} onPress={() => onEdit(qtn)} hitSlop={8}>
                      <MaterialIcons name="edit" size={16} color={HorizonColors.primary} />
                    </Pressable>
                    <Pressable style={[styles.mobileActionBtn, styles.mobileDeleteBtn]} onPress={() => handleDeleteConfirm(qtn)} hitSlop={8}>
                      <MaterialIcons name="delete-outline" size={16} color="#EF4444" />
                    </Pressable>
                  </View>
                </View>
              </View>
            );
          }

          if (type === 'purchase_order') {
            const po = item as any;
            const statusStyle = getStatusStyle(po.status);
            return (
              <View key={po.id} style={styles.mobileCard}>
                <View style={styles.mobileCardHeader}>
                  <Text style={styles.mobileCardId}>{po.poId}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                    <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>{po.status}</Text>
                  </View>
                </View>

                <Text style={styles.mobileCardClient} numberOfLines={1}>Supplier: {po.supplierName}</Text>
                
                <View style={styles.mobileCardDates}>
                  <Text style={styles.mobileCardDateText}>Date: {po.date}</Text>
                  <Text style={styles.mobileCardDateText} numberOfLines={1}>Terms: {po.shippingTerms ? (po.shippingTerms.length > 20 ? po.shippingTerms.substring(0, 20) + '...' : po.shippingTerms) : '—'}</Text>
                </View>

                <View style={styles.mobileCardFooter}>
                  <Text style={styles.mobileCardTotal}>
                    ₹{po.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </Text>
                  <View style={styles.mobileCardActions}>
                    {onPrintPo && (
                      <Pressable style={styles.mobileActionBtn} onPress={() => onPrintPo(po)} hitSlop={8}>
                        <MaterialIcons name="print" size={16} color={HorizonColors.primary} />
                      </Pressable>
                    )}
                    <Pressable style={styles.mobileActionBtn} onPress={() => onEdit(po)} hitSlop={8}>
                      <MaterialIcons name="edit" size={16} color={HorizonColors.primary} />
                    </Pressable>
                    <Pressable style={[styles.mobileActionBtn, styles.mobileDeleteBtn]} onPress={() => handleDeleteConfirm(po)} hitSlop={8}>
                      <MaterialIcons name="delete-outline" size={16} color="#EF4444" />
                    </Pressable>
                  </View>
                </View>
              </View>
            );
          }

          // Expense Card
          const exp = item as Expense;
          return (
            <View key={exp.id} style={styles.mobileCard}>
              <View style={styles.mobileCardHeader}>
                <Text style={styles.mobileCardExpenseTitle} numberOfLines={1}>{exp.title}</Text>
                <View style={styles.expenseCategoryBadge}>
                  <Text style={styles.expenseCategoryBadgeText}>{exp.category}</Text>
                </View>
              </View>

              <View style={styles.mobileCardDates}>
                <Text style={styles.mobileCardDateText}>Project: {exp.project}</Text>
                <Text style={styles.mobileCardDateText}>Date: {exp.date}</Text>
              </View>

              <View style={styles.mobileCardFooter}>
                <Text style={[styles.mobileCardTotal, { color: '#DC2626' }]}>
                  ₹{exp.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Text>
                
                <View style={styles.mobileCardActions}>
                  {exp.attachmentUrl ? (
                    <Pressable style={styles.mobileReceiptBtn} onPress={() => openAttachment(exp.attachmentUrl)} hitSlop={8}>
                      <MaterialIcons name="receipt" size={15} color={HorizonColors.primary} />
                      <Text style={styles.mobileReceiptText}>Receipt</Text>
                    </Pressable>
                  ) : null}
                  <Pressable style={styles.mobileActionBtn} onPress={() => onEdit(exp)} hitSlop={8}>
                    <MaterialIcons name="edit" size={16} color={HorizonColors.primary} />
                  </Pressable>
                  <Pressable style={[styles.mobileActionBtn, styles.mobileDeleteBtn]} onPress={() => handleDeleteConfirm(exp)} hitSlop={8}>
                    <MaterialIcons name="delete-outline" size={16} color="#EF4444" />
                  </Pressable>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.card}>
      {/* Search & Filters */}
      <View style={styles.toolbar}>
        <View style={styles.searchWrapper}>
          <MaterialIcons name="search" size={20} color={HorizonColors.iconMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder={
              type === 'expense'
                ? 'Search by title/project/category...'
                : type === 'purchase_order'
                ? 'Search by PO ID/supplier details...'
                : 'Search by ID/client details...'
            }
            placeholderTextColor={HorizonColors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Clear Filters Button */}
        {(searchQuery || statusFilter !== 'All' || categoryFilter !== 'All') && (
          <Pressable onPress={handleResetFilters} style={styles.resetFilterBtn} hitSlop={8}>
            <Text style={styles.resetFilterText}>Clear Filters</Text>
          </Pressable>
        )}
      </View>

      {/* Segmented Filter Pills */}
      {type !== 'expense' ? (
        <View style={styles.filterPillsRow}>
          <Text style={styles.filterLabel}>Filter Status:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPillsScroll}>
            {(type === 'purchase_order'
              ? ['All', 'Draft', 'Sent', 'Approved', 'Cancelled']
              : [
                  'All',
                  'Draft',
                  'Sent',
                  type === 'invoice' ? 'Paid' : 'Converted',
                  type === 'invoice' ? 'Overdue' : 'Expired',
                  'Cancelled',
                ]
            ).map((st) => (
              <Pressable
                key={st}
                onPress={() => setStatusFilter(st)}
                style={[styles.filterPill, statusFilter === st && styles.filterPillActive]}>
                <Text style={[styles.filterPillText, statusFilter === st && styles.filterPillTextActive]}>{st}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : (
        <View style={styles.filterPillsRow}>
          <Text style={styles.filterLabel}>Category:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPillsScroll}>
            {['All', 'Hardware', 'Software Subscriptions', 'Travel', 'Logistics', 'Other'].map((cat) => (
              <Pressable
                key={cat}
                onPress={() => setCategoryFilter(cat)}
                style={[styles.filterPill, categoryFilter === cat && styles.filterPillActive]}>
                <Text style={[styles.filterPillText, categoryFilter === cat && styles.filterPillTextActive]}>{cat}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Documents Render (Desktop Table or Mobile Cards) */}
      {filteredData.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="receipt-long" size={48} color={HorizonColors.iconMuted} />
          <Text style={styles.emptyText}>No financial records found matching filters.</Text>
        </View>
      ) : isDesktop ? (
        <ScrollView horizontal showsHorizontalScrollIndicator style={styles.tableScroll}>
          <View style={{ minWidth: 900 }}>{renderDesktopTable()}</View>
        </ScrollView>
      ) : (
        renderMobileCards()
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: HorizonColors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: HorizonColors.cardBorder,
    shadowColor: '#1E3A5F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
    marginVertical: 12,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: HorizonColors.border,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: HorizonColors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    flex: 1,
    backgroundColor: '#FAFBFD',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: HorizonColors.text,
  },
  resetFilterBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  resetFilterText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
  },
  filterPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: HorizonColors.border,
    gap: 10,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  filterPillsScroll: {
    gap: 8,
  },
  filterPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#FAFBFD',
    borderWidth: 1,
    borderColor: HorizonColors.border,
  },
  filterPillActive: {
    backgroundColor: HorizonColors.primaryLight,
    borderColor: HorizonColors.primary,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: HorizonColors.text,
  },
  filterPillTextActive: {
    color: HorizonColors.primary,
  },
  tableScroll: {
    padding: 8,
  },
  table: {
    width: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1.5,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FAFBFD',
  },
  columnHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  rowEven: {
    backgroundColor: '#FFFFFF',
  },
  rowOdd: {
    backgroundColor: '#FCFDFE',
  },
  colValue: {
    fontSize: 14,
    color: HorizonColors.text,
  },
  clientNameText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E3A5F',
  },
  clientEmailText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  actionsColumn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FAFBFD',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  convertBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  convertBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: HorizonColors.primary,
  },
  receiptLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  receiptLinkText: {
    fontSize: 11,
    fontWeight: '600',
    color: HorizonColors.primary,
  },
  noReceiptText: {
    fontSize: 13,
    color: '#94A3B8',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  mobileList: {
    padding: 16,
    backgroundColor: '#FCFDFE',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  mobileCard: {
    backgroundColor: HorizonColors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: HorizonColors.border,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#1E3A5F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  mobileCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  mobileCardId: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E3A5F',
  },
  mobileCardExpenseTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E3A5F',
    flex: 1,
    marginRight: 8,
  },
  expenseCategoryBadge: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  expenseCategoryBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  mobileCardClient: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
    marginBottom: 4,
  },
  mobileCardDates: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  mobileCardDateText: {
    fontSize: 12,
    color: '#64748B',
  },
  mobileCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  mobileCardTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: HorizonColors.primary,
  },
  mobileCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mobileActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileDeleteBtn: {
    backgroundColor: '#FEE2E2',
  },
  mobileConvertBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  mobileConvertText: {
    fontSize: 11,
    fontWeight: '700',
    color: HorizonColors.primary,
  },
  mobileReceiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  mobileReceiptText: {
    fontSize: 11,
    fontWeight: '700',
    color: HorizonColors.primary,
  },
});
