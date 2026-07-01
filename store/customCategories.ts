import AsyncStorage from '@react-native-async-storage/async-storage';
import { TransactionType } from '../db/database';

export interface CustomCategory {
  id: string;
  label: string;
  emoji: string;
  forType: 'EXPENSE' | 'INCOME';
}

const KEY = 'custom_categories';

export async function getCustomCategories(): Promise<CustomCategory[]> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function addCustomCategory(cat: Omit<CustomCategory, 'id'>): Promise<CustomCategory> {
  const all = await getCustomCategories();
  const newCat: CustomCategory = { ...cat, id: `custom_${Date.now()}` };
  await AsyncStorage.setItem(KEY, JSON.stringify([...all, newCat]));
  return newCat;
}

export async function editCustomCategory(id: string, label: string, emoji: string): Promise<void> {
  const all = await getCustomCategories();
  await AsyncStorage.setItem(KEY, JSON.stringify(
    all.map(c => c.id === id ? { ...c, label, emoji } : c)
  ));
}

export async function deleteCustomCategory(id: string): Promise<void> {
  const all = await getCustomCategories();
  await AsyncStorage.setItem(KEY, JSON.stringify(all.filter(c => c.id !== id)));
}
