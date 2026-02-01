import { Transaction, Contribution, Sponsor } from './types';

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
};

export const generateId = () => Math.random().toString(36).substring(2, 9);

export const downloadCSV = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const convertToCSV = (data: any[], headers: string[]) => {
  const csvRows = [];
  csvRows.push(headers.join(';'));

  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header] || '';
      const escaped = ('' + val).replace(/"/g, '\\"');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(';'));
  }
  return csvRows.join('\n');
};
