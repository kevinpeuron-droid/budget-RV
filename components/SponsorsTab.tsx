import React, { useState } from 'react';
import { Sponsor, BudgetLine, Transaction, SponsorYearlyData } from '../types';
import { generateId, formatCurrency } from '../utils';
import { Button } from './ui/Button';
import { Trash2, Edit, Plus, X, Phone, Calendar, Mail, MessageSquare, ArrowRight, CheckCircle, Clock } from 'lucide-react';

interface SponsorsTabProps {
  sponsors: Sponsor[];
  onUpdate: (sponsors: Sponsor[]) => void;
  year: number;
  budget: BudgetLine[];
  transactions: Transaction[];
  onUpdateTransactions: (transactions: Transaction[]) => void;
}

export const SponsorsTab: React.FC<SponsorsTabProps> = ({ 
    sponsors, 
    onUpdate, 
    year, 
    budget, 
    transactions, 
    onUpdateTransactions 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // currentSponsor détient les infos globales (nom, contact)
  const [currentSponsor, setCurrentSponsor] = useState<Partial<Sponsor>>({});
  
  // currentYearData détient les infos spécifiques à l'année sélectionnée (montant, statut...)
  // On édite ceci dans la modale
  const [currentYearData, setCurrentYearData] = useState<Partial<SponsorYearlyData>>({});
  
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Helper pour récupérer les données d'une année spécifique de manière sécurisée
  const getSponsorDataForYear = (sponsor: Sponsor, targetYear: number): Partial<SponsorYearlyData> => {
      if (sponsor.yearlyData && sponsor.yearlyData[targetYear.toString()]) {
          return sponsor.yearlyData[targetYear.toString()];
      }
      // Fallback pour compatibilité si pas de yearlyData mais des données à la racine et qu'on est sur une année par défaut (ex 2025)
      // On évite de le faire systématiquement pour ne pas polluer les années futures
      if (!sponsor.yearlyData && (sponsor.amountPromised || sponsor.status)) {
           // On pourrait décider d'afficher les vieilles données SEULEMENT si l'année correspond à une "année pivot"
           // Pour simplifier : si pas de yearlyData, on considère que c'est vierge pour la nouvelle année demandée
           return {};
      }
      return {};
  };

  const openModal = (sponsor?: Sponsor) => {
    if (sponsor) {
      setCurrentSponsor(sponsor);
      
      const yData = getSponsorDataForYear(sponsor, year);
      setCurrentYearData({
          amountPromised: yData.amountPromised || 0,
          amountPaid: yData.amountPaid || 0,
          datePaid: yData.datePaid || '',
          dateSent: yData.dateSent || '',
          dateReminder: yData.dateReminder || '',
          status: yData.status || 'En attente',
          budgetLineId: yData.budgetLineId || '',
          transactionId: yData.transactionId || '',
          notes: yData.notes || ''
      });

      // Init categorie dropdown
      if (yData.budgetLineId) {
          const line = budget.find(b => b.id === yData.budgetLineId);
          if(line) setSelectedCategory(line.category);
      } else {
          setSelectedCategory('');
      }

    } else {
      // Nouveau Sponsor
      setCurrentSponsor({
        id: generateId(),
        name: '',
        contact: '',
        email: '',
        phone: '',
        notes: ''
      });
      setCurrentYearData({
          amountPromised: 0,
          amountPaid: 0,
          status: 'En attente'
      });
      setSelectedCategory('');
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentSponsor({});
    setCurrentYearData({});
    setSelectedCategory('');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSponsor.name || !currentSponsor.id) return;

    // 1. Préparer les données de l'année
    const yearDataToSave: SponsorYearlyData = {
        amountPromised: currentYearData.amountPromised || 0,
        amountPaid: currentYearData.amountPaid || 0,
        datePaid: currentYearData.datePaid,
        dateSent: currentYearData.dateSent,
        dateReminder: currentYearData.dateReminder,
        status: currentYearData.status || 'En attente',
        budgetLineId: currentYearData.budgetLineId,
        transactionId: currentYearData.transactionId,
        notes: currentYearData.notes
    };

    // 2. Gestion Transaction Financière (Auto-Link)
    let transactionToSave: Transaction | null = null;
    let transactionIdToDelete: string | null = null;

    const shouldHaveTransaction = 
        yearDataToSave.status === 'Accepté' && 
        yearDataToSave.datePaid && 
        yearDataToSave.amountPaid > 0 && 
        yearDataToSave.budgetLineId;

    if (shouldHaveTransaction) {
        const line = budget.find(l => l.id === yearDataToSave.budgetLineId);
        if (line) {
            const tId = yearDataToSave.transactionId || generateId();
            transactionToSave = {
                id: tId,
                date: yearDataToSave.datePaid!,
                amount: yearDataToSave.amountPaid,
                type: 'RECETTE',
                status: 'REALIZED',
                category: line.category,
                budgetLineId: line.id,
                description: `Partenaire : ${currentSponsor.name}`,
            };
            yearDataToSave.transactionId = tId;
        }
    } else if (yearDataToSave.transactionId) {
        transactionIdToDelete = yearDataToSave.transactionId;
        yearDataToSave.transactionId = undefined;
    }

    // Mise à jour transactions
    if (transactionToSave) {
        const otherTransactions = transactions.filter(t => t.id !== transactionToSave!.id);
        onUpdateTransactions([...otherTransactions, transactionToSave]);
    } else if (transactionIdToDelete) {
        onUpdateTransactions(transactions.filter(t => t.id !== transactionIdToDelete));
    }

    // 3. Construction de l'objet Sponsor final
    const exists = sponsors.find(s => s.id === currentSponsor.id);
    let finalSponsor: Sponsor;

    if (exists) {
        // Mise à jour de yearlyData
        const updatedYearlyData = { ...(exists.yearlyData || {}) };
        updatedYearlyData[year.toString()] = yearDataToSave;

        finalSponsor = {
            ...exists,
            ...currentSponsor, // Nom, contact, etc.
            yearlyData: updatedYearlyData
        } as Sponsor;
    } else {
        // Création
        finalSponsor = {
            ...currentSponsor,
            id: currentSponsor.id!,
            name: currentSponsor.name!,
            contact: currentSponsor.contact || '',
            email: currentSponsor.email || '',
            yearlyData: {
                [year.toString()]: yearDataToSave
            }
        } as Sponsor;
    }

    // Sauvegarde liste
    const newSponsorsList = exists 
        ? sponsors.map(s => s.id === finalSponsor.id ? finalSponsor : s)
        : [...sponsors, finalSponsor];
    
    onUpdate(newSponsorsList);
    closeModal();
  };

  const deleteSponsor = (id: string) => {
    if (window.confirm('Supprimer ce sponsor ?')) {
      const sp = sponsors.find(s => s.id === id);
      // Supprimer toutes les transactions liées de toutes les années ?
      // Pour l'instant on supprime juste celle de l'année en cours ou toutes si on supprime le sponsor complet
      if(sp?.yearlyData) {
          const tIds = Object.values(sp.yearlyData).map((y: SponsorYearlyData) => y.transactionId).filter(Boolean) as string[];
          if(tIds.length > 0) {
              onUpdateTransactions(transactions.filter(t => !tIds.includes(t.id)));
          }
      }
      onUpdate(sponsors.filter(s => s.id !== id));
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Accepté': return 'bg-green-100 text-green-800 border-green-200';
      case 'Refusé': return 'bg-red-100 text-red-800 border-red-200';
      case 'En attente': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Dropdowns
  const availableCategories = Array.from(new Set(
      budget.filter(l => l.section === 'RECETTE').map(l => l.category)
  ));
  
  const availableBudgetLines = budget.filter(l => 
      l.section === 'RECETTE' && l.category === selectedCategory
  );

  // Données N-1 pour la modale
  const previousYearData = currentSponsor.id 
     ? getSponsorDataForYear(sponsors.find(s => s.id === currentSponsor.id) || {} as Sponsor, year - 1) 
     : {};

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Partenaires & Sponsors {year}</h2>
        <Button onClick={() => openModal()}>
          <Plus className="w-4 h-4 mr-2" /> Nouveau Dossier
        </Button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Organisation / Contact</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Coordonnées</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Suivi {year}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Montant {year}</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Versé</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sponsors.map((sponsor) => {
                  const yData = getSponsorDataForYear(sponsor, year);
                  
                  return (
                    <tr key={sponsor.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">{sponsor.name}</div>
                        <div className="text-xs text-gray-500">{sponsor.contact}</div>
                        {yData.notes && (
                        <div className="mt-1 text-xs text-gray-400 italic max-w-xs truncate" title={yData.notes}>
                            <MessageSquare className="w-3 h-3 inline mr-1" />
                            {yData.notes}
                        </div>
                        )}
                        {yData.transactionId && (
                            <div className="mt-1 inline-flex items-center text-xs text-green-600 bg-green-50 px-1 rounded border border-green-100" title="Intégré au Bilan Financier">
                                <CheckCircle className="w-3 h-3 mr-1" /> Comptabilisé
                            </div>
                        )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                        {sponsor.email && (
                            <div className="flex items-center text-xs text-gray-600">
                            <Mail className="w-3 h-3 mr-1" /> <a href={`mailto:${sponsor.email}`} className="hover:underline">{sponsor.email}</a>
                            </div>
                        )}
                        {sponsor.phone && (
                            <div className="flex items-center text-xs text-gray-600">
                            <Phone className="w-3 h-3 mr-1" /> {sponsor.phone}
                            </div>
                        )}
                        </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-xs text-gray-500 space-y-1">
                        {yData.dateSent ? (
                            <div className="flex items-center" title="Dossier envoyé le">
                            <span className="w-16 inline-block text-gray-400">Envoyé:</span>
                            <span className="font-medium">{new Date(yData.dateSent).toLocaleDateString()}</span>
                            </div>
                        ) : <span className="text-gray-300 italic">Non envoyé</span>}
                        {yData.dateReminder && (
                            <div className="flex items-center text-orange-600" title="Dernière relance le">
                            <span className="w-16 inline-block text-orange-400">Relance:</span>
                            <span className="font-medium">{new Date(yData.dateReminder).toLocaleDateString()}</span>
                            </div>
                        )}
                        </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(yData.status || 'En attente')}`}>
                        {yData.status || 'En attente'}
                        </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-900 font-medium">
                        {yData.amountPromised ? formatCurrency(yData.amountPromised) : '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-bold text-green-600">
                        <div>{yData.amountPaid ? formatCurrency(yData.amountPaid) : '-'}</div>
                        {yData.datePaid && (
                            <div className="text-xs text-gray-400 font-normal">le {new Date(yData.datePaid).toLocaleDateString()}</div>
                        )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                        <button 
                            onClick={() => openModal(sponsor)} 
                            className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md shadow-sm border border-blue-200 transition-colors"
                            title="Modifier"
                        >
                            <Edit className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => deleteSponsor(sponsor.id)} 
                            className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-md shadow-sm border border-red-200 transition-colors"
                            title="Supprimer"
                        >
                            <Trash2 className="w-4 h-4" />
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={closeModal}></div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSave} className="flex flex-col h-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                        <h3 className="text-lg leading-6 font-bold text-gray-900" id="modal-title">
                        {currentSponsor.id ? 'Dossier Partenaire' : 'Nouveau Dossier'}
                        </h3>
                        <p className="text-sm text-gray-500">Exercice {year}</p>
                    </div>
                    <button type="button" onClick={closeModal} className="text-gray-400 hover:text-gray-500">
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {/* INFO N-1 */}
                    {(previousYearData.amountPaid || previousYearData.amountPromised) ? (
                        <div className="bg-gray-100 p-3 rounded border border-gray-300 flex items-center justify-between text-xs text-gray-600">
                             <div className="flex items-center gap-2">
                                 <Clock className="w-4 h-4" />
                                 <span className="font-semibold">Bilan {year - 1} :</span>
                             </div>
                             <div>
                                 <span className="mr-3">Promis: {formatCurrency(previousYearData.amountPromised || 0)}</span>
                                 <span className="font-bold text-green-700">Versé: {formatCurrency(previousYearData.amountPaid || 0)}</span>
                             </div>
                        </div>
                    ) : null}

                    {/* Identité (Global) */}
                    <div className="bg-gray-50 p-3 rounded-md border border-gray-200 space-y-3">
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Identité (Fiche Globale)</h4>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Nom de l'entreprise / Organisation</label>
                        <input
                          type="text" placeholder="Ex: Décathlon Guingamp"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                          value={currentSponsor.name || ''}
                          onChange={e => setCurrentSponsor({...currentSponsor, name: e.target.value})}
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Contact</label>
                          <input
                            type="text"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                            value={currentSponsor.contact || ''}
                            onChange={e => setCurrentSponsor({...currentSponsor, contact: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Email</label>
                          <input
                            type="email" 
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                            value={currentSponsor.email || ''}
                            onChange={e => setCurrentSponsor({...currentSponsor, email: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Dates & Statut (Annuel) */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Date dossier envoyé ({year})</label>
                        <input
                          type="date"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                          value={currentYearData.dateSent || ''}
                          onChange={e => setCurrentYearData({...currentYearData, dateSent: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Date dernière relance</label>
                        <input
                          type="date"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                          value={currentYearData.dateReminder || ''}
                          onChange={e => setCurrentYearData({...currentYearData, dateReminder: e.target.value})}
                        />
                      </div>
                    </div>

                    {/* Financier & Statut (Annuel) */}
                    <div className="bg-blue-50 p-3 rounded-md border border-blue-100 space-y-3">
                      <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wide">Suivi Financier {year}</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Montant Promis/Attendu</label>
                          <input
                            type="number" step="0.01"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 font-bold"
                            value={currentYearData.amountPromised || 0}
                            onChange={e => setCurrentYearData({...currentYearData, amountPromised: parseFloat(e.target.value)})}
                          />
                        </div>
                        <div>
                           <label className="block text-sm font-medium text-gray-700">Statut</label>
                            <select
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                              value={currentYearData.status || 'En attente'}
                              onChange={e => setCurrentYearData({...currentYearData, status: e.target.value as any})}
                            >
                              <option value="En attente">En attente</option>
                              <option value="Accepté">Accepté</option>
                              <option value="Refusé">Refusé</option>
                            </select>
                        </div>
                      </div>

                      {/* Section Encaissement */}
                      <div className="border-t border-blue-200 pt-3">
                          <label className="block text-sm font-bold text-gray-700 mb-2">Encaissement Réel</label>
                          <div className="grid grid-cols-2 gap-3">
                              <div>
                                 <label className="block text-xs font-medium text-gray-500">Montant Reçu (€)</label>
                                 <input
                                    type="number" step="0.01"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 text-sm bg-white"
                                    value={currentYearData.amountPaid || 0}
                                    onChange={e => setCurrentYearData({...currentYearData, amountPaid: parseFloat(e.target.value)})}
                                  />
                              </div>
                              <div>
                                 <label className="block text-xs font-medium text-gray-500">Date de versement</label>
                                 <input
                                    type="date"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 text-sm bg-white"
                                    value={currentYearData.datePaid || ''}
                                    onChange={e => setCurrentYearData({...currentYearData, datePaid: e.target.value})}
                                  />
                              </div>
                          </div>
                      </div>

                      {/* Liaison Bilan Financier */}
                      <div className="mt-2">
                          <div className="flex items-start">
                             <div className="flex items-center h-5">
                               <input
                                 id="addToBudget"
                                 type="checkbox"
                                 className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                                 checked={!!currentYearData.budgetLineId}
                                 onChange={(e) => {
                                     if (!e.target.checked) {
                                         setCurrentYearData({ ...currentYearData, budgetLineId: undefined });
                                         setSelectedCategory('');
                                     } else {
                                         setCurrentYearData({ ...currentYearData }); 
                                     }
                                 }}
                               />
                             </div>
                             <div className="ml-3 text-sm">
                               <label htmlFor="addToBudget" className="font-medium text-gray-700">Ajouter au bilan financier (Recette)</label>
                               <p className="text-gray-500 text-xs">Crée automatiquement une recette une fois le statut "Accepté" et la date renseignée.</p>
                             </div>
                          </div>

                          {(currentYearData.budgetLineId !== undefined || (document.getElementById('addToBudget') as HTMLInputElement)?.checked) && (
                              <div className="mt-3 grid grid-cols-1 gap-2 bg-white p-2 rounded border border-gray-200">
                                   <div>
                                      <label className="block text-xs font-medium text-gray-700">Catégorie</label>
                                      <select
                                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-1 text-sm"
                                          value={selectedCategory}
                                          onChange={e => {
                                              setSelectedCategory(e.target.value);
                                              setCurrentYearData({...currentYearData, budgetLineId: ''});
                                          }}
                                      >
                                          <option value="">-- Choisir Catégorie --</option>
                                          {availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                      </select>
                                   </div>
                                   {selectedCategory && (
                                       <div>
                                          <label className="block text-xs font-medium text-gray-700">Libellé Budgétaire</label>
                                          <select
                                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-1 text-sm"
                                              value={currentYearData.budgetLineId || ''}
                                              onChange={e => setCurrentYearData({...currentYearData, budgetLineId: e.target.value})}
                                          >
                                              <option value="">-- Choisir Libellé --</option>
                                              {availableBudgetLines.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
                                          </select>
                                       </div>
                                   )}
                              </div>
                          )}
                      </div>
                    </div>

                    {/* Notes Année */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Notes / Commentaires {year}</label>
                      <textarea
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                        rows={3}
                        value={currentYearData.notes || ''}
                        onChange={e => setCurrentYearData({...currentYearData, notes: e.target.value})}
                      />
                    </div>

                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <Button type="submit">Enregistrer</Button>
                  <Button type="button" variant="ghost" onClick={closeModal} className="mr-2">Annuler</Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};