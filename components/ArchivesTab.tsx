import React from 'react';
import { Archive } from '../types';
import { Button } from './ui/Button';
import { Trash2, Upload, Calendar } from 'lucide-react';

interface ArchivesTabProps {
  archives: Archive[];
  onLoad: (archive: Archive) => void;
  onDelete: (id: string) => void;
  onArchiveCurrent: () => void;
}

export const ArchivesTab: React.FC<ArchivesTabProps> = ({ archives, onLoad, onDelete, onArchiveCurrent }) => {
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-blue-900">Clôture d'exercice</h3>
          <p className="text-sm text-blue-700">Archiver l'état actuel et démarrer un nouvel exercice vide.</p>
        </div>
        <Button onClick={() => {
          if(window.confirm("Êtes-vous sûr de vouloir archiver l'état actuel ? Cela effacera les données courantes.")) {
            onArchiveCurrent();
          }
        }}>
          Archiver maintenant
        </Button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Historique des bilans</h3>
        </div>
        <ul className="divide-y divide-gray-200">
          {archives.length === 0 && (
            <li className="px-4 py-4 text-center text-gray-500">Aucune archive disponible.</li>
          )}
          {archives.map(archive => (
            <li key={archive.id} className="px-4 py-4 flex items-center justify-between hover:bg-gray-50">
              <div className="flex items-center">
                <Calendar className="text-gray-400 mr-3 w-5 h-5" />
                <div>
                  <p className="text-sm font-medium text-indigo-600 truncate">{archive.name}</p>
                  <p className="text-xs text-gray-500">Archivé le {new Date(archive.dateArchived).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button variant="secondary" size="sm" onClick={() => {
                  if(window.confirm("Charger cette archive remplacera les données actuelles. Continuer ?")) {
                    onLoad(archive);
                  }
                }}>
                  <Upload className="w-4 h-4 mr-1" /> Charger
                </Button>
                <button onClick={() => {
                   if(window.confirm("Supprimer définitivement cette archive ?")) {
                    onDelete(archive.id);
                   }
                }} className="text-red-600 hover:text-red-900 p-2">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};