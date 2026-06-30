import { Category } from '@/db/database';

export const CATEGORY_META: Record<Category, { label: string; emoji: string; color: string }> = {
  FOOD:      { label: 'Food & Drinks',    emoji: '🍔', color: '#1976D2' },
  TRANSPORT: { label: 'Transport',        emoji: '🚌', color: '#0288D1' },
  SHOPPING:  { label: 'Shopping',         emoji: '🛍️', color: '#388E3C' },
  BILLS:     { label: 'Bills & Utilities',emoji: '📄', color: '#D32F2F' },
  HEALTH:    { label: 'Health',           emoji: '💊', color: '#7B1FA2' },
  OTHER:     { label: 'Other',            emoji: '💰', color: '#757575' },
};

export const ALL_CATEGORIES: Category[] = [
  'FOOD', 'TRANSPORT', 'SHOPPING', 'BILLS', 'HEALTH', 'OTHER'
];

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
