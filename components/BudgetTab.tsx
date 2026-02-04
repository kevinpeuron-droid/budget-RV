import React, { useState, useEffect } from 'react';
import { BudgetLine, Transaction, Archive } from '../types';
import { formatCurrency, generateId, downloadCSV } from '../utils';
import { Button } from './ui/Button';
import { Printer, Plus, Trash2, Edit2, Check, X, FolderPlus, History, Download, Upload, Calculator } from 'lucide-react';

interface BudgetTabProps {
  budgetLines: BudgetLine[];
  transactions: Transaction[];
  year: number;
  archives: Archive[];
  onUpdate: (lines: BudgetLine[]) => void;
  onYearChange: (year: number) => void;
}

interface BudgetRowProps {
    line: BudgetLine;
    realizedN: number;
    // Nouveaux props pour gérer la source du N-1
    valueNMinus1: number;
    sourceNMinus1: 'LIVE' | 'ARCHIVE' | 'MANUAL';
    
    onDelete: (id: string) => void;
    onUpdateLine: (id: string, field: 'label' | 'amountNMinus1', value: any) => void;
}

// Sous-composant pour isoler l'état de saisie d'une ligne
const BudgetRow: React.FC<BudgetRowProps> = ({ line, realizedN, valueNMinus1, sourceNMinus1, onDelete, onUpdateLine }) => {
    const [label, setLabel] = useState(line.label);
    const [amountStr, setAmountStr] = useState(line.amountNMinus1.toString());

    useEffect(() => {
        setLabel(line.label);
    }, [line.label]);

    useEffect(() => {
        setAmountStr(line.amountNMinus1.toString());
    }, [line.amountNMinus1]);

    const handleBlurLabel = () => {
        if (label !== line.label) {
            onUpdateLine(line.id, 'label', label);
        }
    };

    const handleBlurAmount = () => {
        const val = parseFloat(amountStr) || 0;
        if (val !== line.amountNMinus1) {
            onUpdateLine(line.id, 'amountNMinus1', val);
        }
    };

    const gap = realizedN - valueNMinus1;
    const gapColor = gap > 0 ? 'text-green-600' : (gap < 0 ? 'text-red-600' : 'text-gray-400');

    const renderNMinus1Cell = () => {
        if (sourceNMinus1 === 'LIVE') {
            return (
                <div className="flex items-center justify-end gap-1 text-blue-700 font-medium bg-blue-50 px-2 py-1 rounded" title="Calculé automatiquement depuis les transactions de l'année précédente">
                    <Calculator className="w-3 h-3" />
                    {formatCurrency(valueNMinus1)}
                </div>
            );
        }
        if (sourceNMinus1 === 'ARCHIVE') {
            return (
                <div className="flex items-center justify-end gap-1 text-gray-500 font-medium bg-gray-50 px-2 py-1 rounded" title="Issu de l'archive clôturée">
                    <History className="w-3 h-3" />
                    {formatCurrency(valueNMinus1)}
                </div>
            );
        }
        // Manual
        return (
            <input 
                type="number" step="0.01"
                className="w-full bg-transparent border-none focus:ring-0 p-0 text-right text-sm focus:bg-white focus:shadow-sm rounded px-2 text-gray-500"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                onBlur={handleBlurAmount}
                placeholder="0,00 €"
            />
        );
    };

    return (
        <tr className="hover:bg-gray-50 group">
            <td className="px-4 py-2 text-sm text-gray-900 border-r border-gray-50">
                <input 
                    type="text" 
                    className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm placeholder-gray-400 focus:bg-white focus:shadow-sm rounded px-2"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    onBlur={handleBlurLabel}
                    placeholder="Libellé..."
                />
            </td>
            <td className="px-4 py-2 text-sm text-right text-gray-600 relative border-r border-gray-50">
                {renderNMinus1Cell()}
            </td>
            <td className="px-4 py-2 text-sm text-right font-medium text-gray-900 bg-gray-50 print:bg-transparent border-r border-gray-50" title="Calculé automatiquement depuis la saisie réalisée de l'année sélectionnée">
                {formatCurrency(realizedN)}
            </td>
            <td className={`px-4 py-2 text-sm text-right font-medium ${gapColor}`}>
                {gap > 0 ? '+' : ''}{formatCurrency(gap)}
            </td>
            <td className="px-4 py-2 text-right no-print">
                <button onClick={() => onDelete(line.id)} className="text-gray-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-4 h-4" />
                </button>
            </td>
        </tr>
    );
};

