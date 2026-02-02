
import React, { useState } from 'react';
import { Volunteer } from '../types';
import { Button } from './ui/Button';
import { Trash2, UserPlus, Star, User } from 'lucide-react';
import { generateId } from '../utils';

interface VolunteersTabProps {
  volunteers: Volunteer[];
  onUpdate: (volunteers: Volunteer[]) => void;
}

export const VolunteersTab: React.FC<VolunteersTabProps> = ({ volunteers, onUpdate }) => {
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('');
  const [isOrganizer, setIsOrganizer] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;

    const newVol: Volunteer = {
      id: generateId(),
      name: newName,
      role: newRole || 'Bénévole',
      isOrganizer,
      createdAt: Date.now()
    };

    onUpdate([...volunteers, newVol]);
    setNewName('');
    setNewRole('');
    setIsOrganizer(false);
  };

  const deleteVolunteer = (id: string) => {
    if (window.confirm('Supprimer ce bénévole ?')) {
      onUpdate(volunteers.filter(v => v.id !== id));
    }
  };

  // Sort: Organizers first, then alphabetical
  const sortedVolunteers = [...volunteers].sort((a, b) => {
    if (a.isOrganizer === b.isOrganizer) return a.name.localeCompare(b.name);
    return a.isOrganizer ? -1 : 1;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow border-l-4 border-orange-500">
        <h3 className="font-bold text-lg mb-4 text-gray-800 flex items-center">
            <UserPlus className="w-5 h-5 mr-2 text-orange-600" /> Ajouter un bénévole
        </h3>
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
            <input 
                type="text" 
                value={newName} 
                onChange={e => setNewName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-orange-500 focus:border-orange-500" 
                placeholder="Ex: Jean Dupont"
                required
            />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Rôle / Poste</label>
            <input 
                type="text" 
                value={newRole}
                onChange={e => setNewRole(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-orange-500 focus:border-orange-500" 
                placeholder="Ex: Sécurité Kayak"
            />
          </div>
          <div className="flex items-center mb-3 bg-gray-50 px-3 py-2 rounded border border-gray-200">
            <input 
                id="volOrganizer" 
                type="checkbox" 
                checked={isOrganizer}
                onChange={e => setIsOrganizer(e.target.checked)}
                className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500"
            />
            <label htmlFor="volOrganizer" className="ml-2 text-sm font-medium text-gray-900 cursor-pointer select-none">Organisateur</label>
          </div>
          <Button type="submit" className="bg-gray-800 hover:bg-gray-900 w-full md:w-auto">
            Ajouter
          </Button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
            <h3 className="font-bold text-gray-700">Équipe Bénévoles</h3>
            <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2.5 py-0.5 rounded border border-orange-200">
                {volunteers.length} inscrits
            </span>
        </div>
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rôle</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {sortedVolunteers.length === 0 && (
                        <tr>
                            <td colSpan={4} className="px-6 py-8 text-center text-gray-500 italic">
                                Aucun bénévole enregistré pour cette édition.
                            </td>
                        </tr>
                    )}
                    {sortedVolunteers.map(vol => (
                        <tr key={vol.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                                {vol.isOrganizer ? (
                                    <span className="inline-flex items-center bg-purple-100 text-purple-800 text-xs font-semibold px-2.5 py-0.5 rounded border border-purple-200">
                                        <Star className="w-3 h-3 mr-1" fill="currentColor" /> Orga
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded border border-green-200">
                                        <User className="w-3 h-3 mr-1" /> Bénévole
                                    </span>
                                )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {vol.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {vol.role}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                <button onClick={() => deleteVolunteer(vol.id)} className="text-red-400 hover:text-red-600 transition-colors">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};
