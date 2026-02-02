
import React, { useState, useEffect } from 'react';
import { 
  AppState, Transaction, Sponsor, Contribution, AppEvent, Archive, Contact, BudgetLine, BankLine, Volunteer,
  DEFAULT_CATEGORIES_RECETTE, DEFAULT_CATEGORIES_DEPENSE, DEFAULT_BUDGET_LINES 
} from './types';
import { db, ref, set, push, onValue } from './firebase';

import { DashboardTab } from './components/DashboardTab';
import { TransactionsTab } from './components/TransactionsTab';
import { BudgetTab } from './components/BudgetTab';
import { SponsorsTab } from './components/SponsorsTab';
import { ContributionsTab } from './components/ContributionsTab';
import { ConfigTab } from './components/ConfigTab';
import { ArchivesTab } from './components/ArchivesTab';
import { DirectoryTab } from './components/DirectoryTab';
import { BankTab } from './components/BankTab';
import { Button } from './components/ui/Button';
import { downloadCSV, convertToCSV, generateId } from './utils';
import { 
  LayoutDashboard, Wallet, PiggyBank, HandHeart, Users, Settings, 
  Archive as ArchiveIcon, Download, Upload, Printer, Contact as ContactIcon,
  Landmark, Plus, Tent, AlertTriangle
} from 'lucide-react';

const INITIAL_STATE: AppState = {
  realized: [],
  provisional: [],
  contributions: [],
  sponsors: [],
  contacts: [],
  volunteers: [],
  budget: DEFAULT_BUDGET_LINES,
  budgetYear: new Date().getFullYear(),
  categoriesRecette: DEFAULT_CATEGORIES_RECETTE,
  categoriesDepense: DEFAULT_CATEGORIES_DEPENSE,
  bankLines: [],
  lastPointedDate: '',
  archives: [],
  eventsList: [] // Sera peuplé par la liste des événements
};

type TabId = 'dashboard' | 'realized' | 'bank' | 'budget' | 'contributions' | 'sponsors' | 'directory' | 'config' | 'archives';

