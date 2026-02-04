import React, { useState } from 'react';
import { Sponsor } from '../types';
import { generateId, formatCurrency } from '../utils';
import { Button } from './ui/Button';
import { Trash2, Edit, Plus, X, Phone, Calendar, Mail, MessageSquare } from 'lucide-react';

interface SponsorsTabProps {
  sponsors: Sponsor[];
  onUpdate: (sponsors: Sponsor[]) => void;
  year: number; // Nouvelle prop
}

export const SponsorsTab: React.FC<SponsorsTabProps> = ({ sponsors, onUpdate, year }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSponsor, setCurrentSponsor] = useState<Partial<Sponsor>>({});

  const openModal = (sponsor?: Sponsor) => {
    if (sponsor) {
      setCurrentSponsor(sponsor);
    } else {
      setCurrentSponsor({
        id: generateId(),
        name: '',
        contact: '',
        email: '',
        phone: '',
        amountPromised: 0,
        amountPaid: 0,
        datePaid: '',
        dateSent: '',
        dateReminder: '',
        notes: '',
        status: 'En attente'
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentSponsor({});
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSponsor.name || !currentSponsor.id) return;

    const exists = sponsors.find(s => s.id === currentSponsor.id);
    let newSponsors;
    if (exists) {
      newSponsors = sponsors.map(s => s.id === currentSponsor.id ? { ...s, ...currentSponsor } as Sponsor : s);
    } else {
      newSponsors = [...sponsors, currentSponsor as Sponsor];
    }
    onUpdate(newSponsors);
    closeModal();
  };

  const deleteSponsor = (id: string) => {
    if (window.confirm('Supprimer ce sponsor ?')) {
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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Gestion des Partenaires & Sponsors</h2>
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dates Clés</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Montant {year}</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Versé</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sponsors.map((sponsor) => (
                <tr key={sponsor.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900">{sponsor.name}</div>
                    <div className="text-xs text-gray-500">{sponsor.contact}</div>
                    {sponsor.notes && (
                      <div className="mt-1 text-xs text-gray-400 italic max-w-xs truncate" title={sponsor.notes}>
                        <MessageSquare className="w-3 h-3 inline mr-1" />
                        {sponsor.notes}
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
                      {sponsor.dateSent && (
                        <div className="flex items-center" title="Dossier envoyé le">
                          <span className="w-16 inline-block text-gray-400">Envoyé:</span>
                          <span className="font-medium">{new Date(sponsor.dateSent).toLocaleDateString()}</span>
                        </div>
                      )}
                      {sponsor.dateReminder && (
                         <div className="flex items-center text-orange-600" title="Dernière relance le">
                           <span className="w-16 inline-block text-orange-400">Relance:</span>
                           <span className="font-medium">{new Date(sponsor.dateReminder).toLocaleDateString()}</span>
                         </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(sponsor.status)}`}>
                      {sponsor.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-900 font-medium">
                    {formatCurrency(sponsor.amountPromised)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-bold text-green-600">
                    <div>{formatCurrency(sponsor.amountPaid)}</div>
                    {sponsor.datePaid && (
                         <div className="text-xs text-gray-400 font-normal">le {new Date(sponsor.datePaid).toLocaleDateString()}</div>
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
              ))}
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
                    <h3 className="text-lg leading-6 font-bold text-gray-900" id="modal-title">
                      {currentSponsor.id ? 'Modifier le dossier' : 'Nouveau Dossier Sponsor'}
                    </h3>
                    <button type="button" onClick={closeModal} className="text-gray-400 hover:text-gray-500">
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Identité */}
                    <div className="bg-gray-50 p-3 rounded-md border border-gray-200 space-y-3">
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Identité</h4>
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
                          <label className="block text-sm font-medium text-gray-700">Contact (Prénom Nom)</label>
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
                            type="email" placeholder="contact@entreprise.fr"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                            value={currentSponsor.email || ''}
                            onChange={e => setCurrentSponsor({...currentSponsor, email: e.target.value})}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Téléphone</label>
                        <input
                          type="tel"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                          value={currentSponsor.phone || ''}
                          onChange={e => setCurrentSponsor({...currentSponsor, phone: e.target.value})}
                        />
                      </div>
                    </div>

                    {/* Dates & Statut */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Date dossier envoyé</label>
                        <input
                          type="date"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                          value={currentSponsor.dateSent || ''}
                          onChange={e => setCurrentSponsor({...currentSponsor, dateSent: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Date dernière relance</label>
                        <input
                          type="date"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                          value={currentSponsor.dateReminder || ''}
                          onChange={e => setCurrentSponsor({...currentSponsor, dateReminder: e.target.value})}
                        />
                      </div>
                    </div>

                    {/* Financier & Statut */}
                    <div className="bg-blue-50 p-3 rounded-md border border-blue-100 space-y-3">
                      <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wide">Suivi Financier</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Montant {year} (€)</label>
                          <input
                            type="number" step="0.01"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 font-bold"
                            value={currentSponsor.amountPromised || 0}
                            onChange={e => setCurrentSponsor({...currentSponsor, amountPromised: parseFloat(e.target.value)})}
                          />
                        </div>
                        <div>
                           <label className="block text-sm font-medium text-gray-700">Statut</label>
                            <select
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                              value={currentSponsor.status || 'En attente'}
                              onChange={e => setCurrentSponsor({...currentSponsor, status: e.target.value as any})}
                            >
                              <option value="En attente">En attente</option>
                              <option value="Accepté">Accepté</option>
                              <option value="Refusé">Refusé</option>
                            </select>
                        </div>
                      </div>
                      {/* Le montant versé reste caché sauf si nécessaire, ou on l'affiche pour permettre la validation des encaissements */}
                      <div className="grid grid-cols-2 gap-3">
                          <div>
                             <label className="block text-xs font-medium text-gray-500">Montant réellement encaissé</label>
                             <input
                                type="number" step="0.01"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 text-sm"
                                value={currentSponsor.amountPaid || 0}
                                onChange={e => setCurrentSponsor({...currentSponsor, amountPaid: parseFloat(e.target.value)})}
                              />
                          </div>
                          <div>
                             <label className="block text-xs font-medium text-gray-500">Date de versement</label>
                             <input
                                type="date"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 text-sm"
                                value={currentSponsor.datePaid || ''}
                                onChange={e => setCurrentSponsor({...currentSponsor, datePaid: e.target.value})}
                              />
                          </div>
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Annotations / Notes</label>
                      <textarea
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                        rows={3}
                        placeholder="Commentaires, conditions particulières..."
                        value={currentSponsor.notes || ''}
                        onChange={e => setCurrentSponsor({...currentSponsor, notes: e.target.value})}
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