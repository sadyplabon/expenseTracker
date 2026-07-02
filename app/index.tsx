import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Transaction, deleteTransaction, getTransactionsByDate } from '../db/database';
import {
  formatCurrency, formatDate, formatDisplayDate, getCategoryMeta, TYPE_META,
} from '../constants/categories';
import { CustomCategory, getCustomCategories } from '../store/customCategories';

export default function DailyScreen() {
  const router = useRouter();
  const [date, setDate] = useState(new Date());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [customCats, setCustomCats] = useState<CustomCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const dateStr = formatDate(date);
  const isToday = dateStr === formatDate(new Date());

  const load = useCallback(async () => {
    setLoading(true);
    const [rows, cats] = await Promise.all([
      getTransactionsByDate(dateStr),
      getCustomCategories(),
    ]);
    setTransactions(rows);
    setCustomCats(cats);
    setLoading(false);
  }, [dateStr]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const shiftDay = (delta: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + delta);
    if (d <= new Date()) setDate(d);
  };

  const confirmDelete = (tx: Transaction) => {
    Alert.alert('Delete Entry', 'Remove this entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => { await deleteTransaction(tx.id); load(); },
      },
    ]);
  };

  const totalIncome = transactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
  const totalAtm = transactions.filter(t => t.type === 'ATM').reduce((s, t) => s + t.amount, 0);
  const net = totalIncome - totalExpense;

  return (
    <View style={styles.container}>
      {/* Date Navigator */}
      <View style={styles.dateNav}>
        <TouchableOpacity onPress={() => shiftDay(-1)} style={styles.navBtn}>
          <Ionicons name="chevron-back" size={24} color="#1976D2" />
        </TouchableOpacity>
        <Text style={styles.dateText}>
          {isToday ? `Today  •  ${formatDisplayDate(dateStr)}` : formatDisplayDate(dateStr)}
        </Text>
        <TouchableOpacity onPress={() => shiftDay(1)} style={styles.navBtn} disabled={isToday}>
          <Ionicons name="chevron-forward" size={24} color={isToday ? '#CCC' : '#1976D2'} />
        </TouchableOpacity>
      </View>

      {/* Summary Row */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: '#E8F5E9' }]}>
          <Text style={styles.summaryLabel}>Income</Text>
          <Text style={[styles.summaryAmount, { color: '#2E7D32' }]}>{formatCurrency(totalIncome)}</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#FFEBEE' }]}>
          <Text style={styles.summaryLabel}>Expense</Text>
          <Text style={[styles.summaryAmount, { color: '#E53935' }]}>{formatCurrency(totalExpense)}</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: net >= 0 ? '#E3F2FD' : '#FFF3E0' }]}>
          <Text style={styles.summaryLabel}>Net</Text>
          <Text style={[styles.summaryAmount, { color: net >= 0 ? '#1565C0' : '#E65100' }]}>
            {formatCurrency(net)}
          </Text>
        </View>
      </View>
      {totalAtm > 0 && (
        <View style={styles.atmBanner}>
          <Text style={styles.atmBannerText}>🏧 Cash withdrawn today: {formatCurrency(totalAtm)}</Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#1976D2" />
      ) : transactions.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="receipt-outline" size={56} color="#CCC" />
          <Text style={styles.emptyText}>No entries for this day</Text>
          <Text style={styles.emptySubText}>Tap + to add income or expense</Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => String(item.id)}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
          contentContainerStyle={{ paddingBottom: 80 }}
          renderItem={({ item }) => {
            const meta = getCategoryMeta(item.category, customCats);
            const typeMeta = TYPE_META[item.type];
            return (
              <TouchableOpacity
                style={styles.txCard}
                onPress={() =>
                  router.push({
                    pathname: '/add',
                    params: {
                      id: String(item.id),
                      amount: String(item.amount),
                      type: item.type,
                      category: item.category,
                      note: item.note,
                      date: item.date,
                    },
                  })
                }
              >
                <View style={[styles.txTypeBadge, { backgroundColor: typeMeta.bgColor }]}>
                  <Text style={styles.txEmoji}>{meta.emoji}</Text>
                </View>
                <View style={styles.txInfo}>
                  <Text style={styles.txCategory}>{meta.label}</Text>
                  {item.note ? <Text style={styles.txNote} numberOfLines={1}>{item.note}</Text> : null}
                </View>
                <Text style={[styles.txAmount, { color: typeMeta.color }]}>
                  {item.type === 'INCOME' ? '+' : '-'}{formatCurrency(item.amount)}
                </Text>
                <TouchableOpacity onPress={() => confirmDelete(item)} style={styles.deleteBtn}>
                  <Ionicons name="trash-outline" size={18} color="#BDBDBD" />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push({ pathname: '/add', params: { date: dateStr } })}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  dateNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', paddingHorizontal: 8, paddingVertical: 10,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1,
  },
  navBtn: { padding: 8 },
  dateText: { fontSize: 13, fontWeight: '600', color: '#333', textAlign: 'center', flex: 1 },
  summaryRow: { flexDirection: 'row', gap: 8, margin: 12 },
  summaryCard: {
    flex: 1, borderRadius: 10, padding: 10, alignItems: 'center',
  },
  summaryLabel: { fontSize: 11, color: '#666', marginBottom: 2 },
  summaryAmount: { fontSize: 13, fontWeight: 'bold' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyText: { fontSize: 16, color: '#999', marginTop: 8 },
  emptySubText: { fontSize: 13, color: '#BBB' },
  txCard: {
    backgroundColor: '#fff', marginHorizontal: 12, marginBottom: 8,
    borderRadius: 10, padding: 12, flexDirection: 'row', alignItems: 'center',
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06,
  },
  txTypeBadge: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  txEmoji: { fontSize: 22 },
  txInfo: { flex: 1 },
  txCategory: { fontSize: 14, fontWeight: '600', color: '#333' },
  txNote: { fontSize: 12, color: '#888', marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: '700', marginRight: 6 },
  deleteBtn: { padding: 4 },
  atmBanner: {
    marginHorizontal: 12, marginBottom: 4, backgroundColor: '#ECEFF1',
    borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8,
  },
  atmBannerText: { fontSize: 13, color: '#546E7A', fontWeight: '600' },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    backgroundColor: '#1976D2', width: 58, height: 58, borderRadius: 29,
    alignItems: 'center', justifyContent: 'center',
    elevation: 6, shadowColor: '#1976D2', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4,
  },
});
