import type { Transaction } from './types';

export function isReportableTransaction(tx: Pick<Transaction, 'excludedFromReports'>): boolean {
  return !tx.excludedFromReports;
}

export function getReportableTransactions<T extends Pick<Transaction, 'excludedFromReports'>>(transactions: T[]): T[] {
  return transactions.filter(isReportableTransaction);
}
