import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Modal, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Category, TransactionType, addTransaction, updateTransaction } from '../db/database';
import {
  EXPENSE_CATEGORIES, INCOME_CATEGORIES, CATEGORY_META, TYPE_META, formatDate,
  DEFAULT_CATEGORIES_SHOWN, getCategoryMeta,
} from '../constants/categories';
import { CustomCategory, getCustomCategories, addCustomCategory } from '../store/customCategories';

const EMOJIS = ['🏠','🎮','📚','✈️','🎵','🍕','⚽','🎁','🐾','🌿','💡','🔧','🎨','🧹','🛒','💈','🧺','🚿'];

export default function AddScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string; amount?: string; type?: string; category?: string; note?: string; date?: string;
  }>();

  const isEdit = !!params.id;
  const initialDate = params.date ?? formatDate(new Date());

  const [txType, setTxType] = useState<TransactionType>((params.type as TransactionType) ?? 'EXPENSE');
  const [amount, setAmount] = useState(params.amount ?? '');
  const [category, setCategory] = useState<string>((params.category as Category) ?? 'FOOD');
  const [note, setNote] = useState(params.note ?? '');
  const [amountError, setAmountError] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [customCats, setCustomCats] = useState<CustomCategory[]>([]);

  // Add category modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newEmoji, setNewEmoji] = useState('🏷️');

  const isAtm = txType === 'ATM';
  const typeMeta = TYPE_META[txType];

  const defaultCats = txType === 'EXPENSE' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const userCats = customCats.filter(c => c.forType === txType).map(c => c.id);
  const allCats = [...defaultCats, ...userCats];
  const visibleCats = showAll ? allCats : allCats.slice(0, DEFAULT_CATEGORIES_SHOWN);
  const hasMore = allCats.length > DEFAULT_CATEGORIES_SHOWN;

  useEffect(() => {
    getCustomCategories().then(setCustomCats);
  }, []);

  const handleTypeChange = (t: TransactionType) => {
    setTxType(t);
    if (t === 'EXPENSE') setCategory('FOOD');
    else if (t === 'INCOME') setCategory('SALARY');
    else setCategory('ATM');
    setShowAll(false);
  };

  const handleAddCategory = async () => {
    if (!newLabel.trim()) { Alert.alert('Name required'); return; }
    const cat = await addCustomCategory({ label: newLabel.trim(), emoji: newEmoji, forType: txType === 'ATM' ? 'EXPENSE' : txType });
    const updated = await getCustomCategories();
    setCustomCats(updated);
    setCategory(cat.id);
    setShowAddModal(false);
    setNewLabel('');
    setNewEmoji('🏷️');
  };

  const save = async () => {
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) { setAmountError(true); return; }
    if (isEdit && params.id) {
      await updateTransaction({ id: parseInt(params.id), amount: parsed, type: txType, category, note: note.trim(), date: initialDate });
    } else {
      await addTransaction(parsed, txType, category, note.trim(), initialDate);
    }
    router.back();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, gap: 14 }}>

        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEdit ? 'Edit Entry' : 'Add Entry'}</Text>
        </View>

        <View style={styles.dateBadge}>
          <Ionicons name="calendar-outline" size={16} color="#555" />
          <Text style={styles.dateBadgeText}>{initialDate}</Text>
        </View>

        {/* Type Toggle */}
        <View style={styles.typeToggle}>
          {([
            { t: 'EXPENSE', label: '💸 Expense' },
            { t: 'INCOME',  label: '💰 Income'  },
            { t: 'ATM',     label: '🏧 ATM'     },
          ] as { t: TransactionType; label: string }[]).map(({ t, label }) => (
            <TouchableOpacity
              key={t}
              style={[styles.typeBtn, txType === t && { backgroundColor: TYPE_META[t].color }]}
              onPress={() => handleTypeChange(t)}
            >
              <Text style={[styles.typeBtnText, txType === t && { color: '#fff' }]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {isAtm && (
          <View style={styles.atmNotice}>
            <Ionicons name="information-circle-outline" size={18} color="#546E7A" />
            <Text style={styles.atmNoticeText}>
              ATM withdrawals are cash transfers — they don't count as expenses. Record actual spending separately.
            </Text>
          </View>
        )}

        {/* Amount */}
        <View>
          <Text style={styles.label}>Amount (৳)</Text>
          <TextInput
            style={[styles.input, amountError && styles.inputError]}
            value={amount}
            onChangeText={v => { setAmount(v); setAmountError(false); }}
            placeholder="0.00"
            keyboardType="decimal-pad"
            placeholderTextColor="#BBB"
          />
          {amountError && <Text style={styles.errorText}>Enter a valid amount</Text>}
        </View>

        {/* Category — hidden for ATM */}
        {!isAtm && (
          <View>
            <Text style={styles.label}>Category</Text>
            <View style={styles.categoryGrid}>
              {visibleCats.map(cat => {
                const meta = getCategoryMeta(cat, customCats);
                const selected = category === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.categoryChip, selected && { backgroundColor: meta.color, borderColor: meta.color }]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text style={styles.categoryEmoji}>{meta.emoji}</Text>
                    <Text style={[styles.categoryLabel, selected && { color: '#fff' }]} numberOfLines={1}>
                      {meta.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              {/* See more / less */}
              {hasMore && (
                <TouchableOpacity style={styles.seeMoreChip} onPress={() => setShowAll(v => !v)}>
                  <Ionicons name={showAll ? 'chevron-up' : 'chevron-down'} size={14} color="#1976D2" />
                  <Text style={styles.seeMoreText}>{showAll ? 'See less' : `+${allCats.length - DEFAULT_CATEGORIES_SHOWN} more`}</Text>
                </TouchableOpacity>
              )}

              {/* Add custom category */}
              <TouchableOpacity style={styles.addCatChip} onPress={() => setShowAddModal(true)}>
                <Ionicons name="add" size={16} color="#1976D2" />
                <Text style={styles.addCatText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Note */}
        <View>
          <Text style={styles.label}>Note (optional)</Text>
          <TextInput
            style={[styles.input, styles.noteInput]}
            value={note}
            onChangeText={setNote}
            placeholder="Add a note..."
            placeholderTextColor="#BBB"
            multiline
            numberOfLines={3}
          />
        </View>

        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: typeMeta.color }]} onPress={save}>
          <Text style={styles.saveBtnText}>{isEdit ? 'Update' : 'Save'}</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Add Category Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Custom Category</Text>

            <View style={styles.emojiRow}>
              {EMOJIS.map(e => (
                <TouchableOpacity
                  key={e}
                  style={[styles.emojiBtn, newEmoji === e && styles.emojiBtnSelected]}
                  onPress={() => setNewEmoji(e)}
                >
                  <Text style={{ fontSize: 22 }}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.selectedEmoji}>{newEmoji}</Text>

            <TextInput
              style={[styles.input, { marginTop: 8 }]}
              value={newLabel}
              onChangeText={setNewLabel}
              placeholder="Category name"
              placeholderTextColor="#BBB"
            />

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowAddModal(false)}>
                <Text style={{ color: '#666' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={handleAddCategory}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    backgroundColor: '#ECEFF1', alignSelf: 'flex-start',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  dateBadgeText: { fontSize: 13, color: '#555', fontWeight: '600' },
  typeToggle: { flexDirection: 'row', gap: 8 },
  typeBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
    borderWidth: 1.5, borderColor: '#DDD', backgroundColor: '#fff',
  },
  typeBtnText: { fontSize: 13, fontWeight: '700', color: '#555' },
  atmNotice: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#ECEFF1', borderRadius: 10, padding: 12,
  },
  atmNoticeText: { flex: 1, fontSize: 13, color: '#546E7A', lineHeight: 18 },
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
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1.5, borderColor: '#DDD', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 7, backgroundColor: '#fff',
    maxWidth: '48%',
  },
  categoryEmoji: { fontSize: 15 },
  categoryLabel: { fontSize: 12, color: '#555', fontWeight: '500', flexShrink: 1 },
  seeMoreChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1.5, borderColor: '#1976D2', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 7, backgroundColor: '#E3F2FD',
  },
  seeMoreText: { fontSize: 12, color: '#1976D2', fontWeight: '600' },
  addCatChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1.5, borderColor: '#1976D2', borderStyle: 'dashed', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 7,
  },
  addCatText: { fontSize: 12, color: '#1976D2', fontWeight: '600' },
  saveBtn: { borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8, marginBottom: 32 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalTitle: { fontSize: 17, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  emojiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  emojiBtn: { padding: 6, borderRadius: 8, borderWidth: 1.5, borderColor: '#EEE' },
  emojiBtnSelected: { borderColor: '#1976D2', backgroundColor: '#E3F2FD' },
  selectedEmoji: { fontSize: 32, textAlign: 'center', marginVertical: 8 },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 16 },
  modalCancel: {
    flex: 1, padding: 14, borderRadius: 10, alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  modalSave: {
    flex: 1, padding: 14, borderRadius: 10, alignItems: 'center',
    backgroundColor: '#1976D2',
  },
});
