import { Category, ExpenseCategory, IncomeCategory, TransactionType } from '../db/database';

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'FOOD', 'TRANSPORT', 'SHOPPING', 'BILLS', 'HEALTH', 'OTHER'
];

export const INCOME_CATEGORIES: IncomeCategory[] = [
  'SALARY', 'FREELANCE', 'BUSINESS', 'OTHER_INCOME'
];

export const CATEGORY_META: Record<Category, { label: string; emoji: string; color: string }> = {
  // Expenses
  FOOD:         { label: 'Food & Drinks',    emoji: '🍔', color: '#E53935' },
  TRANSPORT:    { label: 'Transport',        emoji: '🚌', color: '#FB8C00' },
  SHOPPING:     { label: 'Shopping',         emoji: '🛍️', color: '#8E24AA' },
  BILLS:        { label: 'Bill Payment',     emoji: '📄', color: '#D32F2F' },
  HEALTH:       { label: 'Health',           emoji: '💊', color: '#00ACC1' },
  OTHER:        { label: 'Other Expense',    emoji: '💸', color: '#757575' },
  // ATM (neutral transfer)
  ATM:          { label: 'ATM Withdrawal',   emoji: '🏧', color: '#546E7A' },
  // Income
  SALARY:       { label: 'Salary',           emoji: '💼', color: '#2E7D32' },
  FREELANCE:    { label: 'Freelance',        emoji: '💻', color: '#388E3C' },
  BUSINESS:     { label: 'Business',         emoji: '🏢', color: '#43A047' },
  OTHER_INCOME: { label: 'Other Income',     emoji: '💰', color: '#66BB6A' },
};

export const TYPE_META: Record<TransactionType, { label: string; color: string; bgColor: string }> = {
  EXPENSE: { label: 'Expense',        color: '#E53935', bgColor: '#FFEBEE' },
  INCOME:  { label: 'Income',         color: '#2E7D32', bgColor: '#E8F5E9' },
  ATM:     { label: 'ATM Withdrawal', color: '#546E7A', bgColor: '#ECEFF1' },
};

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
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
