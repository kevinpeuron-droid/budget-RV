import React, { useState } from 'react';
import { AppData, AppEvent } from '../types';
import { generateId } from '../utils';
import { Button } from './ui/Button';
import { Trash2, Plus, Edit, X } from 'lucide-react';

interface ConfigTabProps {
  data: AppData;
  onUpdateCategories: (type: 'RECETTE' | 'DEPENSE', cats: string[]) => void;
  onUpdateEvents: (events: AppEvent[]) => void;
}

export const ConfigTab: React.FC<ConfigTabProps> = ({ data, onUpdateCategories, onUpdateEvents }) => {
  const [newCatRecette, setNewCatRecette] = useState('');
  const [newCatDepense, setNewCatDepense] = useState('');
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [newEvent, setNewEvent] = useState<Partial<AppEvent>>({ name: '', date: '', color: '#3B82F6' });

  const addCategory = (type: 'RECETTE' | 'DEPENSE') => {
    const val = type === 'RECETTE' ? newCatRecette : newCatDepense;
    if (!val) return;
    const current = type === 'RECETTE' ? data.categoriesRecette : data.categoriesDepense;
    onUpdateCategories(type, [...current, val]);
    if (type === 'RECETTE') setNewCatRecette(''); else setNewCatDepense('');
  };

  const removeCategory = (type: 'RECETTE' | 'DEPENSE', name: string) => {
    if (window.confirm(`Supprimer la catégorie ${name} ?`)) {
      const current = type === 'RECETTE' ? data.categoriesRecette : data.categoriesDepense;
      onUpdateCategories(type, current.filter(c => c !== name));
    }
  };

  const handleEventSubmit = () => {
    if (!newEvent.name) return;

    if (editingEventId) {
      // Edit mode
      const updatedEvents = data.events.map(e => 
        e.id === editingEventId 
        ? { ...e, name: newEvent.name!, date: newEvent.date || '', color: newEvent.color || '#3B82F6' }
        : e
      );
      onUpdateEvents(updatedEvents);
      cancelEventEdit();
    } else {
      // Create mode
      const evt: AppEvent = {
        id: generateId(),
        name: newEvent.name,
        date: newEvent.date || '',
        color: newEvent.color || '#3B82F6'
      };
      onUpdateEvents([...data.events, evt]);
      setNewEvent({ name: '', date: '', color: '#3B82F6' });
    }
  };

  const startEventEdit = (evt: AppEvent) => {
    setEditingEventId(evt.id);
    setNewEvent({ name: evt.name, date: evt.date, color: evt.color });
  };

  const cancelEventEdit = () => {
    setEditingEventId(null);
    setNewEvent({ name: '', date: '', color: '#3B82F6' });
  };

  const removeEvent = (id: string) => {
    if (window.confirm('Supprimer cet événement ?')) {
      onUpdateEvents(data.events.filter(e => e.id !== id));
      if (editingEventId === id) cancelEventEdit();
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Categories Recette */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="font-bold text-lg mb-4 text-green-700">Catégories Recettes</h3>
        <div className="flex gap-2 mb-4">
          <input 
            className="flex-1 border border-gray-300 rounded px-2 py-1"
            value={newCatRecette} onChange={e => setNewCatRecette(e.target.value)} placeholder="Nouvelle catégorie"
          />
          <Button size="sm" onClick={() => addCategory('RECETTE')}><Plus className="w-4 h-4" /></Button>
        </div>
        <ul className="space-y-2">
          {data.categoriesRecette.map(cat => (
            <li key={cat} className="flex justify-between items-center bg-gray-50 p-2 rounded">
              <span>{cat}</span>
              <button onClick={() => removeCategory('RECETTE', cat)} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
            </li>
          ))}
        </ul>
      </div>

      {/* Categories Depense */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="font-bold text-lg mb-4 text-red-700">Catégories Dépenses</h3>
        <div className="flex gap-2 mb-4">
          <input 
            className="flex-1 border border-gray-300 rounded px-2 py-1"
            value={newCatDepense} onChange={e => setNewCatDepense(e.target.value)} placeholder="Nouvelle catégorie"
          />
          <Button size="sm" onClick={() => addCategory('DEPENSE')}><Plus className="w-4 h-4" /></Button>
        </div>
        <ul className="space-y-2">
          {data.categoriesDepense.map(cat => (
            <li key={cat} className="flex justify-between items-center bg-gray-50 p-2 rounded">
              <span>{cat}</span>
              <button onClick={() => removeCategory('DEPENSE', cat)} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
            </li>
          ))}
        </ul>
      </div>

      {/* Events */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="font-bold text-lg mb-4 text-blue-700">Événements</h3>
        <div className="space-y-2 mb-4 p-4 border rounded bg-gray-50">
          <input 
            className="w-full border border-gray-300 rounded px-2 py-1"
            value={newEvent.name} onChange={e => setNewEvent({...newEvent, name: e.target.value})} placeholder="Nom événement"
          />
          <div className="flex gap-2">
             <input type="date" className="flex-1 border rounded px-2 py-1" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} />
             <input type="color" className="w-10 h-8 p-0 border-0" value={newEvent.color} onChange={e => setNewEvent({...newEvent, color: e.target.value})} />
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="w-full" onClick={handleEventSubmit}>
              {editingEventId ? 'Modifier' : 'Ajouter'}
            </Button>
            {editingEventId && (
              <Button size="sm" variant="ghost" onClick={cancelEventEdit}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
        <ul className="space-y-2">
          {data.events.map(evt => (
            <li key={evt.id} className={`flex justify-between items-center border p-2 rounded ${editingEventId === evt.id ? 'bg-blue-50' : 'bg-white'}`}>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{backgroundColor: evt.color}}></span>
                <div>
                  <div className="font-medium">{evt.name}</div>
                  <div className="text-xs text-gray-500">{evt.date}</div>
                </div>
              </div>
              <div className="flex gap-1">
                 <button onClick={() => startEventEdit(evt)} className="text-indigo-600 p-1"><Edit className="w-4 h-4" /></button>
                 <button onClick={() => removeEvent(evt.id)} className="text-red-500 p-1"><Trash2 className="w-4 h-4" /></button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};