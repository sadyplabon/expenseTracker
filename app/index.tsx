import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Expense, deleteExpense, getExpensesByDate } from '@/db/database';
import {
  formatCurrency, formatDate, formatDisplayDate, CATEGORY_META,
} from '@/constants/categories';

export default function DailyScreen() {
  const router = useRouter();
  const [date, setDate] = useState(new Date());
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const dateStr = formatDate(date);
  const isToday = dateStr === formatDate(new Date());

  const load = useCallback(async () => {
    setLoading(true);
    const rows = await getExpensesByDate(dateStr);
    setExpenses(rows);
    setLoading(false);
  }, [dateStr]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const shiftDay = (delta: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + delta);
    if (d <= new Date()) setDate(d);
  };

  const confirmDelete = (expense: Expense) => {
    Alert.alert('Delete Expense', 'Remove this expense?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await deleteExpense(expense.id);
          load();
        },
      },
    ]);
  };

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

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
        <TouchableOpacity
          onPress={() => shiftDay(1)}
          style={styles.navBtn}
          disabled={isToday}
        >
          <Ionicons name="chevron-forward" size={24} color={isToday ? '#CCC' : '#1976D2'} />
        </TouchableOpacity>
      </View>

      {/* Total Card */}
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Spent</Text>
        <Text style={styles.totalAmount}>{formatCurrency(total)}</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#1976D2" />
      ) : expenses.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="receipt-outline" size={56} color="#CCC" />
          <Text style={styles.emptyText}>No expenses for this day</Text>
          <Text style={styles.emptySubText}>Tap + to add one</Text>
        </View>
      ) : (
        <FlatList
          data={expenses}
          keyExtractor={(item) => String(item.id)}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
          contentContainerStyle={{ paddingBottom: 80 }}
          renderItem={({ item }) => {
            const meta = CATEGORY_META[item.category];
            return (
              <TouchableOpacity
                style={styles.expenseCard}
                onPress={() =>
                  router.push({
                    pathname: '/add',
                    params: {
                      id: item.id,
                      amount: item.amount,
                      category: item.category,
                      note: item.note,
                      date: item.date,
                    },
                  })
                }
              >
                <Text style={styles.emoji}>{meta.emoji}</Text>
                <View style={styles.expenseInfo}>
                  <Text style={styles.expenseCategory}>{meta.label}</Text>
                  {item.note ? <Text style={styles.expenseNote} numberOfLines={1}>{item.note}</Text> : null}
                </View>
                <Text style={[styles.expenseAmount, { color: meta.color }]}>
                  {formatCurrency(item.amount)}
                </Text>
                <TouchableOpacity onPress={() => confirmDelete(item)} style={styles.deleteBtn}>
                  <Ionicons name="trash-outline" size={20} color="#E53935" />
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
  totalCard: {
    margin: 16, padding: 16, backgroundColor: '#E3F2FD', borderRadius: 12,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  totalLabel: { fontSize: 14, color: '#555' },
  totalAmount: { fontSize: 22, fontWeight: 'bold', color: '#1976D2' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyText: { fontSize: 16, color: '#999', marginTop: 8 },
  emptySubText: { fontSize: 13, color: '#BBB' },
  expenseCard: {
    backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 8,
    borderRadius: 10, padding: 14, flexDirection: 'row', alignItems: 'center',
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06,
  },
  emoji: { fontSize: 28, marginRight: 12 },
  expenseInfo: { flex: 1 },
  expenseCategory: { fontSize: 14, fontWeight: '600', color: '#333' },
  expenseNote: { fontSize: 12, color: '#888', marginTop: 2 },
  expenseAmount: { fontSize: 16, fontWeight: '700', marginRight: 8 },
  deleteBtn: { padding: 4 },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    backgroundColor: '#1976D2', width: 58, height: 58, borderRadius: 29,
    alignItems: 'center', justifyContent: 'center',
    elevation: 6, shadowColor: '#1976D2', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4,
  },
});
