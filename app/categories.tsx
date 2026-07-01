import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList,
  Alert, Modal, TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  CustomCategory, getCustomCategories, addCustomCategory,
  editCustomCategory, deleteCustomCategory,
} from '../store/customCategories';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, CATEGORY_META } from '../constants/categories';

const EMOJIS = ['🏠','🎮','📚','✈️','🎵','🍕','⚽','🎁','🐾','🌿','💡','🔧','🎨','🧹','🛒','💈','🧺','🚿','🏋️','🎯','🧸','🍰','☕','🎪'];

type ForType = 'EXPENSE' | 'INCOME';

export default function CategoriesScreen() {
  const router = useRouter();
  const [customCats, setCustomCats] = useState<CustomCategory[]>([]);
  const [activeTab, setActiveTab] = useState<ForType>('EXPENSE');

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalLabel, setModalLabel] = useState('');
  const [modalEmoji, setModalEmoji] = useState('🏷️');

  const reload = async () => {
    const cats = await getCustomCategories();
    setCustomCats(cats);
  };

  useEffect(() => { reload(); }, []);

  const openAdd = () => {
    setEditingId(null);
    setModalLabel('');
    setModalEmoji('🏷️');
    setModalVisible(true);
  };

  const openEdit = (cat: CustomCategory) => {
    setEditingId(cat.id);
    setModalLabel(cat.label);
    setModalEmoji(cat.emoji);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!modalLabel.trim()) { Alert.alert('Name required'); return; }
    if (editingId) {
      await editCustomCategory(editingId, modalLabel.trim(), modalEmoji);
    } else {
      await addCustomCategory({ label: modalLabel.trim(), emoji: modalEmoji, forType: activeTab });
    }
    await reload();
    setModalVisible(false);
  };

  const handleDelete = (cat: CustomCategory) => {
    Alert.alert('Delete Category', `Delete "${cat.label}"? Existing entries with this category won't be affected.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => { await deleteCustomCategory(cat.id); await reload(); },
      },
    ]);
  };

  const defaultCats = activeTab === 'EXPENSE' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const userCats = customCats.filter(c => c.forType === activeTab);

  return (
    <View style={styles.container}>
      {/* Back header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Categories</Text>
        <TouchableOpacity onPress={openAdd} style={styles.addBtn}>
          <Ionicons name="add" size={24} color="#1976D2" />
        </TouchableOpacity>
      </View>

      {/* Tab */}
      <View style={styles.tabs}>
        {(['EXPENSE', 'INCOME'] as ForType[]).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, activeTab === t && styles.tabActive]}
            onPress={() => setActiveTab(t)}
          >
            <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>
              {t === 'EXPENSE' ? '💸 Expense' : '💰 Income'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={[
          ...defaultCats.map(id => ({ id, isDefault: true })),
          ...userCats.map(c => ({ id: c.id, isDefault: false })),
        ]}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16, gap: 8 }}
        ListHeaderComponent={
          <>
            <Text style={styles.groupLabel}>Default Categories</Text>
          </>
        }
        renderItem={({ item, index }) => {
          const isFirstCustom = !item.isDefault && index === defaultCats.length;
          const customCat = !item.isDefault ? customCats.find(c => c.id === item.id) : null;
          const meta = item.isDefault
            ? CATEGORY_META[item.id]
            : customCat
            ? { label: customCat.label, emoji: customCat.emoji, color: '#1976D2' }
            : null;

          if (!meta) return null;

          return (
            <>
              {isFirstCustom && (
                <Text style={[styles.groupLabel, { marginTop: 12 }]}>Your Custom Categories</Text>
              )}
              <View style={[styles.catRow, item.isDefault && styles.catRowDefault]}>
                <Text style={styles.catEmoji}>{meta.emoji}</Text>
                <Text style={styles.catLabel}>{meta.label}</Text>
                {item.isDefault ? (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultBadgeText}>Built-in</Text>
                  </View>
                ) : (
                  <View style={styles.catActions}>
                    <TouchableOpacity onPress={() => customCat && openEdit(customCat)} style={styles.actionBtn}>
                      <Ionicons name="pencil-outline" size={18} color="#1976D2" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => customCat && handleDelete(customCat)} style={styles.actionBtn}>
                      <Ionicons name="trash-outline" size={18} color="#E53935" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </>
          );
        }}
        ListFooterComponent={
          userCats.length === 0 ? (
            <View style={styles.emptyCustom}>
              <Ionicons name="albums-outline" size={36} color="#CCC" />
              <Text style={styles.emptyText}>No custom categories yet</Text>
              <TouchableOpacity style={styles.emptyAddBtn} onPress={openAdd}>
                <Ionicons name="add" size={16} color="#fff" />
                <Text style={styles.emptyAddText}>Add Category</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />

      {/* Add / Edit Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {editingId ? 'Edit Category' : `Add ${activeTab === 'EXPENSE' ? 'Expense' : 'Income'} Category`}
            </Text>

            <View style={styles.emojiGrid}>
              {EMOJIS.map(e => (
                <TouchableOpacity
                  key={e}
                  style={[styles.emojiBtn, modalEmoji === e && styles.emojiBtnSelected]}
                  onPress={() => setModalEmoji(e)}
                >
                  <Text style={{ fontSize: 20 }}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.selectedEmoji}>{modalEmoji}</Text>

            <TextInput
              style={styles.input}
              value={modalLabel}
              onChangeText={setModalLabel}
              placeholder="Category name"
              placeholderTextColor="#BBB"
              autoFocus
            />

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setModalVisible(false)}>
                <Text style={{ color: '#666', fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={handleSave}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>{editingId ? 'Update' : 'Add'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 14,
    elevation: 2,
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: 'bold', color: '#333', marginLeft: 8 },
  addBtn: { padding: 4 },
  tabs: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#EEE' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#1976D2' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#999' },
  tabTextActive: { color: '#1976D2' },
  groupLabel: { fontSize: 12, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  catRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 10, padding: 14,
    elevation: 1,
  },
  catRowDefault: { opacity: 0.8 },
  catEmoji: { fontSize: 22, marginRight: 12 },
  catLabel: { flex: 1, fontSize: 15, color: '#333', fontWeight: '500' },
  defaultBadge: { backgroundColor: '#F0F0F0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  defaultBadgeText: { fontSize: 11, color: '#888', fontWeight: '600' },
  catActions: { flexDirection: 'row', gap: 4 },
  actionBtn: { padding: 6 },
  emptyCustom: { alignItems: 'center', paddingTop: 24, gap: 10 },
  emptyText: { fontSize: 14, color: '#AAA' },
  emptyAddBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#1976D2', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginTop: 4 },
  emptyAddText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalTitle: { fontSize: 17, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  emojiBtn: { padding: 6, borderRadius: 8, borderWidth: 1.5, borderColor: '#EEE' },
  emojiBtnSelected: { borderColor: '#1976D2', backgroundColor: '#E3F2FD' },
  selectedEmoji: { fontSize: 32, textAlign: 'center', marginVertical: 8 },
  input: { backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#DDD', borderRadius: 10, padding: 14, fontSize: 15, color: '#333' },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 16 },
  modalCancel: { flex: 1, padding: 14, borderRadius: 10, alignItems: 'center', backgroundColor: '#F0F0F0' },
  modalSave: { flex: 1, padding: 14, borderRadius: 10, alignItems: 'center', backgroundColor: '#1976D2' },
});
