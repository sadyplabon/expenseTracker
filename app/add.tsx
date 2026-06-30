import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Category, addExpense, updateExpense } from '@/db/database';
import { ALL_CATEGORIES, CATEGORY_META, formatDate } from '@/constants/categories';

export default function AddExpenseScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string; amount?: string; category?: string; note?: string; date?: string;
  }>();

  const isEdit = !!params.id;
  const initialDate = params.date ?? formatDate(new Date());

  const [amount, setAmount] = useState(params.amount ?? '');
  const [category, setCategory] = useState<Category>((params.category as Category) ?? 'FOOD');
  const [note, setNote] = useState(params.note ?? '');
  const [amountError, setAmountError] = useState(false);

  const save = async () => {
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) {
      setAmountError(true);
      return;
    }
    if (isEdit && params.id) {
      await updateExpense({
        id: parseInt(params.id),
        amount: parsed,
        category,
        note: note.trim(),
        date: initialDate,
      });
    } else {
      await addExpense(parsed, category, note.trim(), initialDate);
    }
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, gap: 16 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#1976D2" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEdit ? 'Edit Expense' : 'Add Expense'}</Text>
        </View>

        {/* Date badge */}
        <View style={styles.dateBadge}>
          <Ionicons name="calendar-outline" size={16} color="#1976D2" />
          <Text style={styles.dateBadgeText}>{initialDate}</Text>
        </View>

        {/* Amount */}
        <View>
          <Text style={styles.label}>Amount (৳)</Text>
          <TextInput
            style={[styles.input, amountError && styles.inputError]}
            value={amount}
            onChangeText={(v) => { setAmount(v); setAmountError(false); }}
            placeholder="0.00"
            keyboardType="decimal-pad"
            placeholderTextColor="#BBB"
          />
          {amountError && <Text style={styles.errorText}>Enter a valid amount</Text>}
        </View>

        {/* Category */}
        <View>
          <Text style={styles.label}>Category</Text>
          <View style={styles.categoryGrid}>
            {ALL_CATEGORIES.map((cat) => {
              const meta = CATEGORY_META[cat];
              const selected = category === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryChip, selected && { backgroundColor: meta.color, borderColor: meta.color }]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={styles.categoryEmoji}>{meta.emoji}</Text>
                  <Text style={[styles.categoryLabel, selected && { color: '#fff' }]}>
                    {meta.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Note */}
        <View>
          <Text style={styles.label}>Note (optional)</Text>
          <TextInput
            style={[styles.input, styles.noteInput]}
            value={note}
            onChangeText={setNote}
            placeholder="What was this for?"
            placeholderTextColor="#BBB"
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Save */}
        <TouchableOpacity style={styles.saveBtn} onPress={save}>
          <Text style={styles.saveBtnText}>{isEdit ? 'Update Expense' : 'Save Expense'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  dateBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#E3F2FD', alignSelf: 'flex-start',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  dateBadgeText: { fontSize: 13, color: '#1976D2', fontWeight: '600' },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 8 },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#DDD',
    borderRadius: 10, padding: 14, fontSize: 16, color: '#333',
  },
  inputError: { borderColor: '#E53935' },
  errorText: { color: '#E53935', fontSize: 12, marginTop: 4 },
  noteInput: { minHeight: 80, textAlignVertical: 'top' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1.5, borderColor: '#DDD', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#fff',
  },
  categoryEmoji: { fontSize: 16 },
  categoryLabel: { fontSize: 13, color: '#555', fontWeight: '500' },
  saveBtn: {
    backgroundColor: '#1976D2', borderRadius: 12,
    padding: 16, alignItems: 'center', marginTop: 8, marginBottom: 32,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
