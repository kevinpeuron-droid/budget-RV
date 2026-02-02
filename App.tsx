import React, { useState, useEffect } from 'react';
import { 
  AppState, Transaction, Sponsor, Contribution, AppEvent, Archive, Contact, BudgetLine, BankLine, Volunteer,
  DEFAULT_CATEGORIES_RECETTE, DEFAULT_CATEGORIES_DEPENSE, DEFAULT_BUDGET_LINES 
} from './types';
import { db, ref, set, push, onValue, remove } from './firebase';

import { DashboardTab } from './components/DashboardTab';
import { TransactionsTab } from './components/TransactionsTab';
import { BudgetTab } from './components/BudgetTab';
import { SponsorsTab } from './components/SponsorsTab';
import { ContributionsTab } from './components/ContributionsTab';
import { ConfigTab } from './components/ConfigTab';
import { ArchivesTab } from './components/ArchivesTab';
import { DirectoryTab } from './components/DirectoryTab';
import { BankTab } from './components/BankTab';
import { VolunteersTab } from './components/VolunteersTab';
import { Button } from './components/ui/Button';
import { downloadCSV, convertToCSV, generateId } from './utils';
import { 
  LayoutDashboard, Wallet, PiggyBank, HandHeart, Users, Settings, 
  Archive as ArchiveIcon, Download, Upload, Printer, Contact as ContactIcon,
  Landmark, Plus, Tent, AlertTriangle, UserPlus, Edit2, Trash2,
  Cloud, CheckCircle, Loader2
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
  eventsList: [] 
};

type TabId = 'dashboard' | 'realized' | 'bank' | 'budget' | 'contributions' | 'sponsors' | 'volunteers' | 'directory' | 'config' | 'archives';

