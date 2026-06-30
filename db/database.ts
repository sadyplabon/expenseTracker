import * as SQLite from 'expo-sqlite';

export type Category = 'FOOD' | 'TRANSPORT' | 'SHOPPING' | 'BILLS' | 'HEALTH' | 'OTHER';

export interface Expense {
  id: number;
  amount: number;
  category: Category;
  note: string;
  date: string; // YYYY-MM-DD
}

export interface CategoryTotal {
  category: Category;
  total: number;
}

let db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('expenses.db');
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      date TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_date ON expenses(date);
  `);
  return db;
}

export async function addExpense(
  amount: number,
  category: Category,
  note: string,
  date: string
): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    'INSERT INTO expenses (amount, category, note, date) VALUES (?, ?, ?, ?)',
    [amount, category, note, date]
  );
}

export async function updateExpense(expense: Expense): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    'UPDATE expenses SET amount = ?, category = ?, note = ?, date = ? WHERE id = ?',
    [expense.amount, expense.category, expense.note, expense.date, expense.id]
  );
}

export async function deleteExpense(id: number): Promise<void> {
  const database = await getDb();
  await database.runAsync('DELETE FROM expenses WHERE id = ?', [id]);
}

export async function getExpensesByDate(date: string): Promise<Expense[]> {
  const database = await getDb();
  return database.getAllAsync<Expense>(
    'SELECT * FROM expenses WHERE date = ? ORDER BY id DESC',
    [date]
  );
}

export async function getExpensesByMonth(yearMonth: string): Promise<Expense[]> {
  const database = await getDb();
  return database.getAllAsync<Expense>(
    "SELECT * FROM expenses WHERE date LIKE ? ORDER BY date DESC, id DESC",
    [`${yearMonth}%`]
  );
}

export async function getTotalForMonth(yearMonth: string): Promise<number> {
  const database = await getDb();
  const result = await database.getFirstAsync<{ total: number | null }>(
    "SELECT SUM(amount) as total FROM expenses WHERE date LIKE ?",
    [`${yearMonth}%`]
  );
  return result?.total ?? 0;
}

export async function getCategoryTotalsForMonth(yearMonth: string): Promise<CategoryTotal[]> {
  const database = await getDb();
  return database.getAllAsync<CategoryTotal>(
    "SELECT category, SUM(amount) as total FROM expenses WHERE date LIKE ? GROUP BY category ORDER BY total DESC",
    [`${yearMonth}%`]
  );
}
