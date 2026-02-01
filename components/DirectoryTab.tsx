import React, { useState } from 'react';
import { Contact } from '../types';
import { generateId } from '../utils';
import { Button } from './ui/Button';
import { Trash2, Edit, Plus, X, Search, Phone, Mail, Building } from 'lucide-react';

interface DirectoryTabProps {
  contacts: Contact[];
  onUpdate: (contacts: Contact[]) => void;
}

export const DirectoryTab: React.FC<DirectoryTabProps> = ({ contacts, onUpdate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentContact, setCurrentContact] = useState<Partial<Contact>>({});

  const openModal = (contact?: Contact) => {
    if (contact) {
      setCurrentContact(contact);
    } else {
      setCurrentContact({
        id: generateId(),
        name: '',
        organization: '',
        email: '',
        phone: '',
        role: 'Bénévole',
        notes: ''
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentContact({});
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentContact.name || !currentContact.id) return;

    const exists = contacts.find(c => c.id === currentContact.id);
    let newContacts;
    if (exists) {
      newContacts = contacts.map(c => c.id === currentContact.id ? { ...c, ...currentContact } as Contact : c);
    } else {
      newContacts = [...contacts, currentContact as Contact];
    }
    onUpdate(newContacts);
    closeModal();
  };

  const deleteContact = (id: string) => {
    if (window.confirm('Supprimer ce contact ?')) {
      onUpdate(contacts.filter(c => c.id !== id));
    }
  };

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.organization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Rechercher un contact..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={() => openModal()}>
          <Plus className="w-4 h-4 mr-2" /> Nouveau Contact
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredContacts.map(contact => (
          <div key={contact.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 relative border-t-4 border-blue-500">
            <div className="absolute top-4 right-4 flex space-x-2">
              <button onClick={() => openModal(contact)} className="text-gray-400 hover:text-blue-600 transition-colors">
                <Edit className="w-4 h-4" />
              </button>
              <button onClick={() => deleteContact(contact.id)} className="text-gray-400 hover:text-red-600 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            
            <h3 className="text-lg font-bold text-gray-900 mb-1">{contact.name}</h3>
            <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mb-4">
              {contact.role}
            </span>

            <div className="space-y-2 text-sm text-gray-600">
              {contact.organization && (
                <div className="flex items-center">
                  <Building className="w-4 h-4 mr-2 opacity-70" />
                  {contact.organization}
                </div>
              )}
              {contact.email && (
                <div className="flex items-center">
                  <Mail className="w-4 h-4 mr-2 opacity-70" />
                  <a href={`mailto:${contact.email}`} className="hover:text-blue-600 hover:underline">{contact.email}</a>
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center">
                  <Phone className="w-4 h-4 mr-2 opacity-70" />
                  {contact.phone}
                </div>
              )}
            </div>
            
            {contact.notes && (
              <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500 italic">
                {contact.notes}
              </div>
            )}
          </div>
        ))}
        {filteredContacts.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-lg border border-dashed border-gray-300">
            Aucun contact trouvé.
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={closeModal}></div>
            <div className="relative bg-white rounded-lg max-w-lg w-full p-6 shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {currentContact.id ? 'Modifier Contact' : 'Nouveau Contact'}
                </h3>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-500">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nom complet</label>
                  <input
                    type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                    value={currentContact.name || ''}
                    onChange={e => setCurrentContact({...currentContact, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Organisation / Entreprise</label>
                  <input
                    type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                    value={currentContact.organization || ''}
                    onChange={e => setCurrentContact({...currentContact, organization: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Rôle (Tag)</label>
                    <input
                      type="text" placeholder="ex: Fournisseur"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                      value={currentContact.role || ''}
                      onChange={e => setCurrentContact({...currentContact, role: e.target.value})}
                    />
                  </div>
                   <div>
                    <label className="block text-sm font-medium text-gray-700">Téléphone</label>
                    <input
                      type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                      value={currentContact.phone || ''}
                      onChange={e => setCurrentContact({...currentContact, phone: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                    value={currentContact.email || ''}
                    onChange={e => setCurrentContact({...currentContact, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <textarea
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                    rows={3}
                    value={currentContact.notes || ''}
                    onChange={e => setCurrentContact({...currentContact, notes: e.target.value})}
                  />
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <Button type="button" variant="ghost" onClick={closeModal}>Annuler</Button>
                  <Button type="submit">Enregistrer</Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
