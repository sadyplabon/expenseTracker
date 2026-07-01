import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { getTransactionsByMonth, addTransaction, Transaction, TransactionType, Category } from '../db/database';

const CSV_HEADER = 'id,date,type,category,amount,note\n';

function escapeCsv(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current); current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

export async function exportAllData(): Promise<void> {
  // Get all data by querying a broad range
  const db = await import('../db/database').then(m => m.getDb());
  const rows = await db.getAllAsync<Transaction>(
    'SELECT * FROM expenses ORDER BY date DESC, id DESC'
  );

  let csv = CSV_HEADER;
  for (const row of rows) {
    csv += [
      row.id,
      row.date,
      row.type,
      escapeCsv(row.category),
      row.amount.toFixed(2),
      escapeCsv(row.note),
    ].join(',') + '\n';
  }

  const fileUri = FileSystem.cacheDirectory + 'budgetbuddy_export.csv';
  await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: 'Export BudgetBuddy Data' });
  } else {
    throw new Error('Sharing is not available on this device');
  }
}

export async function importData(): Promise<{ imported: number; skipped: number }> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['text/csv', 'text/comma-separated-values', 'application/csv', '*/*'],
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets?.[0]) {
    return { imported: 0, skipped: 0 };
  }

  const fileUri = result.assets[0].uri;
  const content = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.UTF8 });
  const lines = content.split('\n').filter(l => l.trim());

  // Skip header
  const dataLines = lines[0].startsWith('id,') ? lines.slice(1) : lines;

  let imported = 0, skipped = 0;

  for (const line of dataLines) {
    if (!line.trim()) continue;
    const cols = parseCsvLine(line);
    if (cols.length < 5) { skipped++; continue; }

    const [, date, type, category, amount, note = ''] = cols;
    const parsedAmount = parseFloat(amount);

    if (!date || !type || !category || isNaN(parsedAmount)) { skipped++; continue; }

    try {
      await addTransaction(
        parsedAmount,
        type as TransactionType,
        category as Category,
        note,
        date
      );
      imported++;
    } catch {
      skipped++;
    }
  }

  return { imported, skipped };
}
