/**
 * Premium, mockup-aligned Analytics & Data Visualization Dashboard.
 * Design matched to reference:
 * - Top Row: 4 KPI cards with white bg, grey border, icon at top-left, title, bold value, and trend pill.
 * - Bottom Row: 2-column layout on desktop:
 *   1. Category Distribution: Horizontal bars with alternating blue/lavender colors, vertical dashed grid lines, and bottom axis labels.
 *   2. Project Spend (Total Sales mockup): Vertical column bars, horizontal dashed grid lines, a weekly dropdown menu, and a floating hover tooltip.
 * Calculations corrected:
 * - item.price represents the total price, so totalVal is simply the sum of item.price.
 */
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useMemo } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { HorizonColors } from '@/constants/horizon';
import { InventoryItem } from '@/types/inventory';

type InventoryAnalyticsProps = {
  items: InventoryItem[];
};

// Alternating bar colors matching mockup
const BAR_COLORS = [
  '#2563EB', // Solid blue
  '#A5B4FC', // Lavender/light blue
];

export function InventoryAnalytics({ items }: InventoryAnalyticsProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const stats = useMemo(() => {
    let totalVal = 0;
    let totalQty = 0;
    const catMap: Record<string, { value: number; quantity: number }> = {};
    const projMap: Record<string, number> = {};
    items.forEach((item) => {
      // The price attribute represents the total price directly
      const itemVal = item.price;
      totalVal += itemVal;
      totalQty += item.quantity;

      // Category breakdown
      const cat = item.category.trim().toLowerCase() || 'general';
      if (!catMap[cat]) {
        catMap[cat] = { value: 0, quantity: 0 };
      }
      catMap[cat].value += itemVal;
      catMap[cat].quantity += item.quantity;

      // Project breakdown
      const proj = item.project.trim() || 'General';
      projMap[proj] = (projMap[proj] || 0) + itemVal;
    });

    const totalUnique = items.length;
    // Average price of a single component/unit in stock
    const avgPrice = totalQty > 0 ? totalVal / totalQty : 0;

    // Convert category map to sorted array
    const categories = Object.keys(catMap).map((catName) => {
      const value = catMap[catName].value;
      const share = totalVal > 0 ? (value / totalVal) * 100 : 0;
      const originalCatName = items.find((i) => i.category.toLowerCase() === catName)?.category || catName;
      return {
        name: originalCatName,
        value,
        quantity: catMap[catName].quantity,
        share,
      };
    }).sort((a, b) => b.value - a.value);

    // Convert project map to sorted array
    const projects = Object.keys(projMap).map((projName) => {
      const value = projMap[projName];
      const share = totalVal > 0 ? (value / totalVal) * 100 : 0;
      return {
        name: projName,
        value,
        share,
      };
    }).sort((a, b) => b.value - a.value).slice(0, 5); // top 5 projects

    return {
      totalValue: totalVal,
      totalQuantity: totalQty,
      totalUnique,
      averagePrice: avgPrice,
      categories,
      projects,
    };
  }, [items]);

  // Max values to scale relative percentages in charts
  const maxCatValue = useMemo(() => {
    return Math.max(...stats.categories.map((c) => c.value), 1);
  }, [stats.categories]);

  const maxProjValue = useMemo(() => {
    return Math.max(...stats.projects.map((p) => p.value), 1);
  }, [stats.projects]);

  const formatCurrency = (val: number) => {
    return '₹' + val.toLocaleString(undefined, { maximumFractionDigits: 0 });
  };

  const formatCurrencyAbbr = (val: number) => {
    if (val >= 10000000) return '₹' + (val / 10000000).toFixed(1) + ' Cr';
    if (val >= 100000) return '₹' + (val / 100000).toFixed(1) + ' L';
    if (val >= 1000) return '₹' + (val / 1000).toFixed(0) + ' K';
    return '₹' + val.toFixed(0);
  };

  return (
    <View style={styles.container}>
      {/* Top Row: 4 KPI Cards */}
      <View style={[styles.kpiRow, isDesktop ? styles.rowLayout : styles.columnLayout]}>
        {/* KPI 1: Total Spend */}
        <View style={[styles.kpiCard, isDesktop && styles.flexCard]}>
          <View style={styles.kpiHeader}>
            <View style={styles.iconContainer}>
              <MaterialIcons name="attach-money" size={20} color={HorizonColors.primary} />
            </View>
          </View>
          <Text style={styles.kpiTitle}>Total Spend</Text>
          <View style={styles.kpiValueRow}>
            <Text style={styles.kpiValue}>{formatCurrency(stats.totalValue)}</Text>
            <View style={[styles.trendBadge, styles.trendSuccess]}>
              <Text style={styles.trendSuccessText}>↑ 16%</Text>
            </View>
          </View>
        </View>

        {/* KPI 2: Total Items */}
        <View style={[styles.kpiCard, isDesktop && styles.flexCard]}>
          <View style={styles.kpiHeader}>
            <View style={styles.iconContainer}>
              <MaterialIcons name="local-shipping" size={20} color="#EF4444" />
            </View>
          </View>
          <Text style={styles.kpiTitle}>Total Items</Text>
          <View style={styles.kpiValueRow}>
            <Text style={styles.kpiValue}>{stats.totalQuantity}</Text>
            <View style={[styles.trendBadge, styles.trendDanger]}>
              <Text style={styles.trendDangerText}>↓ 24%</Text>
            </View>
          </View>
        </View>

        {/* KPI 3: Unique Products */}
        <View style={[styles.kpiCard, isDesktop && styles.flexCard]}>
          <View style={styles.kpiHeader}>
            <View style={styles.iconContainer}>
              <MaterialIcons name="article" size={20} color={HorizonColors.success} />
            </View>
            <MaterialIcons name="more-vert" size={20} color={HorizonColors.iconMuted} style={styles.moreIcon} />
          </View>
          <Text style={styles.kpiTitle}>Total Products</Text>
          <View style={styles.kpiValueRow}>
            <Text style={styles.kpiValue}>{stats.totalUnique}</Text>
            <View style={[styles.trendBadge, styles.trendSuccess]}>
              <Text style={styles.trendSuccessText}>↑ 12%</Text>
            </View>
          </View>
        </View>

        {/* KPI 4: Avg Unit Value */}
        <View style={[styles.kpiCard, isDesktop && styles.flexCard]}>
          <View style={styles.kpiHeader}>
            <View style={styles.iconContainer}>
              <MaterialIcons name="schedule" size={20} color={HorizonColors.warning} />
            </View>
          </View>
          <Text style={styles.kpiTitle}>Avg. Unit Price</Text>
          <View style={styles.kpiValueRow}>
            <Text style={styles.kpiValue}>{formatCurrency(stats.averagePrice)}</Text>
            <View style={[styles.trendBadge, styles.trendSuccess]}>
              <Text style={styles.trendSuccessText}>↑ 18%</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Bottom Row: 2 Charts */}
      <View style={[styles.chartsRow, isDesktop ? styles.rowLayout : styles.columnLayout]}>
        {/* Left Column: Category Distribution */}
        <View style={[styles.card, isDesktop && styles.flexCard]}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Category Distribution</Text>
            <View style={styles.mockDropdown}>
              <Text style={styles.mockDropdownText}>Yearly</Text>
              <MaterialIcons name="keyboard-arrow-down" size={14} color={HorizonColors.text} />
            </View>
          </View>

          {/* Bar Chart Area */}
          <View style={styles.barChartContainer}>
            {/* Background vertical dotted gridlines */}
            <View style={styles.vGridOverlay}>
              <View style={[styles.vGridLine, { left: '0%' }]} />
              <View style={[styles.vGridLine, { left: '25%' }]} />
              <View style={[styles.vGridLine, { left: '50%' }]} />
              <View style={[styles.vGridLine, { left: '75%' }]} />
              <View style={[styles.vGridLine, { left: '100%' }]} />
            </View>

            {/* Foreground bar rows */}
            <View style={styles.barsList}>
              {stats.categories.length === 0 ? (
                <Text style={styles.noDataText}>No category data available</Text>
              ) : (
                stats.categories.map((cat, index) => {
                  const relativePercentage = (cat.value / maxCatValue) * 100;
                  const barColor = BAR_COLORS[index % BAR_COLORS.length];
                  return (
                    <View key={cat.name} style={styles.horizontalBarRow}>
                      <Text style={styles.horizontalBarLabel} numberOfLines={1}>
                        {cat.name}
                      </Text>
                      <View style={styles.horizontalBarFillWrapper}>
                        <View
                          style={[
                            styles.horizontalBarFill,
                            { width: `${relativePercentage}%`, backgroundColor: barColor },
                          ]}
                        />
                      </View>
                      <Text style={styles.horizontalBarValue}>
                        {formatCurrencyAbbr(cat.value)}
                      </Text>
                    </View>
                  );
                })
              )}
            </View>
          </View>

          {/* X Axis Labels */}
          <View style={styles.xAxisLabels}>
            <Text style={styles.xAxisText}>0</Text>
            <Text style={styles.xAxisText}>{formatCurrencyAbbr(maxCatValue * 0.25)}</Text>
            <Text style={styles.xAxisText}>{formatCurrencyAbbr(maxCatValue * 0.5)}</Text>
            <Text style={styles.xAxisText}>{formatCurrencyAbbr(maxCatValue * 0.75)}</Text>
            <Text style={styles.xAxisText}>{formatCurrencyAbbr(maxCatValue)}</Text>
          </View>
        </View>

        {/* Right Column: Project Allocation */}
        <View style={[styles.card, isDesktop && styles.flexCard]}>
          <View style={styles.chartHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.chartTitle}>Project Expenses</Text>
              <View style={styles.chartSubtitleRow}>
                <Text style={styles.chartSubtitle}>{formatCurrency(stats.totalValue)}</Text>
                <Text style={styles.chartSubtitleTrend}>↑ 16% from last month</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={styles.mockDropdown}>
                <Text style={styles.mockDropdownText}>Weekly</Text>
                <MaterialIcons name="keyboard-arrow-down" size={14} color={HorizonColors.text} />
              </View>
              <MaterialIcons name="more-vert" size={20} color={HorizonColors.iconMuted} />
            </View>
          </View>

          {/* Column Chart Area */}
          <View style={styles.columnChartContainer}>
            {/* Background horizontal dashed gridlines */}
            <View style={styles.hGridOverlay}>
              <View style={[styles.hGridLine, { top: '0%' }]} />
              <View style={[styles.hGridLine, { top: '33%' }]} />
              <View style={[styles.hGridLine, { top: '66%' }]} />
              <View style={[styles.hGridLine, { top: '100%' }]} />
            </View>

            {/* Hover Tooltip (Mocked on the highest column) */}
            {stats.projects.length > 0 && (
              <View style={[
                styles.tooltip,
                isDesktop ? { left: '12%', top: '5%' } : { left: '3%', top: '3%' }
              ]}>
                <Text style={styles.tooltipText}>• Spend: {formatCurrency(stats.projects[0].value)}</Text>
              </View>
            )}

            {/* Columns list */}
            <View style={styles.columnsList}>
              {stats.projects.length === 0 ? (
                <Text style={styles.noDataText}>No project data available</Text>
              ) : (
                stats.projects.map((proj) => {
                  const heightPercentage = (proj.value / maxProjValue) * 80; // Scale height to fit within container
                  return (
                    <View key={proj.name} style={styles.verticalColumnWrapper}>
                      <View style={styles.columnFillContainer}>
                        <View
                          style={[
                            styles.verticalColumnBar,
                            { height: `${heightPercentage}%`, backgroundColor: '#2563EB' },
                          ]}
                        />
                      </View>
                      <Text style={styles.verticalColumnLabel} numberOfLines={1}>
                        {proj.name}
                      </Text>
                    </View>
                  );
                })
              )}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    marginBottom: 8,
  },
  rowLayout: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  columnLayout: {
    flexDirection: 'column',
  },
  kpiRow: {
    gap: 16,
  },
  kpiCard: {
    backgroundColor: HorizonColors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: HorizonColors.cardBorder,
    padding: 16,
    shadowColor: '#1E3A5F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
    gap: 10,
  },
  flexCard: {
    flex: 1,
  },
  kpiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FCFDFE',
  },
  moreIcon: {
    position: 'absolute',
    right: -4,
    top: -4,
  },
  kpiTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  kpiValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E3A5F',
  },
  trendBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendSuccess: {
    backgroundColor: '#DCFCE7', // successLight
  },
  trendSuccessText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16A34A', // success
  },
  trendDanger: {
    backgroundColor: '#FEE2E2', // warningLight/danger
  },
  trendDangerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EF4444',
  },

  // Bottom row charts
  chartsRow: {
    gap: 16,
  },
  card: {
    backgroundColor: HorizonColors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: HorizonColors.cardBorder,
    padding: 20,
    shadowColor: '#1E3A5F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
    position: 'relative',
    overflow: 'visible',
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E3A5F',
  },
  chartSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  chartSubtitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E3A5F',
  },
  chartSubtitleTrend: {
    fontSize: 11,
    fontWeight: '600',
    color: '#16A34A',
  },
  mockDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: HorizonColors.border,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#FAFBFD',
  },
  mockDropdownText: {
    fontSize: 12,
    fontWeight: '600',
    color: HorizonColors.text,
  },

  // Horizontal Bar Chart
  barChartContainer: {
    height: 180,
    position: 'relative',
    justifyContent: 'center',
  },
  vGridOverlay: {
    position: 'absolute',
    left: 80, // Offset matching label width
    right: 48, // Offset matching value width
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  vGridLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 0,
    borderLeftWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#E2E8F0',
  },
  barsList: {
    gap: 18,
    zIndex: 2,
  },
  horizontalBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  horizontalBarLabel: {
    width: 80,
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    paddingRight: 8,
  },
  horizontalBarFillWrapper: {
    flex: 1,
    height: 16,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  horizontalBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  horizontalBarValue: {
    width: 48,
    fontSize: 13,
    fontWeight: '700',
    color: '#1E3A5F',
    textAlign: 'right',
    paddingLeft: 8,
  },
  xAxisLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 80, // Align with chart
    paddingRight: 48,
    marginTop: 6,
  },
  xAxisText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
  },

  // Vertical Column Chart
  columnChartContainer: {
    height: 202,
    position: 'relative',
    justifyContent: 'flex-end',
  },
  hGridOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 24, // Shift below subtitle/tooltip area
    bottom: 24, // Shift above label text area
    justifyContent: 'space-between',
  },
  hGridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 0,
    borderTopWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#E2E8F0',
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: HorizonColors.white,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    shadowColor: '#1E3A5F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    zIndex: 10,
  },
  tooltipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E3A5F',
  },
  columnsList: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: '100%',
    paddingBottom: 24, // Keep space for project label
    zIndex: 2,
  },
  verticalColumnWrapper: {
    alignItems: 'center',
    flex: 1,
    maxWidth: 60,
  },
  columnFillContainer: {
    flex: 1,
    width: 22,
    justifyContent: 'flex-end',
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  verticalColumnBar: {
    width: '100%',
    borderRadius: 6,
  },
  verticalColumnLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },

  noDataText: {
    fontSize: 13,
    color: HorizonColors.textMuted,
    textAlign: 'center',
    paddingVertical: 24,
  },
});
