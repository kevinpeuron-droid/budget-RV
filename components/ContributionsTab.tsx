import React, { useState, useMemo } from 'react';
import { Contribution } from '../types';
import { generateId, formatCurrency } from '../utils';
import { Button } from './ui/Button';
import { Trash2, Plus, Edit, X } from 'lucide-react';

interface ContributionsTabProps {
  contributions: Contribution[];
  onUpdate: (contributions: Contribution[]) => void;
}

export const ContributionsTab: React.FC<ContributionsTabProps> = ({ contributions, onUpdate }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Contribution>>({
    description: '',
    quantity: 1,
    unitValue: 0,
    beneficiary: ''
  });

  const startEdit = (c: Contribution) => {
    setEditingId(c.id);
    setFormData({
      description: c.description,
      quantity: c.quantity,
      unitValue: c.unitValue,
      beneficiary: c.beneficiary
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ description: '', quantity: 1, unitValue: 0, beneficiary: '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description) return;

    if (editingId) {
      // Update
      const updatedList = contributions.map(c => 
        c.id === editingId 
        ? {
            ...c,
            description: formData.description!,
            quantity: Number(formData.quantity),
            unitValue: Number(formData.unitValue),
            beneficiary: formData.beneficiary || ''
          }
        : c
      );
      onUpdate(updatedList);
      cancelEdit();
    } else {
      // Create
      const newContrib: Contribution = {
        id: generateId(),
        description: formData.description!,
        quantity: Number(formData.quantity),
        unitValue: Number(formData.unitValue),
        beneficiary: formData.beneficiary || ''
      };
      onUpdate([...contributions, newContrib]);
      setFormData({ description: '', quantity: 1, unitValue: 0, beneficiary: '' });
    }
  };

  const deleteItem = (id: string) => {
    onUpdate(contributions.filter(c => c.id !== id));
    if(editingId === id) cancelEdit();
  };

  const totalValuation = useMemo(() => {
    return contributions.reduce((acc, c) => acc + (c.quantity * c.unitValue), 0);
  }, [contributions]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="bg-white p-6 rounded-lg shadow lg:col-span-1 h-fit">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          {editingId ? <Edit className="w-5 h-5 text-indigo-600" /> : <Plus className="w-5 h-5" />}
          {editingId ? 'Modifier Contribution' : 'Ajouter Contribution en Nature'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Description (ex: Prêt de salle)"
            className="block w-full rounded-md border border-gray-300 p-2"
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500">Quantité</label>
              <input
                type="number" min="1"
                className="block w-full rounded-md border border-gray-300 p-2"
                value={formData.quantity}
                onChange={e => setFormData({ ...formData, quantity: parseFloat(e.target.value) })}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Valeur Unitaire (€)</label>
              <input
                type="number" min="0" step="0.01"
                className="block w-full rounded-md border border-gray-300 p-2"
                value={formData.unitValue}
                onChange={e => setFormData({ ...formData, unitValue: parseFloat(e.target.value) })}
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500">Total estimé</label>
            <div className="text-lg font-bold text-gray-700">
               {formatCurrency((formData.quantity || 0) * (formData.unitValue || 0))}
            </div>
          </div>
          <input
            type="text"
            placeholder="Bénéficiaire / Donateur"
            className="block w-full rounded-md border border-gray-300 p-2"
            value={formData.beneficiary}
            onChange={e => setFormData({ ...formData, beneficiary: e.target.value })}
          />
          
          <div className="flex gap-2">
             <Button type="submit" className="flex-1" variant={editingId ? 'secondary' : 'primary'}>
               {editingId ? 'Modifier' : 'Ajouter'}
             </Button>
             {editingId && (
              <Button type="button" variant="ghost" onClick={cancelEdit}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow lg:col-span-2 overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex justify-between">
            <h3 className="font-bold">Liste des Contributions</h3>
            <span className="font-bold text-blue-600">Valorisation: {formatCurrency(totalValuation)}</span>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qté</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">P.U.</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {contributions.map(c => (
              <tr key={c.id} className={editingId === c.id ? 'bg-blue-50' : ''}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {c.description}
                    <div className="text-xs text-gray-500">{c.beneficiary}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">{c.quantity}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">{formatCurrency(c.unitValue)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">{formatCurrency(c.quantity * c.unitValue)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => startEdit(c)} 
                      className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md shadow-sm border border-blue-200 transition-colors"
                      title="Modifier"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => deleteItem(c.id)} 
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
    </div>
  );
};