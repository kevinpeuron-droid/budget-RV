import React, { useState, useEffect, useCallback } from 'react';
import { 
  AppState, Transaction, Sponsor, Contribution, AppEvent, Archive, 
  DEFAULT_CATEGORIES_RECETTE, DEFAULT_CATEGORIES_DEPENSE 
} from './types';
import { DashboardTab } from './components/DashboardTab';
import { TransactionsTab } from './components/TransactionsTab';
import { SponsorsTab } from './components/SponsorsTab';
import { ContributionsTab } from './components/ContributionsTab';
import { ConfigTab } from './components/ConfigTab';
import { ArchivesTab } from './components/ArchivesTab';
import { Button } from './components/ui/Button';
import { downloadCSV, convertToCSV, generateId } from './utils';
import { 
  LayoutDashboard, Wallet, PiggyBank, HandHeart, Users, Settings, 
  Archive as ArchiveIcon, Download, Upload, Printer 
} from 'lucide-react';

const STORAGE_KEY = 'gestion_asso_data';

const INITIAL_STATE: AppState = {
  realized: [],
  provisional: [],
  contributions: [],
  sponsors: [],
  categoriesRecette: DEFAULT_CATEGORIES_RECETTE,
  categoriesDepense: DEFAULT_CATEGORIES_DEPENSE,
  events: [],
  archives: []
};

