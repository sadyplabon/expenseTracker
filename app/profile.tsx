import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../components/Avatar';
import Logo from '../components/Logo';
import { getProfile, saveProfile } from '../store/profile';
import { getMonthlySummary, getTransactionsByMonth } from '../db/database';
import { formatCurrency, formatYearMonth } from '../constants/categories';
import { exportAllData, importData } from '../utils/dataTransfer';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [loading, setLoading] = useState(true);
  const [transferring, setTransferring] = useState(false);
  const [stats, setStats] = useState({ income: 0, expense: 0, net: 0, txCount: 0 });

  const ym = formatYearMonth(new Date());

  useEffect(() => {
    (async () => {
      const profile = await getProfile();
      setName(profile.name);
      setPhotoUri(profile.photoUri);
      setDraftName(profile.name);
      const [summary, txs] = await Promise.all([
        getMonthlySummary(ym),
        getTransactionsByMonth(ym),
      ]);
      setStats({ income: summary.totalIncome, expense: summary.totalExpense, net: summary.net, txCount: txs.length });
      setLoading(false);
    })();
  }, []);

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow access to your photo library to set a profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) setPhotoUri(result.assets[0].uri);
  };

  const saveChanges = async () => {
    const trimmed = draftName.trim();
    if (!trimmed) { Alert.alert('Name required'); return; }
    await saveProfile(trimmed, photoUri);
    setName(trimmed);
    setEditing(false);
  };

  const handleExport = async () => {
    setTransferring(true);
    try {
      await exportAllData();
    } catch (e: any) {
      Alert.alert('Export failed', e.message);
    } finally {
      setTransferring(false);
    }
  };

  const handleImport = async () => {
    Alert.alert(
      'Import Data',
      'This will add transactions from a CSV file. Existing data will not be deleted. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Import',
          onPress: async () => {
            setTransferring(true);
            try {
              const { imported, skipped } = await importData();
              Alert.alert('Import complete', `✅ ${imported} transactions imported.\n${skipped > 0 ? `⚠️ ${skipped} rows skipped.` : ''}`);
            } catch (e: any) {
              Alert.alert('Import failed', e.message);
            } finally {
              setTransferring(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View style={styles.headerCard}>
        <View style={styles.logoRow}>
          <Logo size={32} />
          <Text style={styles.appName}>BudgetBuddy</Text>
        </View>

        <TouchableOpacity onPress={editing ? pickPhoto : undefined} style={styles.avatarWrap}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Avatar name={name || 'User'} photoUri={photoUri} size={90} />
          }
          {editing && (
            <View style={styles.cameraOverlay}>
              <Ionicons name="camera" size={18} color="#fff" />
            </View>
          )}
        </TouchableOpacity>

        {editing ? (
          <TextInput
            style={styles.nameInput}
            value={draftName}
            onChangeText={setDraftName}
            placeholder="Your name"
            placeholderTextColor="rgba(255,255,255,0.5)"
            autoFocus
          />
        ) : (
          <Text style={styles.nameText}>{name || 'Tap Edit to set your name'}</Text>
        )}

        <View style={styles.editBtnRow}>
          {editing ? (
            <>
              <TouchableOpacity style={styles.saveBtn} onPress={saveChanges}>
                <Ionicons name="checkmark" size={15} color="#fff" />
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditing(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={styles.editBtn} onPress={() => { setDraftName(name); setEditing(true); }}>
              <Ionicons name="pencil" size={13} color="#1976D2" />
              <Text style={styles.editBtnText}>Edit Profile</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* This month */}
      <Text style={styles.sectionTitle}>This Month</Text>
      <View style={styles.statsGrid}>
        <StatCard label="Income"       value={formatCurrency(stats.income)}  color="#2E7D32" bg="#E8F5E9" />
        <StatCard label="Expense"      value={formatCurrency(stats.expense)} color="#E53935" bg="#FFEBEE" />
        <StatCard label="Net Balance"  value={formatCurrency(stats.net)}     color={stats.net >= 0 ? '#1565C0' : '#E65100'} bg={stats.net >= 0 ? '#E3F2FD' : '#FFF3E0'} />
        <StatCard label="Transactions" value={String(stats.txCount)}         color="#555"    bg="#F5F5F5" />
      </View>

      {/* Import / Export */}
      <Text style={styles.sectionTitle}>Data Management</Text>
      <View style={styles.dataCard}>
        <TouchableOpacity style={styles.dataBtn} onPress={handleExport} disabled={transferring}>
          <View style={[styles.dataIconBox, { backgroundColor: '#E8F5E9' }]}>
            <Ionicons name="share-outline" size={22} color="#2E7D32" />
          </View>
          <View style={styles.dataBtnText}>
            <Text style={styles.dataBtnTitle}>Export Data</Text>
            <Text style={styles.dataBtnSub}>Save all transactions as CSV</Text>
          </View>
          {transferring ? <ActivityIndicator size="small" /> : <Ionicons name="chevron-forward" size={18} color="#CCC" />}
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.dataBtn} onPress={handleImport} disabled={transferring}>
          <View style={[styles.dataIconBox, { backgroundColor: '#E3F2FD' }]}>
            <Ionicons name="download-outline" size={22} color="#1976D2" />
          </View>
          <View style={styles.dataBtnText}>
            <Text style={styles.dataBtnTitle}>Import Data</Text>
            <Text style={styles.dataBtnSub}>Load transactions from CSV file</Text>
          </View>
          {transferring ? <ActivityIndicator size="small" /> : <Ionicons name="chevron-forward" size={18} color="#CCC" />}
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.dataBtn} onPress={() => router.push('/categories')}>
          <View style={[styles.dataIconBox, { backgroundColor: '#F3E5F5' }]}>
            <Ionicons name="albums-outline" size={22} color="#7B1FA2" />
          </View>
          <View style={styles.dataBtnText}>
            <Text style={styles.dataBtnTitle}>Manage Categories</Text>
            <Text style={styles.dataBtnSub}>Add, edit, or delete custom categories</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#CCC" />
        </TouchableOpacity>
      </View>

      {/* About */}
      <Text style={styles.sectionTitle}>About</Text>
      <View style={styles.aboutCard}>
        <View style={styles.aboutRow}>
          <Logo size={52} />
          <View style={{ marginLeft: 14, flex: 1 }}>
            <Text style={styles.aboutName}>BudgetBuddy</Text>
            <Text style={styles.aboutTagline}>Smart & simple expense tracking</Text>
            <Text style={styles.aboutVersion}>Version 1.0.0</Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.devRow}>
          <Ionicons name="code-slash-outline" size={16} color="#888" />
          <Text style={styles.devText}>Developed by <Text style={styles.devName}>Sady Plabon</Text></Text>
        </View>
      </View>
    </ScrollView>
  );
}

function StatCard({ label, value, color, bg }: { label: string; value: string; color: string; bg: string }) {
  return (
    <View style={[styles.statCard, { backgroundColor: bg }]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  headerCard: { backgroundColor: '#1976D2', paddingTop: 20, paddingBottom: 24, alignItems: 'center', gap: 10 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  appName: { fontSize: 20, fontWeight: 'bold', color: '#fff', letterSpacing: 0.5 },
  avatarWrap: { position: 'relative' },
  cameraOverlay: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: '#0D47A1', borderRadius: 14, padding: 5,
    borderWidth: 2, borderColor: '#1976D2',
  },
  nameText: { fontSize: 19, fontWeight: 'bold', color: '#fff' },
  nameInput: {
    fontSize: 19, fontWeight: 'bold', color: '#fff',
    borderBottomWidth: 2, borderBottomColor: 'rgba(255,255,255,0.5)',
    paddingVertical: 4, paddingHorizontal: 12, minWidth: 180, textAlign: 'center',
  },
  editBtnRow: { flexDirection: 'row', gap: 8 },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
  },
  editBtnText: { fontSize: 13, fontWeight: '600', color: '#1976D2' },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#2E7D32', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
  },
  saveBtnText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  cancelBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  cancelBtnText: { fontSize: 13, color: '#fff' },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#666', marginLeft: 16, marginTop: 16, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginHorizontal: 16 },
  statCard: { flex: 1, minWidth: '44%', borderRadius: 12, padding: 14 },
  statLabel: { fontSize: 11, color: '#666', marginBottom: 4 },
  statValue: { fontSize: 15, fontWeight: 'bold' },
  dataCard: { marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', elevation: 1 },
  dataBtn: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  dataIconBox: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  dataBtnText: { flex: 1 },
  dataBtnTitle: { fontSize: 14, fontWeight: '600', color: '#333' },
  dataBtnSub: { fontSize: 12, color: '#888', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginHorizontal: 14 },
  aboutCard: { marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 14, padding: 16, elevation: 1 },
  aboutRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  aboutName: { fontSize: 17, fontWeight: 'bold', color: '#1976D2' },
  aboutTagline: { fontSize: 12, color: '#666', marginTop: 2 },
  aboutVersion: { fontSize: 11, color: '#AAA', marginTop: 4 },
  devRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 12 },
  devText: { fontSize: 13, color: '#666' },
  devName: { fontWeight: 'bold', color: '#1976D2' },
});
