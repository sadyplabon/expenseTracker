import * as SQLite from 'expo-sqlite';

export type TransactionType = 'EXPENSE' | 'INCOME' | 'ATM';

export type ExpenseCategory =
  | 'FOOD' | 'GROCERY' | 'VEGETABLES' | 'FISH' | 'MEAT'
  | 'TRANSPORT' | 'SHOPPING' | 'ELECTRONICS' | 'FURNITURE' | 'TOILETRIES'
  | 'BILLS' | 'HEALTH' | 'OTHER';

export type IncomeCategory =
  | 'SALARY' | 'FREELANCE' | 'BUSINESS' | 'OTHER_INCOME';

// Category is a string to support custom user-defined categories too
export type Category = ExpenseCategory | IncomeCategory | 'ATM' | string;

export interface Transaction {
  id: number;
  amount: number;
  type: TransactionType;
  category: Category;
  note: string;
  date: string; // YYYY-MM-DD
}

export interface CategoryTotal {
  category: Category;
  total: number;
}

export interface MonthlySummary {
  totalIncome: number;
  totalExpense: number;
  net: number;
}

let db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('expenses.db');
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount REAL NOT NULL,
      type TEXT NOT NULL DEFAULT 'EXPENSE',
      category TEXT NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      date TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_date ON expenses(date);
  `);
  // Migrate: add type column if it doesn't exist yet
  try {
    await db.execAsync(`ALTER TABLE expenses ADD COLUMN type TEXT NOT NULL DEFAULT 'EXPENSE'`);
  } catch (_) {
    // column already exists, ignore
  }
  return db;
}

export async function addTransaction(
  amount: number,
  type: TransactionType,
  category: Category,
  note: string,
  date: string
): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    'INSERT INTO expenses (amount, type, category, note, date) VALUES (?, ?, ?, ?, ?)',
    [amount, type, category, note, date]
  );
}

export async function updateTransaction(tx: Transaction): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    'UPDATE expenses SET amount = ?, type = ?, category = ?, note = ?, date = ? WHERE id = ?',
    [tx.amount, tx.type, tx.category, tx.note, tx.date, tx.id]
  );
}

export async function deleteTransaction(id: number): Promise<void> {
  const database = await getDb();
  await database.runAsync('DELETE FROM expenses WHERE id = ?', [id]);
}

export async function getTransactionsByDate(date: string): Promise<Transaction[]> {
  const database = await getDb();
  return database.getAllAsync<Transaction>(
    'SELECT * FROM expenses WHERE date = ? ORDER BY id DESC',
    [date]
  );
}

export async function getTransactionsByMonth(yearMonth: string): Promise<Transaction[]> {
  const database = await getDb();
  return database.getAllAsync<Transaction>(
    "SELECT * FROM expenses WHERE date LIKE ? ORDER BY date DESC, id DESC",
    [`${yearMonth}%`]
  );
}

export async function getMonthlySummary(yearMonth: string): Promise<MonthlySummary> {
  const database = await getDb();
  const rows = await database.getAllAsync<{ type: TransactionType; total: number }>(
    "SELECT type, SUM(amount) as total FROM expenses WHERE date LIKE ? GROUP BY type",
    [`${yearMonth}%`]
  );
  const totalIncome = rows.find(r => r.type === 'INCOME')?.total ?? 0;
  const totalExpense = rows.find(r => r.type === 'EXPENSE')?.total ?? 0;
  // ATM withdrawals are excluded from net — they are cash transfers, not expenses
  return { totalIncome, totalExpense, net: totalIncome - totalExpense };
}

export async function getAtmTotalForMonth(yearMonth: string): Promise<number> {
  const database = await getDb();
  const result = await database.getFirstAsync<{ total: number | null }>(
    "SELECT SUM(amount) as total FROM expenses WHERE date LIKE ? AND type = 'ATM'",
    [`${yearMonth}%`]
  );
  return result?.total ?? 0;
}

export async function getCategoryTotalsForMonth(
  yearMonth: string,
  type: TransactionType
): Promise<CategoryTotal[]> {
  const database = await getDb();
  return database.getAllAsync<CategoryTotal>(
    "SELECT category, SUM(amount) as total FROM expenses WHERE date LIKE ? AND type = ? GROUP BY category ORDER BY total DESC",
    [`${yearMonth}%`, type]
  );
}
