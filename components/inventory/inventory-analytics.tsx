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
import { Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { HorizonColors } from '@/constants/horizon';
import { InventoryItem } from '@/types/inventory';

// Alternating pie colors matching mockup
const PIE_COLORS = [
  '#2563EB', // Solid blue
  '#10B981', // emerald green
  '#F59E0B', // amber yellow
  '#EF4444', // red
  '#8B5CF6', // purple
  '#06B6D4', // cyan
];

// Local caching layer for parsed dates to avoid redundant string parsing operations
const dateCache: Record<string, { year: number; month: number } | null> = {};

// Robust date parsing helper for DD/MM/YYYY, MM/DD/YYYY, and YYYY-MM-DD formats
function parseItemDate(dateStr: string): { year: number; month: number } | null {
  if (!dateStr) return null;
  const trimmed = dateStr.trim();
  if (trimmed in dateCache) {
    return dateCache[trimmed];
  }

  let parts: string[] = [];

  if (trimmed.includes('-')) {
    parts = trimmed.split('-');
  } else if (trimmed.includes('/')) {
    parts = trimmed.split('/');
  } else {
    dateCache[trimmed] = null;
    return null;
  }

  if (parts.length !== 3) {
    dateCache[trimmed] = null;
    return null;
  }

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

    if (isNaN(valA) || isNaN(valB) || isNaN(y)) {
      dateCache[trimmed] = null;
      return null;
    }

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

  if (isNaN(y) || isNaN(m) || m < 1 || m > 12) {
    dateCache[trimmed] = null;
    return null;
  }
  const result = { year: y, month: m - 1 };
  dateCache[trimmed] = result;
  return result;
}

type PieSlice = {
  name: string;
  value: number;
  color: string;
  gradientUrl: string;
  share: number;
};

type WebPieChartProps = {
  data: PieSlice[];
  selectedProjects: string[];
  onToggleProject: (name: string) => void;
};

// Simple web SVG pie chart with premium linear gradients, drop-shadows, and exploded slices
const WebPieChart = ({ data, selectedProjects, onToggleProject }: WebPieChartProps) => {
  let accumulatedAngle = 0;
  const anySelected = selectedProjects.length > 0;

  return (
    <svg width="300" height="300" viewBox="0 0 240 240" style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
      <defs>
        {/* Soft Drop Shadow Filter for 3D Bevel/Platter effect */}
        <filter id="pie-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="2" dy="5" stdDeviation="4" floodColor="#1E3A5F" floodOpacity="0.16" />
        </filter>

        {/* 3D-like Linear Gradients */}
        <linearGradient id="grad-blue" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
        <linearGradient id="grad-green" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
        <linearGradient id="grad-yellow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
        <linearGradient id="grad-red" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F87171" />
          <stop offset="100%" stopColor="#B91C1C" />
        </linearGradient>
        <linearGradient id="grad-purple" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C084FC" />
          <stop offset="100%" stopColor="#6D28D9" />
        </linearGradient>
        <linearGradient id="grad-cyan" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22D3EE" />
          <stop offset="100%" stopColor="#0891B2" />
        </linearGradient>
        <linearGradient id="grad-gray" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#D1D5DB" />
          <stop offset="100%" stopColor="#4B5563" />
        </linearGradient>
      </defs>

      {data.map((slice, idx) => {
        const angle = (slice.share / 100) * 360;
        if (slice.share <= 0) return null;

        const isSelected = selectedProjects.includes(slice.name);
        const offset = isSelected ? 12 : (anySelected ? 3 : 5);
        const opacity = isSelected ? 1 : (anySelected ? 0.35 : 1);

        // Calculate bisector angle for exploding slices outward
        const bisectorAngle = accumulatedAngle + angle / 2;
        const bisectorRad = (bisectorAngle * Math.PI) / 180;

        // Offset center point
        const cx = 120 + offset * Math.cos(bisectorRad);
        const cy = 120 + offset * Math.sin(bisectorRad);

        // Arc start and end coordinates
        const startRad = (accumulatedAngle * Math.PI) / 180;
        const x1 = cx + 80 * Math.cos(startRad);
        const y1 = cy + 80 * Math.sin(startRad);

        const endAngle = accumulatedAngle + angle;
        const endRad = (endAngle * Math.PI) / 180;
        const x2 = cx + 80 * Math.cos(endRad);
        const y2 = cy + 80 * Math.sin(endRad);

        accumulatedAngle = endAngle;

        // If the slice is 100% of the chart, render as a circle
        if (slice.share >= 99.9) {
          return (
            <circle
              key={idx}
              cx={cx}
              cy={cy}
              r="80"
              fill={slice.gradientUrl}
              filter="url(#pie-shadow)"
              style={{ cursor: 'pointer', transition: 'all 0.3s ease', opacity }}
              onClick={() => onToggleProject(slice.name)}
            />
          );
        }

        const largeArcFlag = angle > 180 ? 1 : 0;
        const pathData = `
          M ${cx} ${cy}
          L ${x1} ${y1}
          A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2}
          Z
        `;

        return (
          <path
            key={idx}
            d={pathData}
            fill={slice.gradientUrl}
            stroke="#FFF"
            strokeWidth="0.5"
            filter="url(#pie-shadow)"
            style={{
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              opacity,
            }}
            onClick={() => onToggleProject(slice.name)}
          />
        );
      })}
    </svg>
  );
};

type NativePieChartProps = {
  data: PieSlice[];
  selectedProjects: string[];
  onToggleProject: (name: string) => void;
};

// Cross-platform native fallback (horizontal stacked segmented bar)
const NativePieChart = ({ data, selectedProjects, onToggleProject }: NativePieChartProps) => {
  const anySelected = selectedProjects.length > 0;

  return (
    <View style={{ gap: 12, width: '100%', paddingVertical: 20 }}>
      {/* Stacked horizontal bar representation */}
      <View style={{ height: 26, borderRadius: 13, backgroundColor: '#E2E8F0', overflow: 'hidden', flexDirection: 'row' }}>
        {data.map((slice, idx) => {
          if (slice.share <= 0) return null;
          const isSelected = selectedProjects.includes(slice.name);
          const opacity = isSelected ? 1 : (anySelected ? 0.35 : 1);
          return (
            <Pressable
              key={idx}
              onPress={() => onToggleProject(slice.name)}
              style={{
                width: `${slice.share}%`,
                backgroundColor: slice.color,
                height: '100%',
                opacity,
                borderWidth: isSelected ? 2 : 0,
                borderColor: '#FFF',
              }}
            />
          );
        })}
      </View>
      {anySelected && (
        <Text style={{ fontSize: 11, color: '#64748B', fontStyle: 'italic', textAlign: 'center' }}>
          Tapped segments filter projects. Tap legend items or selected segment to clear.
        </Text>
      )}
    </View>
  );
};

type PieChartRepresentationProps = {
  data: PieSlice[];
  selectedProjects: string[];
  onToggleProject: (name: string) => void;
};

const PieChartRepresentation = ({ data, selectedProjects, onToggleProject }: PieChartRepresentationProps) => {
  if (Platform.OS === 'web') {
    return <WebPieChart data={data} selectedProjects={selectedProjects} onToggleProject={onToggleProject} />;
  }
  return <NativePieChart data={data} selectedProjects={selectedProjects} onToggleProject={onToggleProject} />;
};

type TimelinePoint = {
  key: string;
  label: string;
  year: number;
  month: number;
  spend: number;
  count: number;
  maxItemName: string;
  maxItemPrice: number;
};

type WebTimelineChartProps = {
  data: TimelinePoint[];
  activeIndex: number;
  onSelectIndex: (idx: number) => void;
};

// Premium web SVG Line/Area chart with gradient fill, dashed guidelines, and active point indicators
const WebTimelineChart = ({ data, activeIndex, onSelectIndex }: WebTimelineChartProps) => {
  if (data.length === 0) return null;

  const chartWidth = 460;
  const chartHeight = 180;
  const paddingLeft = 50;
  const paddingRight = 15;
  const paddingTop = 15;
  const paddingBottom = 25;

  const graphWidth = chartWidth - paddingLeft - paddingRight;
  const graphHeight = chartHeight - paddingTop - paddingBottom;

  const maxSpend = Math.max(...data.map(d => d.spend), 1);

  // Compute coordinates for line points
  const points = data.map((d, i) => {
    const x = paddingLeft + (data.length > 1 ? (i / (data.length - 1)) * graphWidth : graphWidth / 2);
    const y = chartHeight - paddingBottom - (d.spend / maxSpend) * graphHeight;
    return { x, y, data: d, index: i };
  });

  // Create path for line connection
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  // Create path for filled area under the line
  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} ${chartHeight - paddingBottom} L ${points[0].x} ${chartHeight - paddingBottom} Z`
    : '';

  // Grid lines (3 horizontal helper lines)
  const gridLines = [0.25, 0.5, 0.75, 1].map((ratio) => {
    const val = maxSpend * ratio;
    const y = chartHeight - paddingBottom - ratio * graphHeight;
    return { y, val };
  });

  const formatAbbreviated = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(0)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(0)}k`;
    return `₹${val}`;
  };

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ overflow: 'visible' }}>
      <defs>
        {/* Soft blue Area Gradient */}
        <linearGradient id="timeline-area-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2563EB" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#2563EB" stopOpacity="0.00" />
        </linearGradient>
      </defs>

      {/* Horizontal Dashed Grid Lines & Y-Axis Labels */}
      {gridLines.map((line, idx) => (
        <g key={idx}>
          <line
            x1={paddingLeft}
            y1={line.y}
            x2={chartWidth - paddingRight}
            y2={line.y}
            stroke="#E2E8F0"
            strokeDasharray="4 4"
            strokeWidth="1"
          />
          <text
            x={paddingLeft - 8}
            y={line.y + 4}
            textAnchor="end"
            fontSize="10"
            fontWeight="600"
            fill="#94A3B8"
          >
            {formatAbbreviated(line.val)}
          </text>
        </g>
      ))}

      {/* Vertical Active Line Indicator */}
      {activeIndex >= 0 && activeIndex < points.length && (
        <line
          x1={points[activeIndex].x}
          y1={paddingTop}
          x2={points[activeIndex].x}
          y2={chartHeight - paddingBottom}
          stroke="#3B82F6"
          strokeWidth="0.5"
          strokeDasharray="2 2"
        />
      )}

      {/* Area Under Line */}
      {areaPath && (
        <path d={areaPath} fill="url(#timeline-area-grad)" />
      )}

      {/* Stroke Line */}
      {linePath && (
        <path d={linePath} fill="none" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      )}

      {/* Nodes & Hover click handlers */}
      {points.map((p, idx) => {
        const isActive = activeIndex === idx;
        return (
          <g key={idx} style={{ cursor: 'pointer' }} onClick={() => onSelectIndex(idx)}>
            {/* Expanded hover click target area */}
            <circle
              cx={p.x}
              cy={p.y}
              r="14"
              fill="transparent"
            />
            {/* Outer halo for active point */}
            {isActive && (
              <circle
                cx={p.x}
                cy={p.y}
                r="7"
                fill="#2563EB"
                opacity="0.3"
              />
            )}
            {/* The main coordinate circle dot */}
            <circle
              cx={p.x}
              cy={p.y}
              r="4"
              fill={isActive ? "#2563EB" : "#FFF"}
              stroke="#2563EB"
              strokeWidth="1.5"
            />
            {/* X-Axis Month label */}
            <text
              x={p.x}
              y={chartHeight - 8}
              textAnchor="middle"
              fontSize="10"
              fontWeight={isActive ? "700" : "600"}
              fill={isActive ? "#1E3A5F" : "#94A3B8"}
            >
              {p.data.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

type NativeTimelineChartProps = {
  data: TimelinePoint[];
  activeIndex: number;
  onSelectIndex: (idx: number) => void;
};

// React Native Fallback for Mobile: Interactive Progress lists
const NativeTimelineChart = ({ data, activeIndex, onSelectIndex }: NativeTimelineChartProps) => {
  const maxSpend = Math.max(...data.map(d => d.spend), 1);
  return (
    <View style={{ gap: 10, width: '100%', paddingVertical: 10 }}>
      {data.map((d, idx) => {
        const isActive = activeIndex === idx;
        const barWidth = maxSpend > 0 ? (d.spend / maxSpend) * 100 : 0;
        return (
          <Pressable
            key={d.key}
            onPress={() => onSelectIndex(idx)}
            style={({ pressed }) => [
              {
                flexDirection: 'row',
                alignItems: 'center',
                padding: 10,
                borderRadius: 8,
                backgroundColor: isActive ? '#FAFBFD' : 'transparent',
                borderWidth: isActive ? 1 : 0,
                borderColor: '#E2E8F0',
                opacity: pressed ? 0.7 : 1,
              }
            ]}
          >
            <Text style={{ width: 60, fontSize: 12, fontWeight: '700', color: isActive ? '#2563EB' : '#1E3A5F' }}>
              {d.label}
            </Text>
            <View style={{ flex: 1, height: 10, backgroundColor: '#E2E8F0', borderRadius: 5, marginHorizontal: 10, overflow: 'hidden' }}>
              <View
                style={{
                  width: `${barWidth}%`,
                  height: '100%',
                  backgroundColor: isActive ? '#2563EB' : '#60A5FA',
                  borderRadius: 5,
                }}
              />
            </View>
            <Text style={{ width: 85, fontSize: 12, fontWeight: '700', color: '#1E3A5F', textAlign: 'right' }}>
              ₹{d.spend.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

type TimelineRepresentationProps = {
  data: TimelinePoint[];
  activeIndex: number;
  onSelectIndex: (idx: number) => void;
};

const TimelineRepresentation = ({ data, activeIndex, onSelectIndex }: TimelineRepresentationProps) => {
  if (Platform.OS === 'web') {
    return <WebTimelineChart data={data} activeIndex={activeIndex} onSelectIndex={onSelectIndex} />;
  }
  return <NativeTimelineChart data={data} activeIndex={activeIndex} onSelectIndex={onSelectIndex} />;
};

function hexToRgba(hex: string, alpha: number): string {
  if (!hex || !hex.startsWith('#')) return hex;
  try {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  } catch {
    return hex;
  }
}

type InventoryAnalyticsProps = {
  items: InventoryItem[];
  selectedProjects: string[];
  onSelectedProjectsChange: (projects: string[]) => void;
  selectedMonth: string | null;
  onSelectedMonthChange: (month: string | null) => void;
};

export function InventoryAnalytics({
  items,
  selectedProjects,
  onSelectedProjectsChange,
  selectedMonth,
  onSelectedMonthChange,
}: InventoryAnalyticsProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024; // Side-by-side layout on larger screens
  const isWideKpis = width >= 640;
  const isMobile = width < 768;

  const stats = useMemo(() => {
    let totalVal = 0;
    let totalQty = 0;
    let totalUnique = 0;
    const projMap: Record<string, number> = {};
    const monthMap: Record<string, TimelinePoint> = {};

    items.forEach((item) => {
      const itemVal = item.price;

      // Timeline aggregation (must run for ALL items, before month filter)
      const parsed = parseItemDate(item.date);
      let itemMonthKey = '';
      if (parsed) {
        const { year, month } = parsed;
        const key = `${year}-${String(month + 1).padStart(2, '0')}`; // e.g. "2026-03"
        itemMonthKey = key;
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const label = `${monthNames[month]} '${String(year).slice(-2)}`;

        if (!monthMap[key]) {
          monthMap[key] = {
            key,
            label,
            year,
            month,
            spend: 0,
            count: 0,
            maxItemName: '',
            maxItemPrice: 0,
          };
        }

        monthMap[key].spend += itemVal;
        monthMap[key].count += 1;
        if (itemVal > monthMap[key].maxItemPrice) {
          monthMap[key].maxItemPrice = itemVal;
          monthMap[key].maxItemName = item.name;
        }
      }

      if (!selectedMonth || itemMonthKey === selectedMonth) {
        totalUnique++;
      }

      // Filter by selectedMonth for the Pie chart & KPI totals!
      if (selectedMonth && itemMonthKey !== selectedMonth) {
        return;
      }

      totalVal += itemVal;
      totalQty += item.quantity;

      // Project breakdown
      const proj = item.project.trim() || '-';
      projMap[proj] = (projMap[proj] || 0) + itemVal;
    });

    // Average price of a single component/unit in stock
    const avgPrice = totalQty > 0 ? totalVal / totalQty : 0;

    // Convert project map to sorted array
    const sortedProjects = Object.keys(projMap).map((projName) => {
      const value = projMap[projName];
      const share = totalVal > 0 ? (value / totalVal) * 100 : 0;
      return {
        name: projName,
        value,
        share,
      };
    }).sort((a, b) => b.value - a.value);

    const GRADIENT_IDS = [
      'url(#grad-blue)',
      'url(#grad-green)',
      'url(#grad-yellow)',
      'url(#grad-red)',
      'url(#grad-purple)',
      'url(#grad-cyan)',
    ];

    const pieData = sortedProjects.map((p, idx) => ({
      ...p,
      color: PIE_COLORS[idx % PIE_COLORS.length],
      gradientUrl: GRADIENT_IDS[idx % GRADIENT_IDS.length],
    }));

    // Sort timeline chronologically and limit to last 8 active months
    const sortedTimeline = Object.keys(monthMap)
      .sort()
      .map(k => monthMap[k]);
    const timelineData = sortedTimeline.slice(-12);

    return {
      totalValue: totalVal,
      totalQuantity: totalQty,
      totalUnique,
      averagePrice: avgPrice,
      projects: pieData,
      otherProjects: [] as { name: string; value: number; share: number; color: string; gradientUrl: string }[],
      timeline: timelineData,
    };
  }, [items, selectedMonth]);

  const currentActiveIdx = useMemo(() => {
    if (!selectedMonth) return -1;
    return stats.timeline.findIndex(t => t.key === selectedMonth);
  }, [stats.timeline, selectedMonth]);

  const activePoint = useMemo(() => {
    if (currentActiveIdx >= 0 && currentActiveIdx < stats.timeline.length) {
      return stats.timeline[currentActiveIdx];
    }
    return null;
  }, [stats.timeline, currentActiveIdx]);

  const handleSelectTimelineIdx = (idx: number) => {
    const key = stats.timeline[idx].key;
    if (selectedMonth === key) {
      onSelectedMonthChange(null);
    } else {
      onSelectedMonthChange(key);
    }
  };

  const handleToggleProject = (projName: string) => {
    if (projName === 'Other') {
      const otherNames = stats.otherProjects.map((p) => p.name);
      const allSelected = otherNames.every((name) => selectedProjects.includes(name));
      if (allSelected) {
        // Deselect all other projects
        onSelectedProjectsChange(selectedProjects.filter((p) => !otherNames.includes(p)));
      } else {
        // Select all other projects
        const nextSelected = [...selectedProjects];
        otherNames.forEach((name) => {
          if (!nextSelected.includes(name)) {
            nextSelected.push(name);
          }
        });
        onSelectedProjectsChange(nextSelected);
      }
    } else {
      if (selectedProjects.includes(projName)) {
        onSelectedProjectsChange(selectedProjects.filter((p) => p !== projName));
      } else {
        onSelectedProjectsChange([...selectedProjects, projName]);
      }
    }
  };

  const formatCurrency = (val: number) => {
    return '₹' + val.toLocaleString(undefined, { maximumFractionDigits: 0 });
  };

  return (
    <View style={styles.container}>
      {/* Top Row: 4 KPI Cards */}
      <View style={[styles.kpiRow, isWideKpis ? styles.rowLayout : styles.gridMockLayout]}>
        {/* KPI 1: Total Spend */}
        <View style={[styles.kpiCard, isWideKpis ? styles.flexCard : styles.gridItemMobile]}>
          <View style={styles.kpiHeader}>
            <View style={styles.iconContainer}>
              <MaterialIcons name="attach-money" size={20} color={HorizonColors.primary} />
            </View>
          </View>
          <Text style={styles.kpiTitle}>Total Spend</Text>
          <View style={styles.kpiValueRow}>
            <Text style={[styles.kpiValue, !isWideKpis && styles.kpiValueMobile]}>{formatCurrency(stats.totalValue)}</Text>

          </View>
        </View>

        {/* KPI 2: Total Items */}
        <View style={[styles.kpiCard, isWideKpis ? styles.flexCard : styles.gridItemMobile]}>
          <View style={styles.kpiHeader}>
            <View style={styles.iconContainer}>
              <MaterialIcons name="local-shipping" size={20} color="#EF4444" />
            </View>
          </View>
          <Text style={styles.kpiTitle}>Total Items</Text>
          <View style={styles.kpiValueRow}>
            <Text style={[styles.kpiValue, !isWideKpis && styles.kpiValueMobile]}>{stats.totalQuantity}</Text>

          </View>
        </View>

        {/* KPI 3: Unique Products */}
        <View style={[styles.kpiCard, isWideKpis ? styles.flexCard : styles.gridItemMobile]}>
          <View style={styles.kpiHeader}>
            <View style={styles.iconContainer}>
              <MaterialIcons name="article" size={20} color={HorizonColors.success} />
            </View>
            <MaterialIcons name="more-vert" size={20} color={HorizonColors.iconMuted} style={styles.moreIcon} />
          </View>
          <Text style={styles.kpiTitle}>Total Products</Text>
          <View style={styles.kpiValueRow}>
            <Text style={[styles.kpiValue, !isWideKpis && styles.kpiValueMobile]}>{stats.totalUnique}</Text>

          </View>
        </View>

        {/* KPI 4: Avg Unit Value */}
        <View style={[styles.kpiCard, isWideKpis ? styles.flexCard : styles.gridItemMobile]}>
          <View style={styles.kpiHeader}>
            <View style={styles.iconContainer}>
              <MaterialIcons name="schedule" size={20} color={HorizonColors.warning} />
            </View>
          </View>
          <Text style={styles.kpiTitle}>Avg. Unit Price</Text>
          <View style={styles.kpiValueRow}>
            <Text style={[styles.kpiValue, !isWideKpis && styles.kpiValueMobile]}>{formatCurrency(stats.averagePrice)}</Text>

          </View>
        </View>
      </View>

      {/* Bottom Row: Charts Grid */}
      <View style={[styles.chartsRow, isDesktop ? styles.rowLayout : styles.columnLayout]}>
        {/* Project Expenses Allocation Card */}
        {!isMobile && (
          <View style={[styles.card, isDesktop && { flex: 1.1 }]}>
            <View style={styles.chartHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.chartTitle}>Project Expenses Allocation</Text>
                <View style={styles.chartSubtitleRow}>
                  <Text style={styles.chartSubtitle}>{formatCurrency(stats.totalValue)}</Text>
                  <Text style={styles.chartSubtitleTrend}>Total Spent across all projects</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={styles.mockDropdown}>
                  <Text style={styles.mockDropdownText}>All Projects</Text>
                  <MaterialIcons name="keyboard-arrow-down" size={14} color={HorizonColors.text} />
                </View>
                <MaterialIcons name="more-vert" size={20} color={HorizonColors.iconMuted} />
              </View>
            </View>

            <View style={[styles.pieChartContainer, isDesktop ? styles.rowLayout : styles.columnLayout]}>
              {/* Chart Area */}
              <View style={styles.chartColumn}>
                <PieChartRepresentation
                  data={stats.projects}
                  selectedProjects={selectedProjects}
                  onToggleProject={handleToggleProject}
                />
              </View>

              {/* Legend Area */}
              <View style={styles.legendColumn}>
                {stats.projects.length === 0 ? (
                  <Text style={styles.noDataText}>No project data available</Text>
                ) : (
                  stats.projects.map((project) => {
                    const isSelected = project.name === 'Other'
                      ? stats.otherProjects.length > 0 && stats.otherProjects.every(op => selectedProjects.includes(op.name))
                      : selectedProjects.includes(project.name);
                    const anySelected = selectedProjects.length > 0;
                    const rowOpacity = isSelected ? 1 : (anySelected ? 0.45 : 1);

                    return (
                      <Pressable
                        key={project.name}
                        onPress={() => handleToggleProject(project.name)}
                        style={({ pressed }) => [
                          styles.legendRow,
                          isSelected && {
                            backgroundColor: hexToRgba(project.color, 0.08),
                            borderColor: hexToRgba(project.color, 0.35),
                            borderWidth: 1,
                          },
                          pressed && styles.legendRowPressed,
                          { opacity: rowOpacity }
                        ]}
                      >
                        <View style={[styles.legendColorBox, { backgroundColor: project.color, alignItems: 'center', justifyContent: 'center' }]}>
                          {isSelected && <MaterialIcons name="check" size={8} color="#FFF" />}
                        </View>
                        <Text style={[styles.legendName, isSelected && styles.legendTextActive]} numberOfLines={1}>
                          {project.name}
                        </Text>
                        <Text style={[styles.legendValue, isSelected && styles.legendTextActive]}>
                          {formatCurrency(project.value)}
                        </Text>
                        <Text style={styles.legendShare}>
                          {project.share.toFixed(1)}%
                        </Text>
                      </Pressable>
                    );
                  })
                )}
              </View>
            </View>
          </View>
        )}

        {/* Purchase Activity Timeline Card */}
        <View style={[styles.card, isDesktop && { flex: 1 }]}>
          <View style={styles.chartHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.chartTitle}>Purchase Activity Timeline</Text>
              <View style={styles.chartSubtitleRow}>
                <Text style={styles.chartSubtitle}>
                  {activePoint ? formatCurrency(activePoint.spend) : formatCurrency(stats.totalValue)}
                </Text>
                <Text style={styles.chartSubtitleTrend}>
                  {activePoint ? `Purchases in ${activePoint.label}` : 'Spend trend over time'}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={styles.mockDropdown}>
                <Text style={styles.mockDropdownText}>Monthly Activity</Text>
                <MaterialIcons name="keyboard-arrow-down" size={14} color={HorizonColors.text} />
              </View>
            </View>
          </View>

          <View style={{ flex: 1, minHeight: 200, justifyContent: 'center' }}>
            {stats.timeline.length === 0 ? (
              <Text style={styles.noDataText}>No date data available</Text>
            ) : (
              <TimelineRepresentation
                data={stats.timeline}
                activeIndex={currentActiveIdx}
                onSelectIndex={handleSelectTimelineIdx}
              />
            )}
          </View>

          {/* Timeline Details Box */}
          {activePoint ? (
            <View style={styles.detailsBox}>
              <Text style={styles.detailsHeader}>Activity for {activePoint.label}</Text>
              <View style={styles.detailsGrid}>
                <View style={styles.detailsCard}>
                  <Text style={styles.detailsCardTitle}>Total Spent</Text>
                  <Text style={styles.detailsCardValue}>{formatCurrency(activePoint.spend)}</Text>
                </View>
                <View style={styles.detailsCard}>
                  <Text style={styles.detailsCardTitle}>Purchase Volume</Text>
                  <Text style={styles.detailsCardValue}>{activePoint.count} items</Text>
                </View>
              </View>
              {activePoint.maxItemName ? (
                <View style={styles.peakPurchaseRow}>
                  <MaterialIcons name="star" size={16} color="#F59E0B" />
                  <Text style={styles.peakPurchaseText} numberOfLines={1}>
                    Peak purchase: <Text style={{ fontWeight: '700' }}>{activePoint.maxItemName}</Text> ({formatCurrency(activePoint.maxItemPrice)})
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}
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
  kpiValueMobile: {
    fontSize: 17,
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

  // Pie Chart Layout Styles
  pieChartContainer: {
    gap: 24,
    alignItems: 'center',
    paddingVertical: 10,
  },
  chartColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 220,
    width: '100%',
    flex: 1,
  },
  legendColumn: {
    flex: 1.2,
    width: '100%',
    gap: 8,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  legendRowActive: {
    backgroundColor: '#FAFBFD',
    borderBottomColor: '#E2E8F0',
  },
  legendRowPressed: {
    opacity: 0.7,
  },
  legendTextActive: {
    fontWeight: '700',
    color: '#2563EB',
  },
  legendColorBox: {
    width: 14,
    height: 14,
    borderRadius: 4,
  },
  legendName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E3A5F',
    flex: 1,
  },
  legendValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E3A5F',
    width: 80,
    textAlign: 'right',
  },
  legendShare: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    width: 50,
    textAlign: 'right',
  },

  noDataText: {
    fontSize: 13,
    color: HorizonColors.textMuted,
    textAlign: 'center',
    paddingVertical: 24,
  },
  detailsBox: {
    marginTop: 16,
    padding: 14,
    backgroundColor: '#FAFBFD',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  detailsHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E3A5F',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  detailsCard: {
    flex: 1,
    backgroundColor: HorizonColors.white,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  detailsCardTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 2,
  },
  detailsCardValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E3A5F',
  },
  peakPurchaseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
    marginTop: 4,
  },
  peakPurchaseText: {
    fontSize: 11,
    color: '#64748B',
    flex: 1,
  },
});
