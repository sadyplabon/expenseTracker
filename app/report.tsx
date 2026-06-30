import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  Transaction, CategoryTotal, MonthlySummary,
  getTransactionsByMonth, getMonthlySummary, getCategoryTotalsForMonth, getAtmTotalForMonth,
} from '../db/database';
import {
  formatCurrency, formatYearMonth, formatMonthYear, CATEGORY_META, TYPE_META,
} from '../constants/categories';

export default function MonthlyReportScreen() {
  const [monthDate, setMonthDate] = useState(new Date());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<MonthlySummary>({ totalIncome: 0, totalExpense: 0, net: 0 });
  const [expenseCats, setExpenseCats] = useState<CategoryTotal[]>([]);
  const [incomeCats, setIncomeCats] = useState<CategoryTotal[]>([]);
  const [atmTotal, setAtmTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const ym = formatYearMonth(monthDate);
  const isCurrentMonth = ym === formatYearMonth(new Date());

  const load = useCallback(async () => {
    setLoading(true);
    const [txs, sum, eCats, iCats, atm] = await Promise.all([
      getTransactionsByMonth(ym),
      getMonthlySummary(ym),
      getCategoryTotalsForMonth(ym, 'EXPENSE'),
      getCategoryTotalsForMonth(ym, 'INCOME'),
      getAtmTotalForMonth(ym),
    ]);
    setTransactions(txs);
    setSummary(sum);
    setExpenseCats(eCats);
    setIncomeCats(iCats);
    setAtmTotal(atm);
    setLoading(false);
  }, [ym]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const shiftMonth = (delta: number) => {
    const d = new Date(monthDate);
    d.setMonth(d.getMonth() + delta);
    if (d <= new Date()) setMonthDate(d);
  };

  const byDay = transactions.reduce<Record<string, Transaction[]>>((acc, t) => {
    (acc[t.date] ??= []).push(t);
    return acc;
  }, {});
  const sortedDays = Object.keys(byDay).sort((a, b) => b.localeCompare(a));

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Month Navigator */}
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={() => shiftMonth(-1)} style={styles.navBtn}>
          <Ionicons name="chevron-back" size={24} color="#1976D2" />
        </TouchableOpacity>
        <Text style={styles.monthText}>{formatMonthYear(monthDate)}</Text>
        <TouchableOpacity onPress={() => shiftMonth(1)} style={styles.navBtn} disabled={isCurrentMonth}>
          <Ionicons name="chevron-forward" size={24} color={isCurrentMonth ? '#CCC' : '#1976D2'} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color="#1976D2" />
      ) : (
        <>
          {/* Net Balance Card */}
          <View style={[styles.netCard, { backgroundColor: summary.net >= 0 ? '#1976D2' : '#C62828' }]}>
            <Text style={styles.netLabel}>Net Balance</Text>
            <Text style={styles.netAmount}>{formatCurrency(summary.net)}</Text>
            <View style={styles.netRow}>
              <View style={styles.netItem}>
                <Ionicons name="arrow-down-circle" size={16} color="rgba(255,255,255,0.8)" />
                <Text style={styles.netSub}>Income  {formatCurrency(summary.totalIncome)}</Text>
              </View>
              <View style={styles.netItem}>
                <Ionicons name="arrow-up-circle" size={16} color="rgba(255,255,255,0.8)" />
                <Text style={styles.netSub}>Expense  {formatCurrency(summary.totalExpense)}</Text>
              </View>
            </View>
          </View>

          {/* ATM info card */}
          {atmTotal > 0 && (
            <View style={styles.atmCard}>
              <Text style={styles.atmEmoji}>🏧</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.atmTitle}>Cash Withdrawn (ATM)</Text>
                <Text style={styles.atmSub}>Not counted as expense — recorded as cash transfer</Text>
              </View>
              <Text style={styles.atmAmount}>{formatCurrency(atmTotal)}</Text>
            </View>
          )}

          {/* Income Breakdown */}
          {incomeCats.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>💰 Income Breakdown</Text>
              {incomeCats.map((ct) => (
                <CategoryBar key={ct.category} ct={ct} total={summary.totalIncome} />
              ))}
            </View>
          )}

          {/* Expense Breakdown */}
          {expenseCats.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>💸 Expense Breakdown</Text>
              {expenseCats.map((ct) => (
                <CategoryBar key={ct.category} ct={ct} total={summary.totalExpense} />
              ))}
            </View>
          )}

          {/* Daily Breakdown */}
          {sortedDays.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📅 Daily Breakdown</Text>
              {sortedDays.map((day) => {
                const dayTxs = byDay[day];
                const dayIncome = dayTxs.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
                const dayExpense = dayTxs.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
                const d = new Date(day + 'T00:00:00');
                const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short' });
                return (
                  <View key={day} style={styles.dayGroup}>
                    <View style={styles.dayHeader}>
                      <Text style={styles.dayLabel}>{dayLabel}</Text>
                      <View style={styles.dayAmounts}>
                        {dayIncome > 0 && <Text style={styles.dayIncome}>+{formatCurrency(dayIncome)}</Text>}
                        {dayExpense > 0 && <Text style={styles.dayExpense}>-{formatCurrency(dayExpense)}</Text>}
                      </View>
                    </View>
                    {dayTxs.map((t) => {
                      const meta = CATEGORY_META[t.category];
                      const typeMeta = TYPE_META[t.type];
                      return (
                        <View key={t.id} style={styles.txRow}>
                          <Text>{meta.emoji}</Text>
                          <Text style={styles.txCat}>{meta.label}</Text>
                          {t.note ? <Text style={styles.txNote} numberOfLines={1}>{t.note}</Text> : <View style={{ flex: 1 }} />}
                          <Text style={[styles.txAmt, { color: typeMeta.color }]}>
                            {t.type === 'INCOME' ? '+' : '-'}{formatCurrency(t.amount)}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                );
              })}
            </View>
          )}

          {transactions.length === 0 && (
            <View style={styles.empty}>
              <Ionicons name="bar-chart-outline" size={56} color="#CCC" />
              <Text style={styles.emptyText}>No entries this month</Text>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

function CategoryBar({ ct, total }: { ct: CategoryTotal; total: number }) {
  const meta = CATEGORY_META[ct.category];
  const pct = total > 0 ? (ct.total / total) * 100 : 0;
  return (
    <View style={styles.catRow}>
      <View style={styles.catHeader}>
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
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  monthNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', paddingHorizontal: 8, paddingVertical: 10,
    elevation: 2,
  },
  navBtn: { padding: 8 },
  monthText: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  netCard: { margin: 16, padding: 20, borderRadius: 16, alignItems: 'center' },
  netLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  netAmount: { fontSize: 38, fontWeight: 'bold', color: '#fff', marginVertical: 6 },
  netRow: { flexDirection: 'row', gap: 20, marginTop: 4 },
  netItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  netSub: { fontSize: 12, color: 'rgba(255,255,255,0.85)' },
  section: { marginHorizontal: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  catRow: { marginBottom: 12 },
  catHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  catEmoji: { fontSize: 18, marginRight: 8 },
  catLabel: { flex: 1, fontSize: 14, color: '#333' },
  catAmount: { fontSize: 13, fontWeight: '600', color: '#333', marginRight: 8 },
  catPct: { fontSize: 12, color: '#888', width: 32, textAlign: 'right' },
  barBg: { height: 6, backgroundColor: '#E0E0E0', borderRadius: 3 },
  barFill: { height: 6, borderRadius: 3 },
  dayGroup: { backgroundColor: '#fff', borderRadius: 10, marginBottom: 10, overflow: 'hidden', elevation: 1 },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ECEFF1', paddingHorizontal: 14, paddingVertical: 8 },
  dayLabel: { fontSize: 13, fontWeight: '700', color: '#555' },
  dayAmounts: { flexDirection: 'row', gap: 8 },
  dayIncome: { fontSize: 12, fontWeight: '700', color: '#2E7D32' },
  dayExpense: { fontSize: 12, fontWeight: '700', color: '#E53935' },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 0.5, borderTopColor: '#F0F0F0' },
  txCat: { fontSize: 13, color: '#444', fontWeight: '500', flex: 1 },
  txNote: { fontSize: 12, color: '#888', flex: 1 },
  txAmt: { fontSize: 13, fontWeight: '600' },
  atmCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 16, marginBottom: 12, backgroundColor: '#ECEFF1',
    borderRadius: 10, padding: 14,
  },
  atmEmoji: { fontSize: 24 },
  atmTitle: { fontSize: 14, fontWeight: '700', color: '#546E7A' },
  atmSub: { fontSize: 11, color: '#90A4AE', marginTop: 2 },
  atmAmount: { fontSize: 16, fontWeight: 'bold', color: '#546E7A' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 16, color: '#999' },
});
