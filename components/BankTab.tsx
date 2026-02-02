import React, { useState } from 'react';
import { BankLine, Transaction, BudgetLine } from '../types';
import { generateId, formatCurrency } from '../utils';
import { Button } from './ui/Button';
import { Trash2, Plus, Link as LinkIcon, Unlink, Check, AlertCircle, ArrowRight, Download, Upload, Calendar, Eraser } from 'lucide-react';

interface BankTabProps {
  bankLines: BankLine[];
  transactions: Transaction[];
  budget: BudgetLine[];
  lastPointedDate?: string; // Nouvelle prop
  onUpdateBankLines: (lines: BankLine[]) => void;
  onUpdateLastPointedDate: (date: string) => void; // Nouvelle prop
  onLinkTransaction: (bankId: string, transactionId: string) => void;
  onUnlinkTransaction: (bankId: string) => void;
  onCreateFromBank: (bankId: string, category: string, budgetLineId: string, description: string) => void;
}

export const BankTab: React.FC<BankTabProps> = ({ 
  bankLines, 
  transactions, 
  budget,
  lastPointedDate,
  onUpdateBankLines,
  onUpdateLastPointedDate,
  onLinkTransaction,
  onUnlinkTransaction,
  onCreateFromBank
}) => {
  const [newLine, setNewLine] = useState<Partial<BankLine>>({ date: '', description: '', amount: 0 });
  const [importText, setImportText] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [linkingBankId, setLinkingBankId] = useState<string | null>(null);
  
  // Create New Modal State
  const [creatingBankId, setCreatingBankId] = useState<string | null>(null);
  const [createFormData, setCreateFormData] = useState({ category: '', budgetLineId: '', description: '' });

  // Add Manual Line
  const handleAddManual = () => {
    if (!newLine.date || !newLine.description) return;
    const line: BankLine = {
      id: generateId(),
      date: newLine.date,
      description: newLine.description,
      amount: Number(newLine.amount),
    };
    onUpdateBankLines([...bankLines, line]);
    setNewLine({ date: '', description: '', amount: 0 });
  };

  // Logic to process raw text content
  const processCSVContent = (content: string) => {
    const lines = content.split('\n');
    const newLines: BankLine[] = [];
    let skippedCount = 0;
    
    lines.forEach(line => {
      if(!line.trim()) return;
      const parts = line.split(/;|\t/); // split by semicolon or tab
      
      // Structure demandée:
      // Col A (Index 0): Date
      // Col B (Index 1): Libellé
      // Col C (Index 2): Débit
      // Col D (Index 3): Crédit

      if (parts.length >= 2) {
         let dateStr = parts[0].trim();
         let formattedDate = dateStr;

         // Try to normalize date to YYYY-MM-DD if in DD/MM/YYYY
         if(dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
            const [d, m, y] = dateStr.split('/');
            formattedDate = `${y}-${m}-${d}`;
         }

         // Filtre anti-doublon basé sur la date de dernier pointage
         if (lastPointedDate && formattedDate <= lastPointedDate) {
             skippedCount++;
             return; // On ignore cette ligne car elle est déjà pointée
         }

         const desc = parts[1].trim();
         let amount = 0;

         // Gestion Débit (Col C) et Crédit (Col D)
         // On nettoie les valeurs (remplace virgule par point, supprime symboles monétaires)
         const debitStr = parts[2] ? parts[2].replace(',', '.').replace(/[^\d.-]/g, '') : '0';
         const creditStr = parts[3] ? parts[3].replace(',', '.').replace(/[^\d.-]/g, '') : '0';

         const debit = parseFloat(debitStr) || 0;
         const credit = parseFloat(creditStr) || 0;

         // Le montant est Crédit - Débit (Débit est souvent positif dans le CSV mais négatif comptablement)
         // Si la colonne Débit contient déjà un signe négatif, il faut gérer le cas, mais généralement en CSV bancaire c'est positif.
         // On assume ici que les colonnes C et D contiennent des valeurs absolues.
         amount = credit - Math.abs(debit);

         if(!isNaN(amount)) {
             newLines.push({
                 id: generateId(),
                 date: formattedDate,
                 description: desc,
                 amount
             });
         }
      }
    });

    if (newLines.length > 0) {
        onUpdateBankLines([...bankLines, ...newLines]);
        setImportText('');
        setShowImport(false);
        if (skippedCount > 0) {
            alert(`${newLines.length} lignes importées. ${skippedCount} lignes ignorées car antérieures ou égales à la date de dernier pointage.`);
        }
    } else {
        if (skippedCount > 0) {
            alert(`Aucune nouvelle ligne importée. ${skippedCount} lignes ont été ignorées car elles sont déjà pointées.`);
        } else {
            alert("Aucune ligne valide trouvée. Vérifiez le format (Col A: Date, B: Libellé, C: Débit, D: Crédit).");
        }
    }
  };

  // Import from Text Area
  const handleImportText = () => {
      processCSVContent(importText);
  };

  // Import from File
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          const text = event.target?.result as string;
          processCSVContent(text);
      };
      reader.readAsText(file);
      // Reset input value to allow re-uploading the same file if needed
      e.target.value = '';
  };

  const deleteLine = (id: string) => {
      if(window.confirm('Supprimer cette ligne bancaire ?')) {
          onUpdateBankLines(bankLines.filter(l => l.id !== id));
      }
  };

  const handleClearAll = () => {
      if (window.confirm("Attention: Vous allez supprimer TOUTES les lignes du relevé bancaire. Cette action est irréversible. Continuer ?")) {
          onUpdateBankLines([]);
      }
  };

  const handleClearLinked = () => {
      const count = bankLines.filter(l => l.transactionId).length;
      if (count === 0) {
          alert("Aucune ligne pointée à supprimer.");
          return;
      }
      if (window.confirm(`Supprimer les ${count} lignes déjà pointées (liées à une opération) ?`)) {
          onUpdateBankLines(bankLines.filter(l => !l.transactionId));
      }
  };

  // Filter transactions for linking: Not already linked to another bank line, and ideally matching amount
  const getLinkableTransactions = (bankLine: BankLine) => {
      // Find transactions that are NOT linked to ANY OTHER bank line
      const linkedTransactionIds = bankLines
        .filter(l => l.id !== bankLine.id && l.transactionId)
        .map(l => l.transactionId);
      
      return transactions.filter(t => !linkedTransactionIds.includes(t.id));
  };

  // Helper for Create Modal
  const openCreateModal = (line: BankLine) => {
      setCreatingBankId(line.id);
      setCreateFormData({ 
          category: '', 
          budgetLineId: '', 
          description: line.description 
      });
  };

  const submitCreate = () => {
      if(creatingBankId && createFormData.category && createFormData.budgetLineId) {
          onCreateFromBank(creatingBankId, createFormData.category, createFormData.budgetLineId, createFormData.description);
          setCreatingBankId(null);
      }
  };

  const availableCategories = Array.from(new Set(
      budget.map(l => l.category)
  ));
  
  const availableBudgetLines = budget.filter(l => l.category === createFormData.category);

  return (
    <div className="space-y-6">
      
      {/* Top Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Manual Add */}
        <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-bold text-gray-700 mb-3">Ajout Manuel</h3>
            <div className="flex flex-col gap-2">
                <input type="date" className="border p-2 rounded text-sm" value={newLine.date} onChange={e => setNewLine({...newLine, date: e.target.value})} />
                <input type="text" placeholder="Libellé" className="border p-2 rounded text-sm" value={newLine.description} onChange={e => setNewLine({...newLine, description: e.target.value})} />
                <input type="number" step="0.01" placeholder="Montant (+/-)" className="border p-2 rounded text-sm" value={newLine.amount || ''} onChange={e => setNewLine({...newLine, amount: parseFloat(e.target.value)})} />
                <Button onClick={handleAddManual} size="sm">Ajouter ligne</Button>
            </div>
        </div>

        {/* Import */}
        <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-start mb-3">
                 <h3 className="font-bold text-gray-700">Import CSV / Copier-Coller</h3>
            </div>
            
            {/* Last Pointed Date Configuration */}
            <div className="mb-4 bg-blue-50 p-3 rounded border border-blue-100">
                <label className="block text-xs font-semibold text-blue-800 mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Date du dernier pointage (exclure opérations avant/le)
                </label>
                <input 
                    type="date" 
                    className="border p-1 rounded text-sm w-full" 
                    value={lastPointedDate || ''}
                    onChange={(e) => onUpdateLastPointedDate(e.target.value)}
                />
                <p className="text-xs text-blue-600 mt-1">Les opérations antérieures à cette date seront ignorées lors de l'import.</p>
            </div>

            {!showImport ? (
                <div className="flex flex-col gap-2">
                    <p className="text-sm text-gray-500">Format: Col A: Date | Col B: Libellé | Col C: Débit | Col D: Crédit</p>
                    <Button variant="secondary" onClick={() => setShowImport(true)}>
                        <Download className="w-4 h-4 mr-2" /> Ouvrir l'outil d'import
                    </Button>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                     <div className="border-2 border-dashed border-gray-300 rounded p-4 text-center cursor-pointer hover:bg-gray-50 relative">
                        <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600 block">Cliquez pour importer un fichier CSV</span>
                        <input 
                            type="file" 
                            accept=".csv, .txt" 
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={handleFileUpload}
                        />
                     </div>
                     
                     <div className="relative">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t border-gray-300"></div>
                        </div>
                        <div className="relative flex justify-center">
                            <span className="px-2 bg-white text-sm text-gray-500">OU copier-coller</span>
                        </div>
                     </div>

                    <textarea 
                        className="w-full border p-2 text-xs h-24 font-mono" 
                        placeholder={`01/01/2025;Virement Asso;0;50\n02/01/2025;Achat Stylo;12.50;0`}
                        value={importText}
                        onChange={e => setImportText(e.target.value)}
                    />
                    <div className="flex gap-2">
                        <Button onClick={handleImportText} size="sm" className="flex-1">Importer Texte</Button>
                        <Button onClick={() => setShowImport(false)} variant="ghost" size="sm">Annuler</Button>
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
             <div>
                <h3 className="font-bold text-gray-700">Relevé de Compte ({bankLines.length} lignes)</h3>
                <div className="text-sm text-gray-500">
                    Solde pointé: <span className="font-bold text-gray-800">{formatCurrency(bankLines.reduce((acc, l) => acc + l.amount, 0))}</span>
                </div>
             </div>
             <div className="flex gap-2">
                 <Button variant="secondary" size="sm" onClick={handleClearLinked} className="text-xs" title="Supprimer uniquement les lignes déjà liées">
                    <Check className="w-3 h-3 mr-1 text-green-600" /> Purger Pointées
                 </Button>
                 <Button variant="danger" size="sm" onClick={handleClearAll} className="text-xs" title="Tout supprimer pour recommencer">
                    <Trash2 className="w-3 h-3 mr-1" /> Tout Vider
                 </Button>
             </div>
        </div>
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Libellé Banque</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Débit</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Crédit</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Rapprochement</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {bankLines.map(line => {
                        const linkedTx = transactions.find(t => t.id === line.transactionId);
                        const isLinked = !!linkedTx;

                        return (
                            <tr key={line.id} className={isLinked ? "bg-green-50" : "hover:bg-gray-50"}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{line.date}</td>
                                <td className="px-6 py-4 text-sm text-gray-900">{line.description}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600 font-medium">
                                    {line.amount < 0 ? formatCurrency(Math.abs(line.amount)) : '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 font-medium">
                                    {line.amount > 0 ? formatCurrency(line.amount) : '-'}
                                </td>
                                <td className="px-6 py-4 text-sm text-center">
                                    {isLinked ? (
                                        <div className="flex items-center justify-center text-green-700 gap-1 bg-green-100 px-2 py-1 rounded-full text-xs font-bold border border-green-200">
                                            <Check className="w-3 h-3" />
                                            {linkedTx?.category}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center">
                                            <button 
                                                onClick={() => setLinkingBankId(line.id)}
                                                className="text-blue-600 hover:text-blue-800 text-xs font-medium underline mb-1"
                                            >
                                                Lier opération
                                            </button>
                                            <button 
                                                onClick={() => openCreateModal(line)}
                                                className="text-gray-500 hover:text-gray-700 text-xs flex items-center bg-gray-100 px-2 py-0.5 rounded border"
                                            >
                                                <Plus className="w-3 h-3 mr-1" /> Créer
                                            </button>
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                    {isLinked ? (
                                        <button onClick={() => onUnlinkTransaction(line.id)} className="text-orange-500 hover:text-orange-700 mr-2" title="Délier">
                                            <Unlink className="w-4 h-4" />
                                        </button>
                                    ) : (
                                        <button onClick={() => deleteLine(line.id)} className="text-red-400 hover:text-red-600">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
      </div>

      {/* Linking Modal */}
      {linkingBankId && (
          <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setLinkingBankId(null)}></div>
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                            Lier la ligne bancaire à une opération existante
                        </h3>
                        <div className="max-h-96 overflow-y-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs text-gray-500">Date</th>
                                        <th className="px-4 py-2 text-left text-xs text-gray-500">Catégorie</th>
                                        <th className="px-4 py-2 text-left text-xs text-gray-500">Description</th>
                                        <th className="px-4 py-2 text-right text-xs text-gray-500">Montant</th>
                                        <th className="px-4 py-2 text-center text-xs text-gray-500">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {getLinkableTransactions(bankLines.find(l => l.id === linkingBankId)!).map(t => {
                                        const bankLine = bankLines.find(l => l.id === linkingBankId);
                                        const matchAmount = bankLine && Math.abs(bankLine.amount) === t.amount;
                                        
                                        return (
                                            <tr key={t.id} className={`hover:bg-blue-50 ${matchAmount ? 'bg-green-50' : ''}`}>
                                                <td className="px-4 py-2 text-sm text-gray-500">{t.date}</td>
                                                <td className="px-4 py-2 text-sm text-gray-500">{t.category}</td>
                                                <td className="px-4 py-2 text-sm text-gray-900">{t.description}</td>
                                                <td className="px-4 py-2 text-sm text-right font-medium">
                                                    {formatCurrency(t.amount)}
                                                    {t.type === 'DEPENSE' ? <span className="text-red-500 ml-1">(-)</span> : <span className="text-green-500 ml-1">(+)</span>}
                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                    <Button size="sm" onClick={() => {
                                                        onLinkTransaction(linkingBankId!, t.id);
                                                        setLinkingBankId(null);
                                                    }}>
                                                        Choisir
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {getLinkableTransactions(bankLines.find(l => l.id === linkingBankId)!).length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                                Aucune opération disponible correspondante.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <Button variant="secondary" onClick={() => setLinkingBankId(null)}>Fermer</Button>
                    </div>
                </div>
            </div>
          </div>
      )}

      {/* Creation Modal */}
      {creatingBankId && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setCreatingBankId(null)}></div>
                <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-xl relative z-10">
                    <h3 className="text-lg font-bold mb-4">Créer une opération depuis la banque</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Description</label>
                            <input 
                                type="text" className="w-full border p-2 rounded" 
                                value={createFormData.description} 
                                onChange={e => setCreateFormData({...createFormData, description: e.target.value})} 
                            />
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-gray-700">Catégorie</label>
                             <select 
                                className="w-full border p-2 rounded"
                                value={createFormData.category}
                                onChange={e => setCreateFormData({...createFormData, category: e.target.value, budgetLineId: ''})}
                             >
                                 <option value="">-- Sélectionner --</option>
                                 {availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
                             </select>
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-gray-700">Libellé Budgétaire</label>
                             <select 
                                className="w-full border p-2 rounded"
                                value={createFormData.budgetLineId}
                                onChange={e => setCreateFormData({...createFormData, budgetLineId: e.target.value})}
                                disabled={!createFormData.category}
                             >
                                 <option value="">-- Sélectionner --</option>
                                 {availableBudgetLines.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
                             </select>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-2">
                         <Button variant="ghost" onClick={() => setCreatingBankId(null)}>Annuler</Button>
                         <Button onClick={submitCreate} disabled={!createFormData.budgetLineId}>Créer & Lier</Button>
                    </div>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};