export const BudgetTab: React.FC<BudgetTabProps> = ({ budgetLines, transactions, year, archives, onUpdate, onYearChange }) => {
  const [editingCategory, setEditingCategory] = useState<{old: string, new: string} | null>(null);

  const previousYearArchive = archives.find(a => a.data.budgetYear === year - 1);

  const handleValueChange = (id: string, field: 'amountNMinus1' | 'label', value: any) => {
    const updated = budgetLines.map(line => 
      line.id === id ? { ...line, [field]: value } : line
    );
    onUpdate(updated);
  };

  // Calcul générique pour une année donnée
  const calculateRealizedForYear = (lineId: string, targetYear: number) => {
    return transactions
      .filter(t => {
          const tYear = parseInt(t.date.split('-')[0]);
          return t.budgetLineId === lineId && t.status === 'REALIZED' && tYear === targetYear;
      })
      .reduce((acc, t) => acc + t.amount, 0);
  };

  // Récupère la valeur N-1 depuis l'archive (fallback 2)
  const getArchivedNMinus1 = (line: BudgetLine) => {
      if (!previousYearArchive) return null;
      const archivedLine = previousYearArchive.data.budget.find(
          l => l.category === line.category && l.label === line.label && l.section === line.section
      );
      if (!archivedLine) return null;
      
      const realizedInArchive = previousYearArchive.data.realized
          .filter(t => t.budgetLineId === archivedLine.id && (t.status === 'REALIZED' || !t.status))
          .reduce((acc, t) => acc + t.amount, 0);
      return realizedInArchive;
  };

  // Logique principale pour déterminer la valeur et la source de N-1
  const getNMinus1Data = (line: BudgetLine): { value: number, source: 'LIVE' | 'ARCHIVE' | 'MANUAL' } => {
      // 1. Essayer de calculer depuis les transactions réelles de l'année précédente
      const liveValue = calculateRealizedForYear(line.id, year - 1);
      if (liveValue !== 0) {
          return { value: liveValue, source: 'LIVE' };
      }

      // 2. Essayer de récupérer depuis l'archive
      const archivedValue = getArchivedNMinus1(line);
      if (archivedValue !== null) {
          return { value: archivedValue, source: 'ARCHIVE' };
      }

      // 3. Fallback sur la saisie manuelle
      return { value: line.amountNMinus1, source: 'MANUAL' };
  };

  const handleExportBudgetCSV = () => {
    const header = ['Section', 'Categorie', 'Libelle', 'RealiseN', 'RealiseN-1'];
    const rows = budgetLines.map(line => {
      const realizedN = calculateRealizedForYear(line.id, year);
      const dataNMinus1 = getNMinus1Data(line);
      return `"${line.section}";"${line.category}";"${line.label}";"${realizedN}";"${dataNMinus1.value}"`;
    });
    
    const csvContent = [header.join(';'), ...rows].join('\n');
    downloadCSV(csvContent, `bilan_financier_${year}.csv`);
  };

  const handleImportNMinus1CSV = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Import inchangé pour le manuel
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          const text = event.target?.result as string;
          const lines = text.split('\n');
          let updatedBudgetLines = [...budgetLines];
          let matchCount = 0;

          for(let i = 1; i < lines.length; i++) {
              const row = lines[i].trim();
              if(!row) continue;
              const cols = row.split(';').map(c => c.replace(/^"|"$/g, ''));
              if(cols.length < 4) continue;

              const [section, category, label, amountStr] = cols;
              const amount = parseFloat(amountStr);

              const matchIndex = updatedBudgetLines.findIndex(l => 
                  l.section === section && 
                  l.category === category && 
                  l.label === label
              );

              if (matchIndex !== -1) {
                  updatedBudgetLines[matchIndex] = {
                      ...updatedBudgetLines[matchIndex],
                      amountNMinus1: amount
                  };
                  matchCount++;
              }
          }

          if (matchCount > 0) {
              onUpdate(updatedBudgetLines);
              alert(`${matchCount} lignes mises à jour avec les données N-1 importées.`);
          } else {
              alert("Aucune correspondance trouvée.");
          }
      };
      reader.readAsText(file);
      e.target.value = '';
  };

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
    
    const totalNMinus1 = sectionLines.reduce((acc, l) => acc + getNMinus1Data(l).value, 0);
    const totalN = sectionLines.reduce((acc, l) => acc + calculateRealizedForYear(l.id, year), 0);

    return (
      <div className="mb-8 break-inside-avoid">
        <div className={`flex justify-between items-center p-3 rounded-t-lg mb-0 ${colorClass} text-white print:text-white`}>
           <h3 className="text-xl font-bold uppercase tracking-wide">{sectionTitle}</h3>
           <div className="text-sm font-medium opacity-90">
             Total {year}: {formatCurrency(totalN)}
           </div>
        </div>
        
        {categories.map(cat => {
            const catLines = sectionLines.filter(l => l.category === cat);
            const subTotalNMinus1 = catLines.reduce((acc, l) => acc + getNMinus1Data(l).value, 0);
            const subTotalN = catLines.reduce((acc, l) => acc + calculateRealizedForYear(l.id, year), 0);

            const isRenaming = editingCategory?.old === cat;

            return (
                <div key={cat} className="bg-white border-l border-r border-b border-gray-200 overflow-hidden break-inside-avoid">
                    <div className="bg-orange-50 px-4 py-2 font-semibold text-gray-800 flex justify-between items-center print:bg-orange-50 print:text-gray-900 border-t border-gray-100">
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
                        <thead className="bg-gray-50 print:bg-white">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/2">Libellé</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                                    Réalisé {year-1}
                                </th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">Réalisé {year}</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">Écart</th>
                                <th className="px-4 py-2 w-10 no-print"></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {catLines.map(line => {
                                const realizedN = calculateRealizedForYear(line.id, year);
                                const nMinus1Data = getNMinus1Data(line);
                                
                                return (
                                    <BudgetRow 
                                        key={line.id}
                                        line={line}
                                        realizedN={realizedN}
                                        valueNMinus1={nMinus1Data.value}
                                        sourceNMinus1={nMinus1Data.source}
                                        onDelete={deleteLine}
                                        onUpdateLine={handleValueChange}
                                    />
                                )
                            })}
                            <tr className="bg-gray-100 font-semibold text-gray-800 print:bg-gray-200">
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
      </div>
    );
  };

  const calculateGlobalRealizedForYear = (lines: BudgetLine[], targetYear: number) => {
      return lines.reduce((acc, l) => acc + calculateRealizedForYear(l.id, targetYear), 0);
  };
  
  const calculateGlobalNMinus1 = (lines: BudgetLine[]) => {
      return lines.reduce((acc, l) => acc + getNMinus1Data(l).value, 0);
  }

  const recLines = budgetLines.filter(l => l.section === 'RECETTE');
  const depLines = budgetLines.filter(l => l.section === 'DEPENSE');

  const globalNMinus1 = calculateGlobalNMinus1(recLines) - calculateGlobalNMinus1(depLines);
  const globalN = calculateGlobalRealizedForYear(recLines, year) - calculateGlobalRealizedForYear(depLines, year);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-lg shadow no-print gap-4">
        <div>
           <div className="flex items-center gap-3">
             <h2 className="text-2xl font-bold text-gray-800">Bilan Financier</h2>
             <span className="px-2 py-1 bg-gray-100 rounded text-sm font-bold text-gray-600">Exercice {year}</span>
           </div>
           <p className="text-sm text-gray-500 mt-1">
             Affiche uniquement les opérations datées de <strong>{year}</strong>.
           </p>
        </div>
        
        <div className="flex gap-2 flex-wrap justify-end">
            <Button onClick={handleExportBudgetCSV} variant="ghost" size="sm" title="Exporter le réalisé de l'année en cours (N) au format CSV pour l'utiliser l'année prochaine">
                <Download className="w-4 h-4 mr-2" /> Exporter {year}
            </Button>
            <label className="flex items-center px-3 py-2 bg-white border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">
                <Upload className="w-4 h-4 mr-2" /> Import N-1
                <input type="file" className="hidden" accept=".csv, .txt" onChange={handleImportNMinus1CSV} />
            </label>
            <Button onClick={() => window.print()} variant="secondary" size="sm">
                <Printer className="w-4 h-4 mr-2" /> Imprimer
            </Button>
        </div>
      </div>

      <div className="print-only mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Bilan Financier {year}</h1>
      </div>

      <div className="print:w-full">
        <div className="print:min-h-screen">
            {renderSection('RECETTES (PRODUITS)', 'RECETTE', 'bg-orange-500')}
        </div>
        
        <div className="page-break"></div>
        
        <div className="print:min-h-screen">
            {renderSection('DÉPENSES (CHARGES)', 'DEPENSE', 'bg-gray-700')}
            
            <div className="bg-white border-2 border-gray-800 p-6 rounded-lg mb-8 break-inside-avoid shadow-lg print:shadow-none print:border-black">
                <h3 className="text-center text-xl font-bold text-gray-900 uppercase mb-4">Résultat Financier {year}</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                        <div className="text-sm text-gray-500 uppercase tracking-wider">Résultat {year-1}</div>
                        <div className={`text-2xl font-bold ${globalNMinus1 >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(globalNMinus1)}
                        </div>
                    </div>
                    <div>
                        <div className="text-sm text-gray-500 uppercase tracking-wider">Résultat {year}</div>
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

            {renderSection('VALORISATION', 'VALORISATION', 'bg-green-600')}
        </div>
      </div>
    </div>
  );
};