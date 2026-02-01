import React, { useState, useMemo } from 'react';
import { BudgetLine } from '../types';
import { formatCurrency, generateId } from '../utils';
import { Button } from './ui/Button';
import { Printer, Plus, Trash2, Save } from 'lucide-react';

interface BudgetTabProps {
  budgetLines: BudgetLine[];
  onUpdate: (lines: BudgetLine[]) => void;
}

export const BudgetTab: React.FC<BudgetTabProps> = ({ budgetLines, onUpdate }) => {
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleValueChange = (id: string, field: 'amountNMinus1' | 'amountN' | 'label', value: any) => {
    const updated = budgetLines.map(line => 
      line.id === id ? { ...line, [field]: value } : line
    );
    onUpdate(updated);
  };

  const addLine = (section: 'RECETTE' | 'DEPENSE' | 'VALORISATION', category: string) => {
    const newLine: BudgetLine = {
      id: generateId(),
      section,
      category,
      label: 'Nouvelle ligne',
      amountNMinus1: 0,
      amountN: 0
    };
    onUpdate([...budgetLines, newLine]);
    setEditingId(newLine.id);
  };

  const deleteLine = (id: string) => {
    if(window.confirm("Supprimer cette ligne ?")) {
      onUpdate(budgetLines.filter(l => l.id !== id));
    }
  };

  const renderSection = (sectionTitle: string, sectionKey: 'RECETTE' | 'DEPENSE' | 'VALORISATION', colorClass: string) => {
    const sectionLines = budgetLines.filter(l => l.section === sectionKey);
    
    // Group by category
    const categories: string[] = Array.from(new Set(sectionLines.map(l => l.category)));
    
    const totalNMinus1 = sectionLines.reduce((acc, l) => acc + l.amountNMinus1, 0);
    const totalN = sectionLines.reduce((acc, l) => acc + l.amountN, 0);

    return (
      <div className="mb-8 break-inside-avoid">
        <h3 className={`text-xl font-bold mb-4 uppercase border-b-2 pb-2 ${colorClass} flex justify-between items-center`}>
          {sectionTitle}
          <div className="text-sm font-normal normal-case opacity-70">
             Total N-1: {formatCurrency(totalNMinus1)} | Total N: {formatCurrency(totalN)}
          </div>
        </h3>
        
        {categories.map(cat => {
            const catLines = sectionLines.filter(l => l.category === cat);
            const subTotalNMinus1 = catLines.reduce((acc, l) => acc + l.amountNMinus1, 0);
            const subTotalN = catLines.reduce((acc, l) => acc + l.amountN, 0);

            return (
                <div key={cat} className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden break-inside-avoid">
                    <div className="bg-gray-50 px-4 py-2 font-semibold text-gray-700 flex justify-between items-center print:bg-gray-100 print:text-black">
                        <span>{cat}</span>
                        <Button size="sm" variant="ghost" className="no-print" onClick={() => addLine(sectionKey, cat)}>
                            <Plus className="w-3 h-3" />
                        </Button>
                    </div>
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 print:bg-gray-100">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/2">Libellé</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">Réalisé N-1</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">Prévisionnel N</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">Écart</th>
                                <th className="px-4 py-2 w-10 no-print"></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {catLines.map(line => {
                                const gap = line.amountN - line.amountNMinus1;
                                const gapColor = gap > 0 ? 'text-green-600' : (gap < 0 ? 'text-red-600' : 'text-gray-400');
                                
                                return (
                                    <tr key={line.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-2 text-sm text-gray-900">
                                            <input 
                                                type="text" 
                                                className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm placeholder-gray-400"
                                                value={line.label}
                                                onChange={(e) => handleValueChange(line.id, 'label', e.target.value)}
                                                placeholder="Libellé..."
                                            />
                                        </td>
                                        <td className="px-4 py-2 text-sm text-right text-gray-600">
                                            <input 
                                                type="number" step="0.01"
                                                className="w-full bg-transparent border-none focus:ring-0 p-0 text-right text-sm"
                                                value={line.amountNMinus1}
                                                onChange={(e) => handleValueChange(line.id, 'amountNMinus1', parseFloat(e.target.value) || 0)}
                                            />
                                        </td>
                                        <td className="px-4 py-2 text-sm text-right font-medium text-gray-900 bg-blue-50 bg-opacity-30 print:bg-transparent">
                                            <input 
                                                type="number" step="0.01"
                                                className="w-full bg-transparent border-none focus:ring-0 p-0 text-right text-sm font-medium"
                                                value={line.amountN}
                                                onChange={(e) => handleValueChange(line.id, 'amountN', parseFloat(e.target.value) || 0)}
                                            />
                                        </td>
                                        <td className={`px-4 py-2 text-sm text-right font-medium ${gapColor}`}>
                                            {gap > 0 ? '+' : ''}{formatCurrency(gap)}
                                        </td>
                                        <td className="px-4 py-2 text-right no-print">
                                            <button onClick={() => deleteLine(line.id)} className="text-gray-400 hover:text-red-600">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                            {/* Subtotal Row */}
                            <tr className="bg-gray-100 font-semibold text-gray-800 border-t-2 border-gray-200 print:bg-gray-200">
                                <td className="px-4 py-2 text-sm text-right uppercase tracking-wider">Sous-total</td>
                                <td className="px-4 py-2 text-sm text-right">{formatCurrency(subTotalNMinus1)}</td>
                                <td className="px-4 py-2 text-sm text-right">{formatCurrency(subTotalN)}</td>
                                <td className="px-4 py-2 text-sm text-right">
                                    {formatCurrency(subTotalN - subTotalNMinus1)}
                                </td>
                                <td className="no-print"></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            );
        })}

        {/* Section Total Footer */}
        <div className={`p-4 rounded-lg flex justify-between items-center text-white font-bold text-lg ${colorClass.replace('text-', 'bg-').replace('700', '600')} print:text-white`}>
            <span>TOTAL {sectionTitle}</span>
            <div className="flex gap-8">
                <span>N-1: {formatCurrency(totalNMinus1)}</span>
                <span>N: {formatCurrency(totalN)}</span>
            </div>
        </div>
      </div>
    );
  };

  const globalNMinus1 = budgetLines.reduce((acc, l) => l.section !== 'VALORISATION' ? acc + (l.section === 'RECETTE' ? l.amountNMinus1 : -l.amountNMinus1) : acc, 0);
  const globalN = budgetLines.reduce((acc, l) => l.section !== 'VALORISATION' ? acc + (l.section === 'RECETTE' ? l.amountN : -l.amountN) : acc, 0);

  return (
    <div className="space-y-8">
      {/* Header Controls */}
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow no-print">
        <div>
           <h2 className="text-2xl font-bold text-gray-800">Budget Prévisionnel</h2>
           <p className="text-sm text-gray-500">Planification financière N vs N-1</p>
        </div>
        <Button onClick={() => window.print()} variant="secondary">
          <Printer className="w-4 h-4 mr-2" /> Imprimer / PDF
        </Button>
      </div>

      {/* Main Budget Content */}
      <div className="print:w-full">
        {renderSection('RECETTES', 'RECETTE', 'text-green-700')}
        <div className="page-break"></div>
        {renderSection('DÉPENSES', 'DEPENSE', 'text-red-700')}
        
        {/* Global Balance */}
        <div className="bg-indigo-50 border-2 border-indigo-200 p-6 rounded-lg mb-8 break-inside-avoid print:bg-white print:border-black">
            <h3 className="text-center text-xl font-bold text-indigo-900 uppercase mb-4">Résultat Prévisionnel (Hors Valorisation)</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                    <div className="text-sm text-gray-500 uppercase tracking-wider">Résultat N-1</div>
                    <div className={`text-2xl font-bold ${globalNMinus1 >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(globalNMinus1)}
                    </div>
                </div>
                <div>
                    <div className="text-sm text-gray-500 uppercase tracking-wider">Résultat N</div>
                    <div className={`text-2xl font-bold ${globalN >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(globalN)}
                    </div>
                </div>
                <div>
                    <div className="text-sm text-gray-500 uppercase tracking-wider">Écart Global</div>
                    <div className={`text-2xl font-bold ${(globalN - globalNMinus1) >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                        {globalN - globalNMinus1 > 0 ? '+' : ''}{formatCurrency(globalN - globalNMinus1)}
                    </div>
                </div>
            </div>
        </div>

        {renderSection('VALORISATION', 'VALORISATION', 'text-blue-700')}
      </div>
    </div>
  );
};