// Helper pour convertir les objets Firebase (qui ressemblent à des tableaux) en vrais tableaux
const toArray = <T,>(obj: any): T[] => {
  if (!obj) return [];
  if (Array.isArray(obj)) return obj;
  return Object.values(obj);
};

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [data, setData] = useState<AppState>(INITIAL_STATE);
  const [currentEventId, setCurrentEventId] = useState<string | null>(null);
  const [eventsList, setEventsList] = useState<Record<string, { name: string }>>({});
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(false);

  // 1. Charger la liste des événements au démarrage
  useEffect(() => {
    // Timeout de 5 secondes pour afficher une erreur si Firebase ne répond pas
    const timeoutId = setTimeout(() => {
        if (loading) {
            setConnectionError(true);
        }
    }, 5000);

    const eventsRef = ref(db, 'events_meta');
    const unsubscribe = onValue(eventsRef, (snapshot) => {
      clearTimeout(timeoutId); // Connexion réussie, on annule le timeout
      setConnectionError(false);
      
      const val = snapshot.val() || {};
      setEventsList(val);
      
      // Auto-select le premier si aucun sélectionné
      if (!currentEventId && Object.keys(val).length > 0) {
        // Idéalement le plus récent
        const keys = Object.keys(val);
        const lastKey = keys[keys.length - 1];
        setCurrentEventId(lastKey);
      }
      setLoading(false);
    }, (error) => {
        console.error("Firebase Error:", error);
        setConnectionError(true);
        setLoading(false);
    });

    return () => {
        clearTimeout(timeoutId);
        unsubscribe();
    };
  }, []);

  // 2. Charger les données de l'événement sélectionné
  useEffect(() => {
    if (!currentEventId) {
      // Si aucun événement, on reset les données opérationnelles
      setData(prev => ({ ...INITIAL_STATE, contacts: prev.contacts, archives: prev.archives }));
      return;
    }

    const eventDataRef = ref(db, `events_data/${currentEventId}`);
    return onValue(eventDataRef, (snapshot) => {
      const val = snapshot.val();
      if (val) {
        // Merge avec l'état initial pour garantir que tous les tableaux existent et sont bien des tableaux
        setData(prev => ({
          ...INITIAL_STATE,
          ...val,
          realized: toArray(val.realized),
          budget: val.budget ? toArray(val.budget) : DEFAULT_BUDGET_LINES,
          volunteers: toArray(val.volunteers),
          sponsors: toArray(val.sponsors),
          contacts: toArray(val.contacts),
          bankLines: toArray(val.bankLines),
          contributions: toArray(val.contributions),
          eventsList: toArray(val.eventsList),
          archives: toArray(val.archives),
          categoriesRecette: val.categoriesRecette || DEFAULT_CATEGORIES_RECETTE,
          categoriesDepense: val.categoriesDepense || DEFAULT_CATEGORIES_DEPENSE,
        }));
      } else {
        // Nouvel événement vide
        setData({ ...INITIAL_STATE });
      }
    });
  }, [currentEventId]);

  // --- Helpers de mise à jour Firebase ---
  
  const syncToFirebase = (key: keyof AppState, value: any) => {
    if (!currentEventId) return;
    set(ref(db, `events_data/${currentEventId}/${key}`), value);
  };

  const updateRealized = (transactions: Transaction[]) => syncToFirebase('realized', transactions);
  const updateBudget = (budgetLines: BudgetLine[]) => syncToFirebase('budget', budgetLines);
  const updateBudgetYear = (year: number) => syncToFirebase('budgetYear', year);
  const updateSponsors = (sponsors: Sponsor[]) => syncToFirebase('sponsors', sponsors);
  const updateContributions = (contributions: Contribution[]) => syncToFirebase('contributions', contributions);
  const updateContacts = (contacts: Contact[]) => syncToFirebase('contacts', contacts);
  // const updateVolunteers = (volunteers: Volunteer[]) => syncToFirebase('volunteers', volunteers); // Désactivé
  const updateBankLines = (lines: BankLine[]) => syncToFirebase('bankLines', lines);
  const updateLastPointedDate = (date: string) => syncToFirebase('lastPointedDate', date);
  const updateEventsList = (events: AppEvent[]) => syncToFirebase('eventsList', events);

  const updateCategories = (type: 'RECETTE' | 'DEPENSE', cats: string[]) => {
    if (type === 'RECETTE') syncToFirebase('categoriesRecette', cats);
    else syncToFirebase('categoriesDepense', cats);
  };

  // Création d'un nouvel événement
  const handleCreateEvent = () => {
    const name = prompt("Nom de la nouvelle édition (ex: Rand'eau Vive 2026) :");
    if (name) {
      const newRef = push(ref(db, 'events_meta'));
      const newId = newRef.key;
      set(newRef, { 
        id: newId, 
        name, 
        createdAt: Date.now() 
      });
      
      // Initialiser les données par défaut
      set(ref(db, `events_data/${newId}`), {
        ...INITIAL_STATE,
        budgetYear: new Date().getFullYear()
      });
      
      setCurrentEventId(newId);
    }
  };

  // Logic pour la Banque
  const handleLinkTransaction = (bankId: string, transactionId: string) => {
    if (!currentEventId) return;
    const updatedBankLines = data.bankLines.map(line => 
      line.id === bankId ? { ...line, transactionId } : line
    );
    const bankLine = data.bankLines.find(l => l.id === bankId);
    const updatedTransactions = data.realized.map(t => 
      t.id === transactionId 
      ? { ...t, status: 'REALIZED' as const, date: bankLine ? bankLine.date : t.date } 
      : t
    );
    updateBankLines(updatedBankLines);
    updateRealized(updatedTransactions);
  };

  const handleUnlinkTransaction = (bankId: string) => {
    const bankLine = data.bankLines.find(l => l.id === bankId);
    if (!bankLine || !bankLine.transactionId) return;
    const transactionId = bankLine.transactionId;
    const updatedBankLines = data.bankLines.map(line => 
      line.id === bankId ? { ...line, transactionId: undefined } : line
    );
    const updatedTransactions = data.realized.map(t => 
      t.id === transactionId ? { ...t, status: 'PENDING' as const } : t
    );
    updateBankLines(updatedBankLines);
    updateRealized(updatedTransactions);
  };

  const handleCreateFromBank = (bankLineId: string, category: string, budgetLineId: string, description?: string) => {
      const bankLine = data.bankLines.find(l => l.id === bankLineId);
      if(!bankLine) return;
      const newTransaction: Transaction = {
          id: generateId(),
          date: bankLine.date,
          description: description || bankLine.description,
          amount: Math.abs(bankLine.amount),
          type: bankLine.amount >= 0 ? 'RECETTE' : 'DEPENSE',
          status: 'REALIZED',
          category: category,
          budgetLineId: budgetLineId,
          isBenevolat: false
      };
      const updatedTransactions = [...data.realized, newTransaction];
      const updatedBankLines = data.bankLines.map(l => l.id === bankLineId ? { ...l, transactionId: newTransaction.id } : l);
      updateRealized(updatedTransactions);
      updateBankLines(updatedBankLines);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['date', 'type', 'status', 'category', 'description', 'amount'];
    const csvContent = convertToCSV(data.realized, headers);
    const currentEvent = eventsList[currentEventId || ''];
    const currentName = (currentEvent as { name?: string } | undefined)?.name;
    downloadCSV(csvContent, `transactions_${currentName || 'export'}.csv`);
  };

  // Les fonctions JSON sont moins pertinentes avec Firebase mais on les garde pour backup local
  const handleExportJSON = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const currentEvent = eventsList[currentEventId || ''];
    const currentName = (currentEvent as { name?: string } | undefined)?.name;
    link.download = `backup_${currentName || 'data'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Affichage Erreur ou Chargement
  if (connectionError) return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Erreur de connexion</h2>
          <p className="text-gray-600 mb-4">Impossible de joindre la base de données Firebase.</p>
          <p className="text-sm text-gray-500 bg-gray-100 p-2 rounded">Vérifiez votre connexion internet ou que l'URL Database (Europe) est correcte.</p>
          <Button className="mt-4" onClick={() => window.location.reload()}>Réessayer</Button>
      </div>
  );

  if (loading) return <div className="min-h-screen flex items-center justify-center text-orange-600 font-bold animate-pulse">Chargement Rand'eau Vive...</div>;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-gray-900 text-white flex-shrink-0 no-print">
        <div className="p-6">
          <h1 className="text-xl font-bold tracking-wider flex items-center gap-2">
            <Tent className="text-orange-500" /> RAND'EAU VIVE
          </h1>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest">Gestion Associative</p>
        </div>
        <nav className="mt-2 flex flex-col space-y-1 px-2">
          <NavBtn id="dashboard" icon={LayoutDashboard} label="Tableau de Bord" active={activeTab} set={setActiveTab} />
          {/* Onglet Bénévoles supprimé */}
          <NavBtn id="budget" icon={PiggyBank} label="Bilan Financier" active={activeTab} set={setActiveTab} />
          <NavBtn id="realized" icon={Wallet} label="Saisie Opérations" active={activeTab} set={setActiveTab} />
          <NavBtn id="bank" icon={Landmark} label="Banque" active={activeTab} set={setActiveTab} />
          <NavBtn id="contributions" icon={HandHeart} label="Valorisation" active={activeTab} set={setActiveTab} />
          <NavBtn id="sponsors" icon={ContactIcon} label="Sponsors" active={activeTab} set={setActiveTab} />
          <NavBtn id="directory" icon={Users} label="Annuaire" active={activeTab} set={setActiveTab} />
          <NavBtn id="config" icon={Settings} label="Configuration" active={activeTab} set={setActiveTab} />
        </nav>
        
        <div className="p-4 mt-auto border-t border-gray-700 space-y-3">
          <div className="text-xs text-center text-gray-500 mb-2">Sauvegarde Cloud Active</div>
          <button onClick={handleExportJSON} className="flex items-center justify-center w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm transition">
            <Download className="w-4 h-4 mr-2" /> Backup Local
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-screen print:h-auto print:overflow-visible">
        {/* Header with Event Selector */}
        <header className="bg-white shadow px-6 py-4 flex justify-between items-center no-print sticky top-0 z-10">
          <div className="flex items-center gap-4">
             <div className="relative">
                <select 
                  className="bg-orange-50 border border-orange-200 text-gray-900 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 block w-64 p-2.5 font-bold"
                  value={currentEventId || ''}
                  onChange={(e) => setCurrentEventId(e.target.value)}
                >
                    <option value="" disabled>-- Sélectionner Édition --</option>
                    {Object.entries(eventsList).map(([key, val]) => (
                        <option key={key} value={key}>{val.name}</option>
                    ))}
                </select>
             </div>
             <Button size="sm" onClick={handleCreateEvent} className="bg-orange-600 hover:bg-orange-700 text-white">
                <Plus className="w-4 h-4" />
             </Button>
          </div>

          <div className="flex space-x-2">
            <Button variant="secondary" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-2" /> Imprimer
            </Button>
            <Button variant="ghost" onClick={handleExportCSV}>
              CSV
            </Button>
          </div>
        </header>

        <div className="p-6 print:p-0">
          {/* Titre Impression */}
          <div className="hidden print-only mb-6 text-center">
             <h1 className="text-4xl font-bold text-gray-900 mb-2">Budget Prévisionnel</h1>
             <h2 className="text-2xl text-orange-600 font-bold uppercase">{(eventsList[currentEventId || ''] as any)?.name}</h2>
          </div>

          {activeTab === 'dashboard' && <DashboardTab data={data} />}
          
          {/* Onglet Bénévoles Rendu supprimé */}

          {activeTab === 'budget' && (
            <BudgetTab 
              budgetLines={data.budget} 
              transactions={data.realized}
              year={data.budgetYear}
              archives={data.archives}
              onUpdate={updateBudget}
              onYearChange={updateBudgetYear}
            />
          )}

          {activeTab === 'realized' && (
            <TransactionsTab 
              transactions={data.realized} 
              budget={data.budget}
              events={data.eventsList || []} 
              isProvisional={false}
              onUpdate={updateRealized}
            />
          )}

          {activeTab === 'bank' && (
            <BankTab
              bankLines={data.bankLines || []}
              transactions={data.realized}
              budget={data.budget}
              lastPointedDate={data.lastPointedDate}
              onUpdateBankLines={updateBankLines}
              onUpdateLastPointedDate={updateLastPointedDate}
              onLinkTransaction={handleLinkTransaction}
              onUnlinkTransaction={handleUnlinkTransaction}
              onCreateFromBank={handleCreateFromBank}
            />
          )}

          {activeTab === 'contributions' && (
            <ContributionsTab contributions={data.contributions} onUpdate={updateContributions} />
          )}

          {activeTab === 'sponsors' && (
             <SponsorsTab sponsors={data.sponsors} onUpdate={updateSponsors} />
          )}

          {activeTab === 'directory' && (
             <DirectoryTab contacts={data.contacts || []} onUpdate={updateContacts} />
          )}

          {activeTab === 'config' && (
            <ConfigTab 
              data={data} 
              onUpdateCategories={updateCategories} 
              onUpdateEvents={updateEventsList} 
            />
          )}

          {/* Archives tab kept for viewing old formats if needed, but Firebase handles history via events */}
          {activeTab === 'archives' && (
            <ArchivesTab 
              archives={data.archives} 
              onLoad={() => alert("Non disponible en mode Cloud")} 
              onDelete={() => {}}
              onArchiveCurrent={() => alert("Utilisez 'Créer une édition' pour archiver l'année en cours.")}
            />
          )}
        </div>
        
        {/* Footer for Print */}
        <div className="print-only p-8 mt-10 border-t text-center text-sm text-gray-500">
          <p>Généré par Rand'eau Vive App le {new Date().toLocaleDateString()}</p>
        </div>
      </main>
    </div>
  );
}

const NavBtn = ({ id, icon: Icon, label, active, set }: { id: TabId, icon: any, label: string, active: TabId, set: (id: TabId) => void }) => (
  <button
    onClick={() => set(id)}
    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
      active === id ? 'bg-orange-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
    }`}
  >
    <Icon className={`mr-3 flex-shrink-0 h-5 w-5 ${active === id ? 'text-white' : 'text-gray-500'}`} />
    {label}
  </button>
);

export default App;
