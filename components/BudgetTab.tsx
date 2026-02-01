import React, { useState } from 'react';
import { BudgetLine, Transaction } from '../types';
import { formatCurrency, generateId } from '../utils';
import { Button } from './ui/Button';
import { Printer, Plus, Trash2, Edit2, Check, X, FolderPlus } from 'lucide-react';

interface BudgetTabProps {
  budgetLines: BudgetLine[];
  transactions: Transaction[];
  year: number;
  onUpdate: (lines: BudgetLine[]) => void;
  onYearChange: (year: number) => void;
}

export const BudgetTab: React.FC<BudgetTabProps> = ({ budgetLines, transactions, year, onUpdate, onYearChange }) => {
  const [editingCategory, setEditingCategory] = useState<{old: string, new: string} | null>(null);

  const handleValueChange = (id: string, field: 'amountNMinus1' | 'label', value: any) => {
    const updated = budgetLines.map(line => 
      line.id === id ? { ...line, [field]: value } : line
    );
    onUpdate(updated);
  };

  const calculateRealizedN = (lineId: string) => {
    return transactions
      .filter(t => t.budgetLineId === lineId && t.status === 'REALIZED')
      .reduce((acc, t) => acc + t.amount, 0);
  };

  // Add a new line (Libellé) to an existing category
  const addLineToCategory = (section: 'RECETTE' | 'DEPENSE' | 'VALORISATION', category: string) => {
    const newLine: BudgetLine = {
      id: generateId(),
      section,
      category,
      label: 'Nouveau libellé',
      amountNMinus1: 0,
      amountN: 0
    };
    onUpdate([...budgetLines, newLine]);
  };

  // Add a completely new Category group
  const addNewCategory = (section: 'RECETTE' | 'DEPENSE' | 'VALORISATION') => {
    const name = prompt("Nom de la nouvelle catégorie :");
    if (name) {
      const newLine: BudgetLine = {
        id: generateId(),
        section,
        category: name,
        label: 'Ligne par défaut',
        amountNMinus1: 0,
        amountN: 0
      };
      onUpdate([...budgetLines, newLine]);
    }
  };

  const deleteLine = (id: string) => {
    if(window.confirm("Supprimer cette ligne définitivement ?")) {
      onUpdate(budgetLines.filter(l => l.id !== id));
    }
  };

  const deleteCategory = (category: string, section: string) => {
     if(window.confirm(`Supprimer la catégorie "${category}" et toutes ses lignes ?`)) {
       onUpdate(budgetLines.filter(l => !(l.category === category && l.section === section)));
     }
  };

  const startRenameCategory = (category: string) => {
    setEditingCategory({ old: category, new: category });
  };

  const saveRenameCategory = (section: string) => {
    if (!editingCategory) return;
    const updated = budgetLines.map(l => 
      (l.category === editingCategory.old && l.section === section)
      ? { ...l, category: editingCategory.new }
      : l
    );
    onUpdate(updated);
    setEditingCategory(null);
  };

  const renderSection = (sectionTitle: string, sectionKey: 'RECETTE' | 'DEPENSE' | 'VALORISATION', colorClass: string) => {
    const sectionLines = budgetLines.filter(l => l.section === sectionKey);
    const categories: string[] = Array.from(new Set(sectionLines.map(l => l.category)));
    
    // Totaux globaux de la section
    const totalNMinus1 = sectionLines.reduce((acc, l) => acc + l.amountNMinus1, 0);
    const totalN = sectionLines.reduce((acc, l) => acc + calculateRealizedN(l.id), 0);

    return (
      <div className="mb-8 break-inside-avoid">
        <div className={`flex justify-between items-end border-b-2 pb-2 mb-4 ${colorClass}`}>
           <h3 className="text-xl font-bold uppercase">{sectionTitle}</h3>
           <div className="text-sm font-normal opacity-70 mb-1">
             Total N-1: {formatCurrency(totalNMinus1)} | Total N: {formatCurrency(totalN)}
           </div>
        </div>
        
        {categories.map(cat => {
            const catLines = sectionLines.filter(l => l.category === cat);
            const subTotalNMinus1 = catLines.reduce((acc, l) => acc + l.amountNMinus1, 0);
            const subTotalN = catLines.reduce((acc, l) => acc + calculateRealizedN(l.id), 0);

            const isRenaming = editingCategory?.old === cat;

            return (
                <div key={cat} className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden break-inside-avoid">
                    <div className="bg-gray-50 px-4 py-2 font-semibold text-gray-700 flex justify-between items-center print:bg-gray-100 print:text-black">
                        <div className="flex items-center gap-2">
                           {isRenaming ? (
                             <div className="flex items-center gap-1">
                               <input 
                                 className="border rounded px-1 py-0.5 text-sm"
                                 value={editingCategory.new}
                                 onChange={e => setEditingCategory({...editingCategory, new: e.target.value})}
                                 autoFocus
                               />
                               <button onClick={() => saveRenameCategory(sectionKey)} className="text-green-600"><Check className="w-4 h-4"/></button>
                               <button onClick={() => setEditingCategory(null)} className="text-red-600"><X className="w-4 h-4"/></button>
                             </div>
                           ) : (
                             <>
                               <span>{cat}</span>
                               <button onClick={() => startRenameCategory(cat)} className="text-gray-400 hover:text-blue-600 no-print ml-2" title="Renommer catégorie">
                                 <Edit2 className="w-3 h-3" />
                               </button>
                             </>
                           )}
                        </div>
                        <div className="flex gap-1 no-print">
                           <Button size="sm" variant="ghost" onClick={() => addLineToCategory(sectionKey, cat)} title="Ajouter une ligne">
                              <Plus className="w-4 h-4" />
                           </Button>
                           <Button size="sm" variant="ghost" onClick={() => deleteCategory(cat, sectionKey)} title="Supprimer catégorie" className="text-red-400 hover:text-red-600">
                              <Trash2 className="w-4 h-4" />
                           </Button>
                        </div>
                    </div>
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 print:bg-gray-100">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/2">Libellé</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">Réalisé N-1</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6 bg-blue-50 bg-opacity-30 print:bg-transparent">Réalisé N</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">Écart</th>
                                <th className="px-4 py-2 w-10 no-print"></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {catLines.map(line => {
                                const realizedN = calculateRealizedN(line.id);
                                const gap = realizedN - line.amountNMinus1;
                                const gapColor = gap > 0 ? 'text-green-600' : (gap < 0 ? 'text-red-600' : 'text-gray-400');
                                
                                return (
                                    <tr key={line.id} className="hover:bg-gray-50 group">
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
                                        <td className="px-4 py-2 text-sm text-right font-medium text-gray-900 bg-blue-50 bg-opacity-30 print:bg-transparent cursor-default" title="Calculé automatiquement depuis la saisie réalisée">
                                            {formatCurrency(realizedN)}
                                        </td>
                                        <td className={`px-4 py-2 text-sm text-right font-medium ${gapColor}`}>
                                            {gap > 0 ? '+' : ''}{formatCurrency(gap)}
                                        </td>
                                        <td className="px-4 py-2 text-right no-print">
                                            <button onClick={() => deleteLine(line.id)} className="text-gray-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
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
        
        <div className="no-print mt-4 mb-8">
            <Button variant="secondary" onClick={() => addNewCategory(sectionKey)} className="w-full border-2 border-dashed border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700">
                <FolderPlus className="w-5 h-5 mr-2" /> Ajouter une catégorie {sectionTitle.toLowerCase()}
            </Button>
        </div>

        {/* Section Total Footer */}
        <div className={`p-4 rounded-lg flex justify-between items-center text-white font-bold text-lg ${colorClass.replace('text-', 'bg-').replace('700', '600')} print:text-white break-inside-avoid`}>
            <span>TOTAL {sectionTitle}</span>
            <div className="flex gap-8">
                <span>N-1: {formatCurrency(totalNMinus1)}</span>
                <span>N: {formatCurrency(totalN)}</span>
            </div>
        </div>
      </div>
    );
  };

  const calculateGlobalRealizedN = (lines: BudgetLine[]) => {
      return lines.reduce((acc, l) => acc + calculateRealizedN(l.id), 0);
  };

  // Calculs globaux
  const recLines = budgetLines.filter(l => l.section === 'RECETTE');
  const depLines = budgetLines.filter(l => l.section === 'DEPENSE');

  const globalNMinus1 = 
    recLines.reduce((acc, l) => acc + l.amountNMinus1, 0) - 
    depLines.reduce((acc, l) => acc + l.amountNMinus1, 0);

  const globalN = 
    calculateGlobalRealizedN(recLines) - 
    calculateGlobalRealizedN(depLines);

  return (
    <div className="space-y-8">
      {/* Header Controls */}
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow no-print">
        <div>
           <div className="flex items-center gap-2">
             <h2 className="text-2xl font-bold text-gray-800">Bilan Financier</h2>
             <input 
                type="number" 
                value={year}
                onChange={(e) => onYearChange(parseInt(e.target.value) || new Date().getFullYear())}
                className="text-2xl font-bold text-gray-800 w-24 border-b border-gray-300 focus:outline-none focus:border-blue-500 bg-transparent text-center"
             />
           </div>
           <p className="text-sm text-gray-500">Comparatif N (Calculé depuis Saisie) vs N-1</p>
        </div>
        <Button onClick={() => window.print()} variant="secondary">
          <Printer className="w-4 h-4 mr-2" /> Imprimer / PDF
        </Button>
      </div>

      {/* Header Print Only */}
      <div className="print-only mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Bilan Financier {year}</h1>
      </div>

      {/* Main Budget Content */}
      <div className="print:w-full">
        {/* Page 1: Recettes */}
        <div className="print:min-h-screen">
            {renderSection('RECETTES', 'RECETTE', 'text-green-700')}
        </div>
        
        {/* Force page break for printing */}
        <div className="page-break"></div>
        
        {/* Page 2: Dépenses & Résultat */}
        <div className="print:min-h-screen">
            {renderSection('DÉPENSES', 'DEPENSE', 'text-red-700')}
            
            {/* Global Balance */}
            <div className="bg-indigo-50 border-2 border-indigo-200 p-6 rounded-lg mb-8 break-inside-avoid print:bg-white print:border-black">
                <h3 className="text-center text-xl font-bold text-indigo-900 uppercase mb-4">Résultat Financier (Hors Valorisation)</h3>
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
    </div>
  );
};