// Helper pour garantir que les listes Firebase sont des tableaux
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
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // 1. Charger la liste des événements et gérer l'initialisation
  useEffect(() => {
    const timeoutId = setTimeout(() => {
        if (loading) setConnectionError(true);
    }, 8000); // Augmenté à 8s pour laisser le temps

    const eventsRef = ref(db, 'events_meta');
    const unsubscribe = onValue(eventsRef, (snapshot) => {
      clearTimeout(timeoutId);
      setConnectionError(false);
      
      const val = snapshot.val() || {};
      setEventsList(val);
      const keys = Object.keys(val);
      
      if (keys.length === 0) {
          // AUCUN ÉVÉNEMENT : On en crée un par défaut pour que l'app soit utilisable tout de suite
          const defaultName = `Édition ${new Date().getFullYear()}`;
          const newRef = push(ref(db, 'events_meta'));
          const newId = newRef.key as string;
          
          // 1. Meta
          set(newRef, { id: newId, name: defaultName, createdAt: Date.now() });
          
          // 2. Data initiale
          set(ref(db, `events_data/${newId}`), {
            ...INITIAL_STATE,
            budgetYear: new Date().getFullYear()
          });

          setCurrentEventId(newId);
      } else if (!currentEventId) {
          // Sélectionner le dernier événement par défaut si aucun n'est sélectionné
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
  }, []); // Pas de dépendance currentEventId ici pour éviter boucle infinie

  // 2. Charger les données de l'événement actif
  useEffect(() => {
    if (!currentEventId) {
      setData(prev => ({ ...INITIAL_STATE, contacts: prev.contacts, archives: prev.archives }));
      return;
    }

    setLoading(true);
    const eventDataRef = ref(db, `events_data/${currentEventId}`);
    return onValue(eventDataRef, (snapshot) => {
      const val = snapshot.val();
      if (val) {
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
        // Cas rare : Meta existe mais pas Data (suppression manuelle ?)
        setData({ ...INITIAL_STATE });
      }
      setLoading(false);
    });
  }, [currentEventId]);

  // --- FONCTION DE SAUVEGARDE CENTRALISÉE ---
  const syncToFirebase = (key: keyof AppState, value: any) => {
    if (!currentEventId) {
        alert("Aucun événement sélectionné. Impossible de sauvegarder.");
        return;
    }
    
    // Optimistic UI update (mise à jour locale immédiate pour fluidité)
    setData(prev => ({ ...prev, [key]: value }));
    setSaveStatus('saving');

    // Envoi Firebase
    set(ref(db, `events_data/${currentEventId}/${key}`), value)
      .then(() => {
          setSaveStatus('saved');
          // Remettre à 'idle' après 2 secondes
          setTimeout(() => setSaveStatus('idle'), 2000);
      })
      .catch((err) => {
          console.error("Erreur sauvegarde Firebase:", err);
          setSaveStatus('error');
          alert("Erreur de sauvegarde ! Vérifiez votre connexion.");
      });
  };

  // Wrappers spécifiques par type de donnée
  const updateRealized = (transactions: Transaction[]) => syncToFirebase('realized', transactions);
  const updateBudget = (budgetLines: BudgetLine[]) => syncToFirebase('budget', budgetLines);
  const updateBudgetYear = (year: number) => syncToFirebase('budgetYear', year);
  const updateSponsors = (sponsors: Sponsor[]) => syncToFirebase('sponsors', sponsors);
  const updateContributions = (contributions: Contribution[]) => syncToFirebase('contributions', contributions);
  const updateContacts = (contacts: Contact[]) => syncToFirebase('contacts', contacts);
  const updateVolunteers = (volunteers: Volunteer[]) => syncToFirebase('volunteers', volunteers);
  const updateBankLines = (lines: BankLine[]) => syncToFirebase('bankLines', lines);
  const updateLastPointedDate = (date: string) => syncToFirebase('lastPointedDate', date);
  const updateEventsList = (events: AppEvent[]) => syncToFirebase('eventsList', events);

  const updateCategories = (type: 'RECETTE' | 'DEPENSE', cats: string[]) => {
    if (type === 'RECETTE') syncToFirebase('categoriesRecette', cats);
    else syncToFirebase('categoriesDepense', cats);
  };

  // --- GESTION DES ÉDITIONS ---

  // Création événement
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
      
      set(ref(db, `events_data/${newId}`), {
        ...INITIAL_STATE,
        budgetYear: new Date().getFullYear()
      });
      
      setCurrentEventId(newId);
    }
  };

  // Renommer l'événement courant
  const handleRenameEvent = () => {
    if (!currentEventId) return;
    const currentName = eventsList[currentEventId]?.name;
    const newName = prompt("Nouveau nom pour cette édition :", currentName);
    if (newName && newName !== currentName) {
      set(ref(db, `events_meta/${currentEventId}/name`), newName);
    }
  };

  // Supprimer l'événement courant
  const handleDeleteEvent = () => {
    if (!currentEventId) return;
    if (confirm("ATTENTION : Vous allez supprimer DÉFINITIVEMENT cette édition et toutes ses données (budget, sponsors, opérations...). Cette action est irréversible.\n\nÊtes-vous sûr ?")) {
      const idToDelete = currentEventId;
      // On désélectionne d'abord pour éviter des écritures fantômes
      setCurrentEventId(null); 
      
      remove(ref(db, `events_meta/${idToDelete}`));
      remove(ref(db, `events_data/${idToDelete}`));
      
      // La sélection automatique du prochain événement sera gérée par le useEffect
    }
  };

  // Importer un Backup JSON
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!currentEventId) {
        alert("Veuillez d'abord créer ou sélectionner une édition pour y importer les données.");
        e.target.value = '';
        return;
    }

    if (!confirm("ATTENTION : L'importation va ÉCRASER toutes les données de l'édition actuelle avec celles du fichier.\n\nContinuer ?")) {
        e.target.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const json = JSON.parse(event.target?.result as string) as any;
            
            // Validation sommaire
            if (!json.budget && !json.realized) {
               throw new Error("Format JSON invalide ou inconnu.");
            }

            // Restauration dans Firebase
            setSaveStatus('saving');
            set(ref(db, `events_data/${currentEventId}`), json)
                .then(() => {
                    setSaveStatus('saved');
                    alert("✅ Backup restauré avec succès !");
                })
                .catch(err => {
                    setSaveStatus('error');
                    alert("Erreur lors de la restauration : " + err);
                });

        } catch (err) {
            alert("Erreur de lecture du fichier JSON : " + err);
        }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset pour permettre de réimporter le même fichier
  };

  // Logique Banque <-> Transaction
  const handleLinkTransaction = (bankId: string, transactionId: string) => {
    if (!currentEventId) return;
    
    const bankLine = data.bankLines.find(l => l.id === bankId);
    
    // Mise à jour locale + sauvegarde
    const updatedBankLines = data.bankLines.map(line => 
      line.id === bankId ? { ...line, transactionId } : line
    );
    
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

  // Exports
  const handleExportCSV = () => {
    const headers = ['date', 'type', 'status', 'category', 'description', 'amount'];
    const csvContent = convertToCSV(data.realized, headers);
    const currentEvent = currentEventId ? eventsList[currentEventId] : undefined;
    const currentName = currentEvent?.name;
    downloadCSV(csvContent, `transactions_${currentName || 'export'}.csv`);
  };

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const currentEvent = currentEventId ? eventsList[currentEventId] : undefined;
    const currentName = currentEvent?.name;
    link.download = `backup_${currentName || 'data'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (connectionError) return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Erreur de connexion</h2>
          <p className="text-gray-600 mb-4">Impossible de joindre la base de données Firebase.</p>
          <Button className="mt-4" onClick={() => window.location.reload()}>Réessayer</Button>
      </div>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-gray-900 text-white flex-shrink-0 no-print">
        <div className="p-6">
          <h1 className="text-xl font-bold tracking-wider flex items-center gap-2">
            <Tent className="text-orange-500" /> RAND'EAU VIVE
          </h1>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest">Gestion Associative</p>
        </div>
        <nav className="mt-2 flex flex-col space-y-1 px-2">
          <NavBtn id="dashboard" icon={LayoutDashboard} label="Tableau de Bord" active={activeTab} set={setActiveTab} />
          <NavBtn id="budget" icon={PiggyBank} label="Bilan Financier" active={activeTab} set={setActiveTab} />
          <NavBtn id="realized" icon={Wallet} label="Saisie Opérations" active={activeTab} set={setActiveTab} />
          <NavBtn id="bank" icon={Landmark} label="Banque" active={activeTab} set={setActiveTab} />
          <NavBtn id="volunteers" icon={UserPlus} label="Bénévoles" active={activeTab} set={setActiveTab} />
          <NavBtn id="contributions" icon={HandHeart} label="Valorisation" active={activeTab} set={setActiveTab} />
          <NavBtn id="sponsors" icon={ContactIcon} label="Sponsors" active={activeTab} set={setActiveTab} />
          <NavBtn id="directory" icon={Users} label="Annuaire" active={activeTab} set={setActiveTab} />
          <NavBtn id="config" icon={Settings} label="Configuration" active={activeTab} set={setActiveTab} />
        </nav>
        
        <div className="p-4 mt-auto border-t border-gray-700 space-y-3">
          <div className="text-xs text-center text-gray-500 mb-1">Sauvegarde & Restauration</div>
          
          <button onClick={handleExportJSON} className="flex items-center justify-center w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm transition">
            <Download className="w-4 h-4 mr-2" /> Backup Local
          </button>

          <label className="flex items-center justify-center w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition cursor-pointer text-gray-200">
             <Upload className="w-4 h-4 mr-2" /> Restaurer Backup
             <input type="file" className="hidden" accept=".json" onChange={handleImportJSON} />
          </label>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-screen print:h-auto print:overflow-visible">
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
                        <option key={key} value={(val as any)?.name}>{(val as any)?.name}</option>
                    ))}
                </select>
             </div>
             
             {/* Boutons d'édition de l'événement courant */}
             {currentEventId && (
                <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={handleRenameEvent} title="Renommer l'édition" className="text-gray-500 hover:text-blue-600">
                        <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={handleDeleteEvent} title="Supprimer l'édition" className="text-gray-500 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
             )}

             <Button size="sm" onClick={handleCreateEvent} className="bg-orange-600 hover:bg-orange-700 text-white ml-2" title="Créer une nouvelle édition">
                <Plus className="w-4 h-4" />
             </Button>
          </div>

          <div className="flex items-center space-x-4">
            {/* Status Indicator */}
            <div className="hidden md:flex items-center text-sm">
                {saveStatus === 'saving' && (
                    <span className="text-blue-600 flex items-center"><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Enregistrement...</span>
                )}
                {saveStatus === 'saved' && (
                    <span className="text-green-600 flex items-center"><CheckCircle className="w-4 h-4 mr-1" /> Sauvegardé</span>
                )}
                {saveStatus === 'error' && (
                    <span className="text-red-600 flex items-center"><AlertTriangle className="w-4 h-4 mr-1" /> Erreur Sauvegarde</span>
                )}
                {saveStatus === 'idle' && (
                     <span className="text-gray-400 flex items-center" title="Tout est à jour"><Cloud className="w-4 h-4 mr-1" /> Prêt</span>
                )}
            </div>

            <Button variant="secondary" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-2" /> Imprimer
            </Button>
            <Button variant="ghost" onClick={handleExportCSV}>
              CSV
            </Button>
          </div>
        </header>

        <div className="p-6 print:p-0">
          {loading ? (
             <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 text-orange-600 animate-spin mx-auto mb-2" />
                    <p className="text-gray-500">Chargement des données...</p>
                </div>
             </div>
          ) : (
             <>
                <div className="hidden print-only mb-6 text-center">
                   <h1 className="text-4xl font-bold text-gray-900 mb-2">Budget Prévisionnel</h1>
                   <h2 className="text-2xl text-orange-600 font-bold uppercase">{eventsList[currentEventId || '']?.name}</h2>
                </div>

                {activeTab === 'dashboard' && <DashboardTab data={data} />}
                
                {activeTab === 'volunteers' && (
                   <VolunteersTab volunteers={data.volunteers} onUpdate={updateVolunteers} />
                )}

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

                {activeTab === 'archives' && (
                  <ArchivesTab 
                    archives={data.archives} 
                    onLoad={() => alert("Non disponible en mode Cloud")} 
                    onDelete={() => {}}
                    onArchiveCurrent={() => alert("Utilisez 'Créer une édition' pour archiver l'année en cours.")}
                  />
                )}
             </>
          )}
        </div>
        
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