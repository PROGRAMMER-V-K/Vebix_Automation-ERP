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

// Robust date parsing helper for DD/MM/YYYY, MM/DD/YYYY, and YYYY-MM-DD formats
function parseItemDate(dateStr: string): { year: number; month: number } | null {
  if (!dateStr) return null;
  const trimmed = dateStr.trim();
  let parts: string[] = [];

  if (trimmed.includes('-')) {
    parts = trimmed.split('-');
  } else if (trimmed.includes('/')) {
    parts = trimmed.split('/');
  } else {
    return null;
  }

  if (parts.length !== 3) return null;

  let y = 0;
  let m = 0; // 1-indexed initially

  // Check if year is at the beginning (e.g. YYYY-MM-DD)
  if (parts[0].length === 4) {
    y = parseInt(parts[0], 10);
    m = parseInt(parts[1], 10);
  } else {
    // Year is at the end (e.g. DD/MM/YYYY or MM/DD/YYYY)
    y = parseInt(parts[2], 10);
    const valA = parseInt(parts[0], 10);
    const valB = parseInt(parts[1], 10);

    if (isNaN(valA) || isNaN(valB) || isNaN(y)) return null;

    if (valA > 12 && valB <= 12) {
      // Format must be DD/MM/YYYY
      m = valB;
    } else if (valB > 12 && valA <= 12) {
      // Format must be MM/DD/YYYY
      m = valA;
    } else {
      // Both <= 12, default to DD/MM/YYYY
      m = valB;
    }
  }

  if (isNaN(y) || isNaN(m) || m < 1 || m > 12) return null;
  return { year: y, month: m - 1 };
}

type InventoryTableCardProps = {
  items: InventoryItem[];
  onEdit: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
  onFilteredItemsChange?: (items: InventoryItem[]) => void;
  selectedProjects: string[];
  onSelectedProjectsChange: (projects: string[]) => void;
  selectedMonth: string | null;
  onSelectedMonthChange: (month: string | null) => void;
};

const LOCATIONS = ['All', 'IN', 'OUT'];

