import React, { useState, useEffect } from 'react';
import { Transaction, AppData, TransactionType, TransactionStatus, BudgetLine, AppEvent } from '../types';
import { generateId, formatCurrency } from '../utils';
import { Button } from './ui/Button';
import { Trash2, PlusCircle, Edit, X, Clock, CheckCircle } from 'lucide-react';

interface TransactionsTabProps {
  transactions: Transaction[];
  budget: BudgetLine[]; // Nous utilisons le budget pour dériver les catégories
  events: AppEvent[];
  isProvisional: boolean;
  onUpdate: (updatedTransactions: Transaction[]) => void;
  year: number;
}

export const TransactionsTab: React.FC<TransactionsTabProps> = ({
  transactions,
  budget,
  events,
  isProvisional,
  onUpdate,
  year
}) => {
  const [type, setType] = useState<TransactionType>('RECETTE');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Fonction pour obtenir une date valide par défaut dans l'année sélectionnée
  const getDefaultDate = () => {
    const today = new Date();
    // Si l'année courante correspond à l'année sélectionnée, on prend aujourd'hui.
    // Sinon, on prend le 1er janvier de l'année sélectionnée.
    if (today.getFullYear() === year) {
        return today.toISOString().split('T')[0];
    }
    return `${year}-01-01`;
  };

  const [formData, setFormData] = useState<Partial<Transaction>>({
    date: getDefaultDate(),
    description: '',
    category: '', // Contiendra la catégorie principale
    budgetLineId: '', // Contiendra l'ID de la ligne précise (Libellé)
    amount: 0,
    status: 'REALIZED',
    isBenevolat: false,
    hours: 0,
    hourlyRate: 11.65 
  });

  // Mettre à jour la date par défaut si l'année change
  useEffect(() => {
     if (!editingId) {
         setFormData(prev => ({...prev, date: getDefaultDate()}));
     }
  }, [year]);

  // Dériver les catégories disponibles depuis le budget
  const availableCategories = Array.from(new Set(
    budget
      .filter(l => l.section === type)
      .map(l => l.category)
  ));

  // Dériver les libellés disponibles selon la catégorie choisie
  const availableBudgetLines = budget.filter(l => 
    l.section === type && l.category === formData.category
  );

  // Auto-calculate amount for Benevolat
  useEffect(() => {
    if (formData.isBenevolat && formData.hours && formData.hourlyRate) {
      setFormData(prev => ({
        ...prev,
        amount: (prev.hours || 0) * (prev.hourlyRate || 0)
      }));
    }
  }, [formData.hours, formData.hourlyRate, formData.isBenevolat]);

  // Handle category change 
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cat = e.target.value;
    const isBen = cat.toLowerCase().includes('bénévolat');
    setFormData(prev => ({
      ...prev,
      category: cat,
      budgetLineId: '', // Reset sub-selection
      isBenevolat: isBen,
      amount: isBen ? (prev.hours || 0) * (prev.hourlyRate || 0) : prev.amount,
      status: 'REALIZED'
    }));
  };

  const handleBudgetLineChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const lineId = e.target.value;
      const line = budget.find(l => l.id === lineId);
      if (line) {
          setFormData(prev => ({
              ...prev,
              budgetLineId: lineId,
              description: prev.description || line.label // Pré-remplir description si vide
          }));
      }
  };

  const startEdit = (t: Transaction) => {
    setType(t.type); // Switch to the correct tab context
    setEditingId(t.id);
    
    // Si la transaction n'a pas de budgetLineId (ancienne data), on essaie de la retrouver ou on laisse vide
    setFormData({
      date: t.date,
      description: t.description,
      category: t.category,
      budgetLineId: t.budgetLineId || '',
      amount: t.amount,
      status: t.status || 'REALIZED',
      eventId: t.eventId,
      isBenevolat: t.isBenevolat,
      hours: t.hours,
      hourlyRate: t.hourlyRate
    });
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({
      date: getDefaultDate(),
      description: '',
      category: '',
      budgetLineId: '',
      amount: 0,
      status: 'REALIZED',
      isBenevolat: false,
      hours: 0,
      hourlyRate: 11.65
    });
  };

  // Helper pour changer d'onglet sans tout effacer (sauf si on édite déjà une ligne spécifique)
  const switchType = (newType: TransactionType) => {
     setType(newType);
     if (editingId) {
         // Si on modifie une ligne existante, on annule l'édition pour éviter les conflits d'ID
         cancelEdit();
     } else {
         // Si on est en train de créer, on garde la description, date, montant...
         // Mais on reset la catégorie car elles sont différentes entre Recette et Dépense
         setFormData(prev => ({
             ...prev,
             category: '',
             budgetLineId: ''
         }));
     }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.category) return;

    if (editingId) {
      // Update existing
      const updatedTransactions = transactions.map(t => {
        if (t.id === editingId) {
          return {
            ...t,
            type: type,
            date: formData.date!,
            description: formData.description!,
            category: formData.category!,
            budgetLineId: formData.budgetLineId, // Save the link
            amount: Number(formData.amount),
            status: formData.status || 'REALIZED',
            eventId: formData.eventId,
            isBenevolat: formData.isBenevolat,
            hours: formData.hours ? Number(formData.hours) : undefined,
            hourlyRate: formData.hourlyRate ? Number(formData.hourlyRate) : undefined,
          };
        }
        return t;
      });
      onUpdate(updatedTransactions);
      cancelEdit();
    } else {
      // Create new
      const newTransaction: Transaction = {
        id: generateId(),
        type: type,
        date: formData.date!,
        description: formData.description!,
        category: formData.category!,
        budgetLineId: formData.budgetLineId, // Save the link
        amount: Number(formData.amount),
        status: formData.status || 'REALIZED',
        eventId: formData.eventId,
        isBenevolat: formData.isBenevolat,
        hours: formData.hours ? Number(formData.hours) : undefined,
        hourlyRate: formData.hourlyRate ? Number(formData.hourlyRate) : undefined,
      };

      onUpdate([...transactions, newTransaction]);
      // Reset form partially
      setFormData({
        ...formData,
        description: '',
        amount: 0,
        hours: 0,
        status: 'REALIZED'
      });
    }
  };

  const deleteTransaction = (id: string) => {
    if(window.confirm('Supprimer cette ligne ?')) {
      onUpdate(transactions.filter(t => t.id !== id));
      if (editingId === id) cancelEdit();
    }
  };

  // Filtrer les transactions par type ET par année
  const filteredTransactions = transactions.filter(t => 
    t.type === type && t.date.startsWith(year.toString())
  );
  
  const total = filteredTransactions.reduce((acc, t) => acc + t.amount, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Input Form */}
      <div className="bg-white p-6 rounded-lg shadow lg:col-span-1 h-fit sticky top-6">
        <div className="flex space-x-2 mb-6">
          <Button 
            className="flex-1"
            variant={type === 'RECETTE' ? 'primary' : 'secondary'}
            onClick={() => switchType('RECETTE')}
          >
            Recettes
          </Button>
          <Button 
            className="flex-1"
            variant={type === 'DEPENSE' ? 'danger' : 'secondary'}
            onClick={() => switchType('DEPENSE')}
          >
            Dépenses
          </Button>
        </div>

        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          {editingId ? <Edit className="w-5 h-5 text-indigo-600" /> : <PlusCircle className="w-5 h-5" />}
          {editingId 
            ? 'Modifier l\'opération' 
            : (isProvisional ? 'Ajouter Prévision' : 'Ajouter Opération')
          }
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div>
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <input
                type="date"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                required
                />
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700">Statut</label>
                <select
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as TransactionStatus })}
                    disabled={formData.isBenevolat}
                >
                    <option value="REALIZED">✅ Réalisé / Payé</option>
                    <option value="PENDING">⏳ À venir / Engagé</option>
                </select>
            </div>
          </div>

          {/* Category Selector (Level 1) */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Catégorie</label>
            <select
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
              value={formData.category}
              onChange={handleCategoryChange}
              required
            >
              <option value="">Sélectionner une catégorie...</option>
              {availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {availableCategories.length === 0 && (
                <p className="text-xs text-red-500 mt-1">Aucune catégorie trouvée dans le Bilan Financier.</p>
            )}
          </div>

          {/* Budget Line Selector (Level 2) - Only if category selected */}
          {formData.category && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Libellé (Bilan Financier)</label>
                <select
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                    value={formData.budgetLineId}
                    onChange={handleBudgetLineChange}
                    required
                >
                    <option value="">Sélectionner un libellé...</option>
                    {availableBudgetLines.map(line => (
                        <option key={line.id} value={line.id}>{line.label}</option>
                    ))}
                </select>
              </div>
          )}

          {formData.isBenevolat && (
            <div className="grid grid-cols-2 gap-2 bg-blue-50 p-2 rounded border border-blue-100">
              <div>
                <label className="block text-xs font-medium text-blue-700">Heures</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-1"
                  value={formData.hours}
                  onChange={e => setFormData({ ...formData, hours: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-blue-700">Taux Horaire</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-1"
                  value={formData.hourlyRate}
                  onChange={e => setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) })}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">Description / Détail</label>
            <input
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Événement (Optionnel)</label>
            <select
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
              value={formData.eventId || ''}
              onChange={e => setFormData({ ...formData, eventId: e.target.value })}
            >
              <option value="">Aucun</option>
              {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Montant (€)</label>
            <input
              type="number"
              step="0.01"
              className={`mt-1 block w-full rounded-md shadow-sm border p-2 ${formData.isBenevolat ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
              value={formData.amount}
              onChange={e => !formData.isBenevolat && setFormData({ ...formData, amount: parseFloat(e.target.value) })}
              readOnly={formData.isBenevolat}
              required
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1" variant={editingId ? 'secondary' : 'primary'}>
              {editingId ? 'Modifier' : 'Enregistrer (Fin de la saisie)'}
            </Button>
            {editingId && (
              <Button type="button" variant="ghost" onClick={cancelEdit}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow lg:col-span-2 overflow-hidden flex flex-col">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-700">Liste des {type === 'RECETTE' ? 'Recettes' : 'Dépenses'} {year}</h3>
          <span className={`text-xl font-bold ${type === 'RECETTE' ? 'text-green-600' : 'text-red-600'}`}>
            Total: {formatCurrency(total)}
          </span>
        </div>
        <div className="overflow-x-auto flex-1">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Catégorie</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                    Aucune transaction enregistrée pour {year}
                  </td>
                </tr>
              )}
              {filteredTransactions.map(t => {
                const evt = events.find(e => e.id === t.eventId);
                const isPending = t.status === 'PENDING';
                return (
                  <tr key={t.id} className={`hover:bg-gray-50 ${editingId === t.id ? 'bg-blue-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{t.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {isPending ? (
                             <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                                <Clock className="w-3 h-3 mr-1" /> À venir
                             </span>
                        ) : (
                             <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircle className="w-3 h-3 mr-1" /> Payé
                             </span>
                        )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {t.category}
                      </span>
                      {t.isBenevolat && <span className="ml-2 text-xs text-gray-400">({t.hours}h)</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {t.description}
                      {evt && (
                         <span className="ml-2 inline-block w-3 h-3 rounded-full" style={{ backgroundColor: evt.color || '#3B82F6' }} title={evt.name}></span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                      {formatCurrency(t.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => startEdit(t)} 
                          className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md shadow-sm border border-blue-200 transition-colors"
                          title="Modifier"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => deleteTransaction(t.id)} 
                          className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-md shadow-sm border border-red-200 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};