type TabId = 'dashboard' | 'realized' | 'provisional' | 'contributions' | 'sponsors' | 'config' | 'archives';

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [data, setData] = useState<AppState>(INITIAL_STATE);
  const [isLoaded, setIsLoaded] = useState(false);

  // 1. & 2. Persistence Logic
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setData(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load data", e);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }, [data, isLoaded]);

  // Data helpers
  const updateRealized = (transactions: Transaction[]) => setData(prev => ({ ...prev, realized: transactions }));
  const updateProvisional = (transactions: Transaction[]) => setData(prev => ({ ...prev, provisional: transactions }));
  const updateSponsors = (sponsors: Sponsor[]) => setData(prev => ({ ...prev, sponsors }));
  const updateContributions = (contributions: Contribution[]) => setData(prev => ({ ...prev, contributions }));
  const updateEvents = (events: AppEvent[]) => setData(prev => ({ ...prev, events }));
  const updateCategories = (type: 'RECETTE' | 'DEPENSE', cats: string[]) => {
    if (type === 'RECETTE') setData(prev => ({ ...prev, categoriesRecette: cats }));
    else setData(prev => ({ ...prev, categoriesDepense: cats }));
  };

  // 9. Exports
  const handleExportJSON = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gestion_asso_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (window.confirm("Remplacer les données actuelles par le fichier importé ?")) {
          setData(json);
        }
      } catch (err) {
        alert("Fichier invalide");
      }
    };
    reader.readAsText(file);
  };

  const handleExportCSV = () => {
    // Determine what to export based on tab, or export all realized by default
    const headers = ['date', 'type', 'category', 'description', 'amount'];
    const csvContent = convertToCSV(data.realized, headers);
    downloadCSV(csvContent, 'transactions_realisees.csv');
  };

  // 8. Archives
  const archiveCurrentState = () => {
    const archiveName = prompt("Nom de l'archive (ex: Bilan 2023)", `Bilan ${new Date().getFullYear()}`);
    if(!archiveName) return;

    const newArchive: Archive = {
      id: generateId(),
      dateArchived: new Date().toISOString(),
      name: archiveName,
      data: { ...data } // copy current data
    };

    // Logique pour conserver les sponsors tout en réinitialisant les montants pour la nouvelle année
    const carriedOverSponsors = data.sponsors.map(s => ({
      ...s,
      lastYearTotal: s.amountPaid, // On sauvegarde ce qui a été payé cette année
      amountPaid: 0,               // On remet le compteur à zéro pour la nouvelle année
      amountPromised: 0,           // On remet la promesse à zéro
      status: 'Prospect' as const  // On remet le statut à 'Prospect' pour relancer le démarchage
    }));
    
    // Reset current operational data but keep configs, archives AND sponsors (with reset values)
    setData(prev => ({
      ...INITIAL_STATE,
      categoriesRecette: prev.categoriesRecette,
      categoriesDepense: prev.categoriesDepense,
      events: prev.events,
      sponsors: carriedOverSponsors,
      archives: [...prev.archives, newArchive]
    }));
  };

  const loadArchive = (archive: Archive) => {
    setData({
      ...archive.data,
      archives: data.archives // Keep archives list intact
    });
  };

  const deleteArchive = (id: string) => {
    setData(prev => ({
      ...prev,
      archives: prev.archives.filter(a => a.id !== id)
    }));
  };

  // Render logic
  if (!isLoaded) return <div className="p-10 text-center">Chargement...</div>;

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-800 text-white flex-shrink-0 no-print">
        <div className="p-6">
          <h1 className="text-xl font-bold tracking-wider">GESTION ASSO</h1>
          <p className="text-xs text-slate-400 mt-1">Version Pro</p>
        </div>
        <nav className="mt-2 flex flex-col space-y-1 px-2">
          <NavBtn id="dashboard" icon={LayoutDashboard} label="Tableau de Bord" active={activeTab} set={setActiveTab} />
          <NavBtn id="realized" icon={Wallet} label="Saisie Réalisé" active={activeTab} set={setActiveTab} />
          <NavBtn id="provisional" icon={PiggyBank} label="Budget Prévisionnel" active={activeTab} set={setActiveTab} />
          <NavBtn id="contributions" icon={HandHeart} label="Contributions Nature" active={activeTab} set={setActiveTab} />
          <NavBtn id="sponsors" icon={Users} label="Sponsors" active={activeTab} set={setActiveTab} />
          <NavBtn id="config" icon={Settings} label="Configuration" active={activeTab} set={setActiveTab} />
          <NavBtn id="archives" icon={ArchiveIcon} label="Archives" active={activeTab} set={setActiveTab} />
        </nav>
        
        <div className="p-4 mt-auto border-t border-slate-700 space-y-3">
          <label className="flex items-center justify-center w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded cursor-pointer text-sm transition">
            <Upload className="w-4 h-4 mr-2" /> Importer JSON
            <input type="file" className="hidden" accept=".json" onChange={handleImportJSON} />
          </label>
          <button onClick={handleExportJSON} className="flex items-center justify-center w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm transition">
            <Download className="w-4 h-4 mr-2" /> Sauvegarder JSON
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-gray-50 overflow-y-auto h-screen">
        <header className="bg-white shadow px-6 py-4 flex justify-between items-center no-print sticky top-0 z-10">
          <h2 className="text-2xl font-semibold text-gray-800">
            {activeTab === 'dashboard' && 'Bilan Financier'}
            {activeTab === 'realized' && 'Saisie des Opérations'}
            {activeTab === 'provisional' && 'Budget Prévisionnel'}
            {activeTab === 'contributions' && 'Bénévolat et Dons en nature'}
            {activeTab === 'sponsors' && 'Partenaires & Sponsors'}
            {activeTab === 'config' && 'Paramètres'}
            {activeTab === 'archives' && 'Historique'}
          </h2>
          <div className="flex space-x-2">
            <Button variant="secondary" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-2" /> Imprimer
            </Button>
            <Button variant="ghost" onClick={handleExportCSV}>
              CSV
            </Button>
          </div>
        </header>

        <div className="p-6 print-p-0">
          {activeTab === 'dashboard' && <DashboardTab data={data} />}
          
          {activeTab === 'realized' && (
            <TransactionsTab 
              transactions={data.realized} 
              categoriesRecette={data.categoriesRecette}
              categoriesDepense={data.categoriesDepense}
              events={data.events}
              isProvisional={false}
              onUpdate={updateRealized}
            />
          )}

          {activeTab === 'provisional' && (
            <TransactionsTab 
              transactions={data.provisional} 
              categoriesRecette={data.categoriesRecette}
              categoriesDepense={data.categoriesDepense}
              events={data.events}
              isProvisional={true}
              onUpdate={updateProvisional}
            />
          )}

          {activeTab === 'contributions' && (
            <ContributionsTab contributions={data.contributions} onUpdate={updateContributions} />
          )}

          {activeTab === 'sponsors' && (
             <SponsorsTab sponsors={data.sponsors} onUpdate={updateSponsors} />
          )}

          {activeTab === 'config' && (
            <ConfigTab data={data} onUpdateCategories={updateCategories} onUpdateEvents={updateEvents} />
          )}

          {activeTab === 'archives' && (
            <ArchivesTab 
              archives={data.archives} 
              onLoad={loadArchive} 
              onDelete={deleteArchive}
              onArchiveCurrent={archiveCurrentState}
            />
          )}
        </div>
        
        {/* Footer for Print */}
        <div className="print-only p-8 mt-10 border-t text-center text-sm text-gray-500">
          <p>Généré par Gestion Asso Pro le {new Date().toLocaleDateString()}</p>
        </div>
      </main>
    </div>
  );
}

const NavBtn = ({ id, icon: Icon, label, active, set }: { id: TabId, icon: any, label: string, active: TabId, set: (id: TabId) => void }) => (
  <button
    onClick={() => set(id)}
    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
      active === id ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'
    }`}
  >
    <Icon className="mr-3 flex-shrink-0 h-5 w-5" />
    {label}
  </button>
);

export default App;