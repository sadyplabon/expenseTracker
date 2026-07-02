import { Category, ExpenseCategory, IncomeCategory, TransactionType } from '../db/database';
import { CustomCategory } from '../store/customCategories';

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'FOOD', 'RESTAURANT', 'GROCERY', 'VEGETABLES', 'FRUITS', 'FISH', 'MEAT',
  'TRANSPORT', 'TOUR', 'SHOPPING', 'ELECTRONICS', 'FURNITURE', 'TOILETRIES',
  'BILLS', 'HEALTH', 'OTHER',
];

export const INCOME_CATEGORIES: IncomeCategory[] = [
  'SALARY', 'FREELANCE', 'BUSINESS', 'OTHER_INCOME'
];

export const DEFAULT_CATEGORIES_SHOWN = 6;

export const CATEGORY_META: Record<string, { label: string; emoji: string; color: string }> = {
  // Expenses
  FOOD:        { label: 'Food & Drinks',   emoji: '🍔', color: '#E53935' },
  RESTAURANT:  { label: 'Restaurant',      emoji: '🍽️', color: '#E64A19' },
  GROCERY:     { label: 'Grocery',         emoji: '🛒', color: '#F4511E' },
  VEGETABLES:  { label: 'Vegetables',      emoji: '🥦', color: '#43A047' },
  FRUITS:      { label: 'Fruits',          emoji: '🍎', color: '#D81B60' },
  FISH:        { label: 'Fish',            emoji: '🐟', color: '#0288D1' },
  MEAT:        { label: 'Meat',            emoji: '🥩', color: '#B71C1C' },
  TRANSPORT:   { label: 'Transport',       emoji: '🚌', color: '#FB8C00' },
  TOUR:        { label: 'Tour & Travel',   emoji: '✈️', color: '#0288D1' },
  SHOPPING:    { label: 'Shopping',        emoji: '🛍️', color: '#8E24AA' },
  ELECTRONICS: { label: 'Electronics',     emoji: '📱', color: '#3949AB' },
  FURNITURE:   { label: 'Furniture',       emoji: '🛋️', color: '#6D4C41' },
  TOILETRIES:  { label: 'Toiletries',      emoji: '🧴', color: '#00ACC1' },
  BILLS:       { label: 'Bill Payment',    emoji: '📄', color: '#D32F2F' },
  HEALTH:      { label: 'Health',          emoji: '💊', color: '#00838F' },
  OTHER:       { label: 'Other Expense',   emoji: '💸', color: '#757575' },
  // ATM (neutral)
  ATM:         { label: 'ATM Withdrawal',  emoji: '🏧', color: '#546E7A' },
  // Income
  SALARY:       { label: 'Salary',         emoji: '💼', color: '#2E7D32' },
  FREELANCE:    { label: 'Freelance',      emoji: '💻', color: '#388E3C' },
  BUSINESS:     { label: 'Business',       emoji: '🏢', color: '#43A047' },
  OTHER_INCOME: { label: 'Other Income',   emoji: '💰', color: '#66BB6A' },
};

export const TYPE_META: Record<TransactionType, { label: string; color: string; bgColor: string }> = {
  EXPENSE: { label: 'Expense',        color: '#E53935', bgColor: '#FFEBEE' },
  INCOME:  { label: 'Income',         color: '#2E7D32', bgColor: '#E8F5E9' },
  ATM:     { label: 'ATM Withdrawal', color: '#546E7A', bgColor: '#ECEFF1' },
};

export function getCategoryMeta(catId: string, customCategories: CustomCategory[] = []) {
  if (CATEGORY_META[catId]) return CATEGORY_META[catId];
  const custom = customCategories.find(c => c.id === catId);
  if (custom) return { label: custom.label, emoji: custom.emoji, color: '#1976D2' };
  return { label: catId, emoji: '❓', color: '#9E9E9E' };
}

export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatYearMonth(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function formatCurrency(amount: number): string {
  return `৳ ${amount.toFixed(2)}`;
}

export function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}
