import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useMemo } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { HorizonColors } from '@/constants/horizon';
import { Invoice, Expense, EXPENSE_CATEGORIES } from '@/types/finance';

type FinanceAnalyticsProps = {
  invoices: Invoice[];
  expenses: Expense[];
};

export function FinanceAnalytics({ invoices, expenses }: FinanceAnalyticsProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const isWideKpis = width >= 640;

  const stats = useMemo(() => {
    // 1. Calculate revenue (Paid invoices)
    const totalRevenue = invoices
      .filter((i) => i.status === 'Paid')
      .reduce((sum, i) => sum + i.total, 0);

    // 2. Calculate outstanding (Sent or Overdue)
    const totalOutstanding = invoices
      .filter((i) => i.status === 'Sent' || i.status === 'Overdue')
      .reduce((sum, i) => sum + i.total, 0);

    // 3. Calculate expenses
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    // 4. Net profit
    const netCashFlow = totalRevenue - totalExpenses;

    // 5. Category breakdown
    const categoryTotals: Record<string, number> = {};
    EXPENSE_CATEGORIES.forEach((cat) => {
      categoryTotals[cat] = 0;
    });

    expenses.forEach((e) => {
      const cat = e.category;
      categoryTotals[cat] = (categoryTotals[cat] || 0) + e.amount;
    });

    const categoryBreakdown = EXPENSE_CATEGORIES.map((cat) => {
      const val = categoryTotals[cat];
      const share = totalExpenses > 0 ? (val / totalExpenses) * 100 : 0;
      return { name: cat, value: val, share };
    }).sort((a, b) => b.value - a.value);

    // 6. Project spend breakdown
    const projectMap: Record<string, number> = {};
    expenses.forEach((e) => {
      const proj = e.project || 'Internal';
      projectMap[proj] = (projectMap[proj] || 0) + e.amount;
    });
    const projectBreakdown = Object.keys(projectMap).map((proj) => {
      return { name: proj, value: projectMap[proj] };
    }).sort((a, b) => b.value - a.value).slice(0, 5);

    return {
      totalRevenue,
      totalOutstanding,
      totalExpenses,
      netCashFlow,
      categoryBreakdown,
      projectBreakdown,
    };
  }, [invoices, expenses]);

  const formatCurrency = (val: number) => {
    const isNegative = val < 0;
    const absVal = Math.abs(val);
    return (isNegative ? '-₹' : '₹') + absVal.toLocaleString(undefined, { maximumFractionDigits: 0 });
  };

  return (
    <View style={styles.container}>
      {/* 4 KPI Platter */}
      <View style={[styles.kpiRow, isWideKpis ? styles.rowLayout : styles.gridMockLayout]}>
        {/* KPI 1: Revenue */}
        <View style={[styles.kpiCard, isWideKpis ? styles.flexCard : styles.gridItemMobile]}>
          <View style={styles.kpiHeader}>
            <View style={[styles.iconContainer, { backgroundColor: '#E0F2FE' }]}>
              <MaterialIcons name="trending-up" size={20} color={HorizonColors.primary} />
            </View>
          </View>
          <Text style={styles.kpiTitle}>Revenue (Paid)</Text>
          <Text style={[styles.kpiValue, !isWideKpis && styles.kpiValueMobile]}>
            {formatCurrency(stats.totalRevenue)}
          </Text>
        </View>

        {/* KPI 2: Outstanding */}
        <View style={[styles.kpiCard, isWideKpis ? styles.flexCard : styles.gridItemMobile]}>
          <View style={styles.kpiHeader}>
            <View style={[styles.iconContainer, { backgroundColor: '#FEF3C7' }]}>
              <MaterialIcons name="hourglass-empty" size={20} color="#D97706" />
            </View>
          </View>
          <Text style={styles.kpiTitle}>Outstanding Bills</Text>
          <Text style={[styles.kpiValue, !isWideKpis && styles.kpiValueMobile]}>
            {formatCurrency(stats.totalOutstanding)}
          </Text>
        </View>

        {/* KPI 3: Expenses */}
        <View style={[styles.kpiCard, isWideKpis ? styles.flexCard : styles.gridItemMobile]}>
          <View style={styles.kpiHeader}>
            <View style={[styles.iconContainer, { backgroundColor: '#FEE2E2' }]}>
              <MaterialIcons name="trending-down" size={20} color="#EF4444" />
            </View>
          </View>
          <Text style={styles.kpiTitle}>Total Expenses</Text>
          <Text style={[styles.kpiValue, !isWideKpis && styles.kpiValueMobile]}>
            {formatCurrency(stats.totalExpenses)}
          </Text>
        </View>

        {/* KPI 4: Cash Flow */}
        <View style={[styles.kpiCard, isWideKpis ? styles.flexCard : styles.gridItemMobile]}>
          <View style={styles.kpiHeader}>
            <View style={[styles.iconContainer, stats.netCashFlow >= 0 ? { backgroundColor: '#DCFCE7' } : { backgroundColor: '#FEE2E2' }]}>
              <MaterialIcons
                name={stats.netCashFlow >= 0 ? 'account-balance' : 'warning'}
                size={20}
                color={stats.netCashFlow >= 0 ? '#16A34A' : '#EF4444'}
              />
            </View>
          </View>
          <Text style={styles.kpiTitle}>Net Cash Flow</Text>
          <Text
            style={[
              styles.kpiValue,
              !isWideKpis && styles.kpiValueMobile,
              { color: stats.netCashFlow >= 0 ? '#16A34A' : '#EF4444' },
            ]}>
            {formatCurrency(stats.netCashFlow)}
          </Text>
        </View>
      </View>

      {/* Visual Chart Row */}
      <View style={[styles.chartsRow, isDesktop ? styles.rowLayout : styles.columnLayout]}>
        {/* Category Breakdown Progress Bars */}
        <View style={[styles.card, isDesktop && { flex: 1.1 }]}>
          <Text style={styles.chartTitle}>Expenses by Category</Text>
          <View style={styles.categoryList}>
            {stats.categoryBreakdown.map((item) => (
              <View key={item.name} style={styles.categoryItem}>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.categoryValue}>
                    {formatCurrency(item.value)} ({item.share.toFixed(0)}%)
                  </Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${item.share}%`, backgroundColor: HorizonColors.primary },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Project Expenses breakdown */}
        <View style={[styles.card, isDesktop && { flex: 1 }]}>
          <Text style={styles.chartTitle}>Project Spend Breakdown</Text>
          <View style={styles.categoryList}>
            {stats.projectBreakdown.length === 0 ? (
              <Text style={styles.noDataText}>No project expenses logged.</Text>
            ) : (
              stats.projectBreakdown.map((proj) => {
                const totalExp = stats.totalExpenses;
                const percentage = totalExp > 0 ? (proj.value / totalExp) * 100 : 0;
                return (
                  <View key={proj.name} style={styles.categoryItem}>
                    <View style={styles.categoryInfo}>
                      <Text style={styles.categoryName} numberOfLines={1}>{proj.name}</Text>
                      <Text style={styles.categoryValue}>{formatCurrency(proj.value)}</Text>
                    </View>
                    <View style={styles.progressBarBg}>
                      <View
                        style={[
                          styles.progressBarFill,
                          { width: `${percentage}%`, backgroundColor: '#F59E0B' },
                        ]}
                      />
                    </View>
                  </View>
                );
              })
            )}
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
  gridMockLayout: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  gridItemMobile: {
    width: '48%',
    flexGrow: 1,
    padding: 12,
    gap: 6,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E3A5F',
  },
  kpiValueMobile: {
    fontSize: 17,
  },
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
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E3A5F',
    marginBottom: 16,
  },
  categoryList: {
    gap: 12,
  },
  categoryItem: {
    gap: 6,
  },
  categoryInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E3A5F',
    flex: 1,
  },
  categoryValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  noDataText: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    paddingVertical: 20,
  },
});
