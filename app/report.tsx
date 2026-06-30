import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  Expense, CategoryTotal,
  getExpensesByMonth, getTotalForMonth, getCategoryTotalsForMonth,
} from '@/db/database';
import {
  formatCurrency, formatYearMonth, formatMonthYear, CATEGORY_META,
} from '@/constants/categories';

export default function MonthlyReportScreen() {
  const [monthDate, setMonthDate] = useState(new Date());
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [total, setTotal] = useState(0);
  const [catTotals, setCatTotals] = useState<CategoryTotal[]>([]);
  const [loading, setLoading] = useState(true);

  const ym = formatYearMonth(monthDate);
  const isCurrentMonth = ym === formatYearMonth(new Date());

  const load = useCallback(async () => {
    setLoading(true);
    const [exps, tot, cats] = await Promise.all([
      getExpensesByMonth(ym),
      getTotalForMonth(ym),
      getCategoryTotalsForMonth(ym),
    ]);
    setExpenses(exps);
    setTotal(tot);
    setCatTotals(cats);
    setLoading(false);
  }, [ym]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const shiftMonth = (delta: number) => {
    const d = new Date(monthDate);
    d.setMonth(d.getMonth() + delta);
    if (d <= new Date()) setMonthDate(d);
  };

  // Group expenses by date
  const byDay = expenses.reduce<Record<string, Expense[]>>((acc, e) => {
    (acc[e.date] ??= []).push(e);
    return acc;
  }, {});
  const sortedDays = Object.keys(byDay).sort((a, b) => b.localeCompare(a));

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Month navigator */}
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={() => shiftMonth(-1)} style={styles.navBtn}>
          <Ionicons name="chevron-back" size={24} color="#1976D2" />
        </TouchableOpacity>
        <Text style={styles.monthText}>{formatMonthYear(monthDate)}</Text>
        <TouchableOpacity
          onPress={() => shiftMonth(1)}
          style={styles.navBtn}
          disabled={isCurrentMonth}
        >
          <Ionicons name="chevron-forward" size={24} color={isCurrentMonth ? '#CCC' : '#1976D2'} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color="#1976D2" />
      ) : (
        <>
          {/* Summary card */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Spent</Text>
            <Text style={styles.summaryAmount}>{formatCurrency(total)}</Text>
            <Text style={styles.summaryCount}>{expenses.length} transaction{expenses.length !== 1 ? 's' : ''}</Text>
          </View>

          {/* Category breakdown */}
          {catTotals.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>By Category</Text>
              {catTotals.map((ct) => {
                const meta = CATEGORY_META[ct.category];
                const pct = total > 0 ? (ct.total / total) * 100 : 0;
                return (
                  <View key={ct.category} style={styles.catRow}>
                    <View style={styles.catRowHeader}>
                      <Text style={styles.catEmoji}>{meta.emoji}</Text>
                      <Text style={styles.catLabel}>{meta.label}</Text>
                      <Text style={styles.catAmount}>{formatCurrency(ct.total)}</Text>
                      <Text style={styles.catPct}>{pct.toFixed(0)}%</Text>
                    </View>
                    <View style={styles.barBg}>
                      <View style={[styles.barFill, { width: `${pct}%` as any, backgroundColor: meta.color }]} />
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Daily breakdown */}
          {sortedDays.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Daily Breakdown</Text>
              {sortedDays.map((day) => {
                const dayExpenses = byDay[day];
                const dayTotal = dayExpenses.reduce((s, e) => s + e.amount, 0);
                const d = new Date(day + 'T00:00:00');
                const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short' });
                return (
                  <View key={day} style={styles.dayGroup}>
                    <View style={styles.dayHeader}>
                      <Text style={styles.dayLabel}>{dayLabel}</Text>
                      <Text style={styles.dayTotal}>{formatCurrency(dayTotal)}</Text>
                    </View>
                    {dayExpenses.map((e) => {
                      const meta = CATEGORY_META[e.category];
                      return (
                        <View key={e.id} style={styles.dayExpenseRow}>
                          <Text>{meta.emoji}</Text>
                          <Text style={styles.dayExpenseCat}>{meta.label}</Text>
                          {e.note ? <Text style={styles.dayExpenseNote} numberOfLines={1}>{e.note}</Text> : null}
                          <Text style={styles.dayExpenseAmount}>{formatCurrency(e.amount)}</Text>
                        </View>
                      );
                    })}
                  </View>
                );
              })}
            </View>
          )}

          {expenses.length === 0 && (
            <View style={styles.empty}>
              <Ionicons name="bar-chart-outline" size={56} color="#CCC" />
              <Text style={styles.emptyText}>No expenses this month</Text>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  monthNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', paddingHorizontal: 8, paddingVertical: 10,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1,
  },
  navBtn: { padding: 8 },
  monthText: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  summaryCard: {
    margin: 16, padding: 20, backgroundColor: '#1976D2', borderRadius: 16,
    alignItems: 'center',
  },
  summaryLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  summaryAmount: { fontSize: 36, fontWeight: 'bold', color: '#fff', marginVertical: 4 },
  summaryCount: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  section: { marginHorizontal: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  catRow: { marginBottom: 12 },
  catRowHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  catEmoji: { fontSize: 18, marginRight: 8 },
  catLabel: { flex: 1, fontSize: 14, color: '#333' },
  catAmount: { fontSize: 14, fontWeight: '600', color: '#333', marginRight: 8 },
  catPct: { fontSize: 12, color: '#888', width: 32, textAlign: 'right' },
  barBg: { height: 6, backgroundColor: '#E0E0E0', borderRadius: 3 },
  barFill: { height: 6, borderRadius: 3 },
  dayGroup: {
    backgroundColor: '#fff', borderRadius: 10, marginBottom: 10,
    overflow: 'hidden', elevation: 1,
  },
  dayHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    backgroundColor: '#ECEFF1', paddingHorizontal: 14, paddingVertical: 8,
  },
  dayLabel: { fontSize: 13, fontWeight: '700', color: '#555' },
  dayTotal: { fontSize: 13, fontWeight: '700', color: '#1976D2' },
  dayExpenseRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 0.5, borderTopColor: '#F0F0F0',
  },
  dayExpenseCat: { fontSize: 13, color: '#444', fontWeight: '500', flex: 1 },
  dayExpenseNote: { fontSize: 12, color: '#888', flex: 1 },
  dayExpenseAmount: { fontSize: 13, fontWeight: '600', color: '#333' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 16, color: '#999' },
});
