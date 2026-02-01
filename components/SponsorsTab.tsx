import React, { useState } from 'react';
import { Sponsor } from '../types';
import { generateId, formatCurrency } from '../utils';
import { Button } from './ui/Button';
import { Trash2, Edit, Plus, X } from 'lucide-react';

interface SponsorsTabProps {
  sponsors: Sponsor[];
  onUpdate: (sponsors: Sponsor[]) => void;
}

export const SponsorsTab: React.FC<SponsorsTabProps> = ({ sponsors, onUpdate }) => {
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
        amountPromised: 0,
        amountPaid: 0,
        status: 'Prospect'
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
      case 'Confirmé': return 'bg-green-100 text-green-800';
      case 'Payé': return 'bg-blue-100 text-blue-800';
      case 'Perdu': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Gestion des Partenaires</h2>
        <Button onClick={() => openModal()}>
          <Plus className="w-4 h-4 mr-2" /> Nouveau Sponsor
        </Button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Versé N-1</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Promesse</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Versé</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sponsors.map((sponsor) => (
              <tr key={sponsor.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{sponsor.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div>{sponsor.contact}</div>
                  <div className="text-xs text-gray-400">{sponsor.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(sponsor.status)}`}>
                    {sponsor.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-400 italic">
                  {sponsor.lastYearTotal !== undefined ? formatCurrency(sponsor.lastYearTotal) : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">{formatCurrency(sponsor.amountPromised)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 font-medium">{formatCurrency(sponsor.amountPaid)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => openModal(sponsor)} 
                      className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md shadow-sm border border-blue-200 transition-colors"
                      title="Modifier"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => deleteSponsor(sponsor.id)} 
                      className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-md shadow-sm border border-red-200 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={closeModal}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSave}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      {currentSponsor.id ? 'Modifier Sponsor' : 'Ajouter Sponsor'}
                    </h3>
                    <button type="button" onClick={closeModal} className="text-gray-400 hover:text-gray-500">
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <input
                      type="text" placeholder="Nom de l'entreprise"
                      className="block w-full rounded-md border-gray-300 shadow-sm border p-2"
                      value={currentSponsor.name || ''}
                      onChange={e => setCurrentSponsor({...currentSponsor, name: e.target.value})}
                      required
                    />
                    <input
                      type="text" placeholder="Contact principal"
                      className="block w-full rounded-md border-gray-300 shadow-sm border p-2"
                      value={currentSponsor.contact || ''}
                      onChange={e => setCurrentSponsor({...currentSponsor, contact: e.target.value})}
                    />
                    <input
                      type="email" placeholder="Email"
                      className="block w-full rounded-md border-gray-300 shadow-sm border p-2"
                      value={currentSponsor.email || ''}
                      onChange={e => setCurrentSponsor({...currentSponsor, email: e.target.value})}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-gray-500">Promesse</label>
                        <input
                          type="number"
                          className="block w-full rounded-md border-gray-300 shadow-sm border p-2"
                          value={currentSponsor.amountPromised || 0}
                          onChange={e => setCurrentSponsor({...currentSponsor, amountPromised: parseFloat(e.target.value)})}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Versé</label>
                        <input
                          type="number"
                          className="block w-full rounded-md border-gray-300 shadow-sm border p-2"
                          value={currentSponsor.amountPaid || 0}
                          onChange={e => setCurrentSponsor({...currentSponsor, amountPaid: parseFloat(e.target.value)})}
                        />
                      </div>
                    </div>
                    <select
                      className="block w-full rounded-md border-gray-300 shadow-sm border p-2"
                      value={currentSponsor.status || 'Prospect'}
                      onChange={e => setCurrentSponsor({...currentSponsor, status: e.target.value as any})}
                    >
                      <option value="Prospect">Prospect</option>
                      <option value="Confirmé">Confirmé</option>
                      <option value="Payé">Payé</option>
                      <option value="Perdu">Perdu</option>
                    </select>
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