export function InventoryTableCard({
  items,
  onEdit,
  onDelete,
  onFilteredItemsChange,
  selectedProjects,
  onSelectedProjectsChange,
  selectedMonth,
  onSelectedMonthChange,
}: InventoryTableCardProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(true);
  
  // Inline filters
  const [filterName, setFilterName] = useState('');
  const [filterLocation, setFilterLocation] = useState('All');
  const [filterCode, setFilterCode] = useState('');
  const [filterDate, setFilterDate] = useState('');

  // Dropdown visibility for Location filter
  const [showLocDropdown, setShowLocDropdown] = useState(false);

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterName('');
    setFilterLocation('All');
    setFilterCode('');
    setFilterDate('');
    onSelectedProjectsChange([]);
    onSelectedMonthChange(null);
  };

  // Filter logic for general queries (sent to Analytics component)
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
          item.location.toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }

      // 2. Specific field: Product Name
      if (filterName.trim()) {
        if (!item.name.toLowerCase().includes(filterName.toLowerCase())) {
          return false;
        }
      }

      // 3. Specific field: Location
      if (filterLocation !== 'All') {
        if (item.location.toLowerCase() !== filterLocation.toLowerCase()) {
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
  }, [items, searchQuery, filterName, filterLocation, filterCode, filterDate]);

  // Table items filtered by selected projects & selected month
  const tableFilteredItems = useMemo(() => {
    let result = filteredItems;

    if (selectedProjects.length > 0) {
      result = result.filter((item) => {
        const proj = item.project.trim() || '-';
        return selectedProjects.includes(proj);
      });
    }

    if (selectedMonth) {
      result = result.filter((item) => {
        const parsed = parseItemDate(item.date);
        if (!parsed) return false;
        const key = `${parsed.year}-${String(parsed.month + 1).padStart(2, '0')}`;
        return key === selectedMonth;
      });
    }

    return result;
  }, [filteredItems, selectedProjects, selectedMonth]);

  useEffect(() => {
    const handler = setTimeout(() => {
      onFilteredItemsChange?.(filteredItems);
    }, 250);

    return () => {
      clearTimeout(handler);
    };
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
      <Text style={[styles.columnHeader, styles.colCategoryFlex]}>LOCATION</Text>
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

        {/* Location Column */}
        <Text style={[styles.colValue, styles.colCategoryFlex]} numberOfLines={1}>
          {item.location}
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

  // Mobile Card Renderer for native-friendly mobile viewports
  const MobileItemCard = ({ item }: { item: InventoryItem }) => {
    return (
      <View style={styles.mobileCard}>
        {/* Name and Code badge */}
        <View style={styles.mobileCardHeader}>
          <Text style={styles.mobileCardName} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.mobileCardCodeBadge}>
            <Text style={styles.mobileCardCodeText}>{item.code}</Text>
          </View>
        </View>

        {/* Project, Invoice No tags */}
        <View style={styles.mobileCardInfoRow}>
          <View style={styles.mobileCardTag}>
            <MaterialIcons name="business" size={14} color={HorizonColors.textMuted} />
            <Text style={styles.mobileCardTagText} numberOfLines={1}>
              {item.project || '—'}
            </Text>
          </View>
          <View style={styles.mobileCardTag}>
            <MaterialIcons name="receipt" size={14} color={HorizonColors.textMuted} />
            <Text style={styles.mobileCardTagText} numberOfLines={1}>
              {item.invoiceNo || '—'}
            </Text>
          </View>
        </View>

        {/* Quantity, Location, Price, and Actions row */}
        <View style={styles.mobileCardFooter}>
          <View style={styles.mobileCardStats}>
            <Text style={styles.mobileCardPrice}>
              ₹{item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
            <View style={styles.mobileCardBadges}>
              <View style={styles.mobileQtyBadge}>
                <Text style={styles.mobileQtyText}>Qty: {item.quantity}</Text>
              </View>
              <View style={[
                styles.mobileLocBadge,
                item.location === 'IN' ? styles.mobileLocIn : styles.mobileLocOut
              ]}>
                <Text style={[
                  styles.mobileLocText,
                  item.location === 'IN' ? styles.mobileLocInText : styles.mobileLocOutText
                ]}>
                  {item.location}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.mobileCardActions}>
            <Pressable style={styles.mobileActionBtn} hitSlop={8} onPress={() => onEdit(item)}>
              <MaterialIcons name="edit" size={16} color={HorizonColors.primary} />
            </Pressable>
            <Pressable style={[styles.mobileActionBtn, styles.mobileDeleteBtn]} hitSlop={8} onPress={() => handleDeletePress(item)}>
              <MaterialIcons name="delete-outline" size={16} color="#EF4444" />
            </Pressable>
          </View>
        </View>

        <Text style={styles.mobileCardDate}>Date: {displayDate(item.date)}</Text>
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
          {!!(filterName || filterLocation !== 'All' || filterCode || filterDate || searchQuery || selectedProjects.length > 0 || selectedMonth) && (
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

      {/* Active Project Filter Pills */}
      {selectedProjects.length > 0 ? (
        <View style={styles.activeProjectsRow}>
          <Text style={styles.activeProjectsLabel}>Filtering Projects:</Text>
          <View style={styles.activeProjectsPillList}>
            {selectedProjects.map((proj) => (
              <Pressable
                key={proj}
                onPress={() => onSelectedProjectsChange(selectedProjects.filter((p) => p !== proj))}
                style={styles.projectPill}
              >
                <Text style={styles.projectPillText}>{proj}</Text>
                <MaterialIcons name="close" size={12} color={HorizonColors.primary} />
              </Pressable>
            ))}
            <Pressable
              onPress={() => onSelectedProjectsChange([])}
              style={styles.clearProjectsBtn}
            >
              <Text style={styles.clearProjectsBtnText}>Clear Project Filters</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {/* Active Month Filter Pill */}
      {selectedMonth ? (
        <View style={styles.activeMonthRow}>
          <Text style={styles.activeMonthLabel}>Selected Month:</Text>
          <View style={styles.activeMonthPillList}>
            <Pressable
              onPress={() => onSelectedMonthChange(null)}
              style={styles.monthPill}
            >
              <Text style={styles.monthPillText}>{selectedMonth}</Text>
              <MaterialIcons name="close" size={12} color={HorizonColors.primary} />
            </Pressable>
          </View>
        </View>
      ) : null}

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

            {/* Filter Location */}
            <View style={[styles.filterField, isDesktop ? { flex: 1 } : { width: '47%' }, { zIndex: 10 }]}>
              <Text style={styles.filterLabel}>Location</Text>
              <View style={{ position: 'relative', zIndex: 20 }}>
                <Pressable
                  style={styles.dropdownSelector}
                  onPress={() => setShowLocDropdown(!showLocDropdown)}>
                  <Text style={[styles.dropdownValue, filterLocation === 'All' && { color: HorizonColors.textMuted }]}>
                    {filterLocation === 'All' ? 'Select location' : filterLocation}
                  </Text>
                  <MaterialIcons name="keyboard-arrow-down" size={18} color={HorizonColors.textMuted} />
                </Pressable>

                {showLocDropdown ? (
                  <View style={styles.dropdownList}>
                    {LOCATIONS.map((loc) => (
                      <Pressable
                        key={loc}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setFilterLocation(loc);
                          setShowLocDropdown(false);
                        }}>
                        <Text style={[styles.dropdownItemText, filterLocation === loc && styles.dropdownItemTextActive]}>
                          {loc === 'All' ? 'All Locations' : loc}
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

      {/* Spreadsheet / Data Table on desktop, Card-based list on mobile */}
      {isDesktop ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={true}
          contentContainerStyle={{ flexGrow: 1 }}
          style={styles.tableScroll}
        >
          <View style={[styles.table, { minWidth: 920, width: '100%' }]}>
            <TableHeader />
            {tableFilteredItems.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialIcons name="inventory" size={48} color={HorizonColors.iconMuted} />
                <Text style={styles.emptyText}>No products found matching filters.</Text>
              </View>
            ) : (
              tableFilteredItems.map((item, index) => (
                <TableRow key={item.id} item={item} index={index} />
              ))
            )}
          </View>
        </ScrollView>
      ) : (
        <View style={styles.mobileListContainer}>
          {tableFilteredItems.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="inventory" size={48} color={HorizonColors.iconMuted} />
              <Text style={styles.emptyText}>No products found matching filters.</Text>
            </View>
          ) : (
            tableFilteredItems.map((item) => (
              <MobileItemCard key={item.id} item={item} />
            ))
          )}
        </View>
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
  activeProjectsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 8,
  },
  activeProjectsLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  activeProjectsPillList: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  projectPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: HorizonColors.primaryLight,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    gap: 6,
  },
  projectPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E3A5F',
  },
  clearProjectsBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  clearProjectsBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },
  activeMonthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 8,
  },
  activeMonthLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  activeMonthPillList: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  monthPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: HorizonColors.primaryLight,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    gap: 6,
  },
  monthPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E3A5F',
  },
  mobileListContainer: {
    padding: 16,
    backgroundColor: '#FCFDFE',
  },
  mobileCard: {
    backgroundColor: HorizonColors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: HorizonColors.border,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#1E3A5F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 2,
  },
  mobileCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  },
  mobileCardName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E3A5F',
    flex: 1,
  },
  mobileCardCodeBadge: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  mobileCardCodeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  mobileCardInfoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  mobileCardTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FAFBFD',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    maxWidth: 150,
  },
  mobileCardTagText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  mobileCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
    marginTop: 2,
  },
  mobileCardStats: {
    gap: 6,
    flex: 1,
  },
  mobileCardPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E3A5F',
  },
  mobileCardBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mobileQtyBadge: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  mobileQtyText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563EB',
  },
  mobileLocBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  mobileLocIn: {
    backgroundColor: '#DCFCE7',
  },
  mobileLocOut: {
    backgroundColor: '#FEE2E2',
  },
  mobileLocText: {
    fontSize: 11,
    fontWeight: '700',
  },
  mobileLocInText: {
    color: '#16A34A',
  },
  mobileLocOutText: {
    color: '#EF4444',
  },
  mobileCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mobileActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileDeleteBtn: {
    backgroundColor: '#FEE2E2',
  },
  mobileCardDate: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 8,
    textAlign: 'right',
  },
});
