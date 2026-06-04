/**
 * Premium, highly-responsive inventory table card showing a list of products.
 * Adaptive layout:
 * - Desktop (width >= 768px): Uses a flex-based grid that fits the viewport perfectly with no horizontal scrollbar.
 * - Mobile (width < 768px): Uses a horizontal ScrollView with fixed column widths for comfortable scrolling.
 * Features:
 * - Search bar with filter toggle
 * - Clean 4-column filter row on desktop (2-column on mobile)
 * - Harmonious HSL colors, premium typography, and subtle micro-animations/states.
 */
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useState, useMemo, useEffect } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import { HorizonColors } from '@/constants/horizon';
import { InventoryItem } from '@/types/inventory';

type InventoryTableCardProps = {
  items: InventoryItem[];
  onEdit: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
  onFilteredItemsChange?: (items: InventoryItem[]) => void;
};

const CATEGORIES = ['All', 'Device', 'Electronic',  'General'];

export function InventoryTableCard({
  items,
  onEdit,
  onDelete,
  onFilteredItemsChange,
}: InventoryTableCardProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(true);
  
  // Inline filters
  const [filterName, setFilterName] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterCode, setFilterCode] = useState('');
  const [filterDate, setFilterDate] = useState('');

  // Dropdown visibility for Category filter
  const [showCatDropdown, setShowCatDropdown] = useState(false);

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterName('');
    setFilterCategory('All');
    setFilterCode('');
    setFilterDate('');
  };

  // Filter logic
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // 1. General search bar query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          item.name.toLowerCase().includes(q) ||
          item.code.toLowerCase().includes(q) ||
          item.invoiceNo.toLowerCase().includes(q) ||
          item.project.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }

      // 2. Specific field: Product Name
      if (filterName.trim()) {
        if (!item.name.toLowerCase().includes(filterName.toLowerCase())) {
          return false;
        }
      }

      // 3. Specific field: Category
      if (filterCategory !== 'All') {
        if (item.category.toLowerCase() !== filterCategory.toLowerCase()) {
          return false;
        }
      }

      // 4. Specific field: Code
      if (filterCode.trim()) {
        if (!item.code.toLowerCase().includes(filterCode.toLowerCase())) {
          return false;
        }
      }

      // 5. Specific field: Date
      if (filterDate.trim()) {
        const itemDate = item.date; // e.g. 2026-06-03
        const searchVal = filterDate.trim().toLowerCase();
        
        // Convert item date to DD/MM/YYYY and DD-MM-YYYY formats for comparison
        const parts = itemDate.split('-');
        let dmySlash = '';
        let dmyDash = '';
        if (parts.length === 3) {
          dmySlash = `${parts[2]}/${parts[1]}/${parts[0]}`;
          dmyDash = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        
        const matchesDate =
          itemDate.includes(searchVal) ||
          dmySlash.includes(searchVal) ||
          dmyDash.includes(searchVal);
          
        if (!matchesDate) return false;
      }

      return true;
    });
  }, [items, searchQuery, filterName, filterCategory, filterCode, filterDate]);

  useEffect(() => {
    onFilteredItemsChange?.(filteredItems);
  }, [filteredItems, onFilteredItemsChange]);

  function handleDeletePress(item: InventoryItem) {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${item.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(item.id),
        },
      ],
    );
  }

  // Format date to local DD/MM/YYYY
  function displayDate(isoDate: string) {
    if (!isoDate) return '—';
    try {
      const parts = isoDate.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return isoDate;
    } catch {
      return isoDate;
    }
  }

  // Common Header Row
  const TableHeader = () => (
    <View style={styles.tableHeader}>
      <Text style={[styles.columnHeader, styles.colIndexFlex, { textAlign: 'center' }]}>#</Text>
      <Text style={[styles.columnHeader, styles.colNameFlex]}>NAME</Text>
      <Text style={[styles.columnHeader, styles.colCodeFlex]}>CODE</Text>
      <Text style={[styles.columnHeader, styles.colInvoiceFlex]}>INVOICE</Text>
      <Text style={[styles.columnHeader, styles.colProjectFlex]}>PROJECT</Text>
      <Text style={[styles.columnHeader, styles.colCategoryFlex]}>CATEGORY</Text>
      <Text style={[styles.columnHeader, styles.colQtyFlex, { textAlign: 'center' }]}>QTY</Text>
      <Text style={[styles.columnHeader, styles.colPriceFlex, { textAlign: 'right' }]}>PRICE</Text>
      <Text style={[styles.columnHeader, styles.colDateFlex, { textAlign: 'center' }]}>DATE</Text>
      <Text style={[styles.columnHeader, styles.colActionsFlex, { textAlign: 'center' }]}>ACTION</Text>
    </View>
  );

  // Common Row Renderer
  const TableRow = ({ item, index }: { item: InventoryItem; index: number }) => {
    const isEven = index % 2 === 0;
    return (
      <View style={[styles.tableRow, isEven ? styles.rowEven : styles.rowOdd]}>
        {/* Index Column */}
        <Text style={[styles.colValue, styles.colIndexFlex, styles.indexText]}>
          {index + 1}
        </Text>

        {/* Name Column */}
        <View style={[styles.colNameFlex, styles.nameWrapper]}>
          <View style={styles.thumbnail}>
            <MaterialIcons name="insert-photo" size={16} color={HorizonColors.iconMuted} />
          </View>
          <Text style={styles.productName} numberOfLines={1}>
            {item.name}
          </Text>
        </View>

        {/* Code Column */}
        <Text style={[styles.colValue, styles.colCodeFlex, styles.codeText]}>
          {item.code}
        </Text>

        {/* Invoice Column */}
        <Text style={[styles.colValue, styles.colInvoiceFlex]} numberOfLines={1}>
          {item.invoiceNo}
        </Text>

        {/* Project Column */}
        <Text style={[styles.colValue, styles.colProjectFlex, styles.projectText]} numberOfLines={1}>
          {item.project}
        </Text>

        {/* Category Column */}
        <Text style={[styles.colValue, styles.colCategoryFlex]} numberOfLines={1}>
          {item.category}
        </Text>

        {/* Quantity Column */}
        <Text style={[styles.colValue, styles.colQtyFlex, styles.qtyText]}>
          {item.quantity}
        </Text>

        {/* Price Column */}
        <Text style={[styles.colValue, styles.colPriceFlex, styles.priceText]}>
          ₹{item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>

        {/* Date Column */}
        <Text style={[styles.colValue, styles.colDateFlex, styles.dateText]}>
          {displayDate(item.date)}
        </Text>

        {/* Actions Column */}
        <View style={[styles.colActionsFlex, styles.actionsRow]}>
          <Pressable style={styles.actionIconBtn} hitSlop={8} onPress={() => onEdit(item)}>
            <MaterialIcons name="edit" size={18} color={HorizonColors.textMuted} />
          </Pressable>
          <Pressable style={styles.actionIconBtn} hitSlop={8} onPress={() => handleDeletePress(item)}>
            <MaterialIcons name="delete-outline" size={18} color="#EF4444" />
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.card}>
      {/* Search & Action Bar */}
      <View style={styles.toolbar}>
        <View style={styles.searchWrapper}>
          <MaterialIcons name="search" size={20} color={HorizonColors.iconMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor={HorizonColors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <View style={styles.actionButtons}>
          {!!(filterName || filterCategory !== 'All' || filterCode || filterDate || searchQuery) && (
            <Pressable onPress={handleResetFilters} style={styles.resetFilterBtn} hitSlop={8}>
              <Text style={styles.resetFilterText}>Clear Filters</Text>
            </Pressable>
          )}
          <Pressable
            onPress={() => setShowFilters(!showFilters)}
            style={[styles.filterToggleBtn, showFilters && styles.filterToggleActive]}>
            <MaterialIcons
              name="filter-list"
              size={20}
              color={showFilters ? HorizonColors.primary : HorizonColors.text}
            />
          </Pressable>
        </View>
      </View>

      {/* Collapsible Filter Section */}
      {showFilters ? (
        <View style={styles.filtersContainer}>
          <View style={styles.filterRow}>
            {/* Filter Name */}
            <View style={[styles.filterField, isDesktop ? { flex: 1 } : { width: '47%' }]}>
              <Text style={styles.filterLabel}>Product Name</Text>
              <TextInput
                style={styles.filterInput}
                placeholder="Enter product name"
                placeholderTextColor={HorizonColors.textMuted}
                value={filterName}
                onChangeText={setFilterName}
              />
            </View>

            {/* Filter Category */}
            <View style={[styles.filterField, isDesktop ? { flex: 1 } : { width: '47%' }, { zIndex: 10 }]}>
              <Text style={styles.filterLabel}>Category</Text>
              <View style={{ position: 'relative', zIndex: 20 }}>
                <Pressable
                  style={styles.dropdownSelector}
                  onPress={() => setShowCatDropdown(!showCatDropdown)}>
                  <Text style={[styles.dropdownValue, filterCategory === 'All' && { color: HorizonColors.textMuted }]}>
                    {filterCategory === 'All' ? 'Select category' : filterCategory}
                  </Text>
                  <MaterialIcons name="keyboard-arrow-down" size={18} color={HorizonColors.textMuted} />
                </Pressable>

                {showCatDropdown ? (
                  <View style={styles.dropdownList}>
                    {CATEGORIES.map((cat) => (
                      <Pressable
                        key={cat}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setFilterCategory(cat);
                          setShowCatDropdown(false);
                        }}>
                        <Text style={[styles.dropdownItemText, filterCategory === cat && styles.dropdownItemTextActive]}>
                          {cat === 'All' ? 'All Categories' : cat}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </View>
            </View>

            {/* Filter Code */}
            <View style={[styles.filterField, isDesktop ? { flex: 1 } : { width: '47%' }]}>
              <Text style={styles.filterLabel}>Code</Text>
              <TextInput
                style={styles.filterInput}
                placeholder="Enter your code"
                placeholderTextColor={HorizonColors.textMuted}
                value={filterCode}
                onChangeText={setFilterCode}
              />
            </View>

            {/* Filter Date */}
            <View style={[styles.filterField, isDesktop ? { flex: 1 } : { width: '47%' }]}>
              <Text style={styles.filterLabel}>Date</Text>
              <View style={styles.dateInputContainer}>
                <TextInput
                  style={[styles.filterInput, styles.dateInput]}
                  placeholder="Select date"
                  placeholderTextColor={HorizonColors.textMuted}
                  value={filterDate}
                  onChangeText={setFilterDate}
                />
                <MaterialIcons name="calendar-today" size={16} color={HorizonColors.iconMuted} style={styles.calendarIcon} />
              </View>
            </View>
          </View>
        </View>
      ) : null}

      {/* Spreadsheet / Data Table with horizontal scroll support on all viewports */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={true}
        contentContainerStyle={{ flexGrow: 1 }}
        style={styles.tableScroll}
      >
        <View style={[styles.table, { minWidth: 920, width: '100%' }]}>
          <TableHeader />
          {filteredItems.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="inventory" size={48} color={HorizonColors.iconMuted} />
              <Text style={styles.emptyText}>No products found matching filters.</Text>
            </View>
          ) : (
            filteredItems.map((item, index) => (
              <TableRow key={item.id} item={item} index={index} />
            ))
          )}
        </View>
      </ScrollView>
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
    overflow: 'visible',
    marginVertical: 16,
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
    outlineStyle: 'none', // Remove focus ring on web
  } as any,
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resetFilterBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  resetFilterText: {
    fontSize: 13,
    fontWeight: '600',
    color: HorizonColors.primary,
  },
  filterToggleBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: HorizonColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFBFD',
  },
  filterToggleActive: {
    borderColor: HorizonColors.primary,
    backgroundColor: HorizonColors.primaryLight,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: HorizonColors.border,
    backgroundColor: '#FCFDFE',
    position: 'relative',
    zIndex: 50,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  filterField: {
    gap: 6,
    position: 'relative',
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: HorizonColors.text,
  },
  filterInput: {
    borderWidth: 1,
    borderColor: HorizonColors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
    fontSize: 13,
    color: HorizonColors.text,
    backgroundColor: HorizonColors.white,
    outlineStyle: 'none',
  } as any,
  dropdownSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: HorizonColors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: HorizonColors.white,
    height: 40,
  },
  dropdownValue: {
    fontSize: 13,
    color: HorizonColors.text,
  },
  dropdownList: {
    position: 'absolute',
    top: 42,
    left: 0,
    right: 0,
    backgroundColor: HorizonColors.white,
    borderWidth: 1,
    borderColor: HorizonColors.border,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    padding: 4,
    zIndex: 100,
  },
  dropdownItem: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  dropdownItemText: {
    fontSize: 13,
    color: HorizonColors.text,
  },
  dropdownItemTextActive: {
    fontWeight: '600',
    color: HorizonColors.primary,
  },
  dateInputContainer: {
    position: 'relative',
    justifyContent: 'center',
  },
  dateInput: {
    paddingRight: 32,
    width: '100%',
  },
  calendarIcon: {
    position: 'absolute',
    right: 10,
  },
  tableScroll: {
    flexDirection: 'column',
  },
  table: {
    flexDirection: 'column',
    width: '100%',
  },

  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: HorizonColors.border,
  },
  columnHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: HorizonColors.textMuted,
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: HorizonColors.border,
  },
  rowEven: {
    backgroundColor: HorizonColors.white,
  },
  rowOdd: {
    backgroundColor: '#FAFBFD',
  },
  colValue: {
    fontSize: 13,
    color: HorizonColors.text,
  },
  
  // Responsive Width Definitions - DESKTOP (FLEX)
  colIndexFlex: { flex: 0.35 },
  colNameFlex: { flex: 2 },
  colCodeFlex: { flex: 0.9 },
  colInvoiceFlex: { flex: 1 },
  colProjectFlex: { flex: 1.2 },
  colCategoryFlex: { flex: 1 },
  colQtyFlex: { flex: 0.6, textAlign: 'center' },
  colPriceFlex: { flex: 0.9, textAlign: 'right' },
  colDateFlex: { flex: 1, textAlign: 'center' },
  colActionsFlex: { flex: 0.8, textAlign: 'center' },



  nameWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  thumbnail: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: HorizonColors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productName: {
    fontSize: 13,
    fontWeight: '600',
    color: HorizonColors.text,
    flex: 1,
  },
  codeText: {
    fontWeight: '500',
    color: HorizonColors.textMuted,
  },
  projectText: {
    color: HorizonColors.primary,
    fontWeight: '500',
  },
  qtyText: {
    textAlign: 'center',
  },
  priceText: {
    textAlign: 'right',
    fontWeight: '600',
    color: HorizonColors.text,
  },
  dateText: {
    textAlign: 'center',
  },
  indexText: {
    textAlign: 'center',
    color: HorizonColors.textMuted,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  actionIconBtn: {
    padding: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 56,
    gap: 12,
    width: '100%',
  },
  emptyText: {
    fontSize: 14,
    color: HorizonColors.textMuted,
  },
});
