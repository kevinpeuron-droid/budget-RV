
export type TransactionType = 'RECETTE' | 'DEPENSE';
export type TransactionStatus = 'REALIZED' | 'PENDING'; // REALIZED = Payé/Encaissé, PENDING = Engagé/Sur devis

export interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string; // Gardé pour rétrocompatibilité et affichage rapide
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  eventId?: string;
  budgetLineId?: string; // Nouveau lien vers une ligne budgétaire spécifique
  // Volunteer specifics
  isBenevolat?: boolean;
  hours?: number;
  hourlyRate?: number;
}

export interface BankLine {
  id: string;
  date: string;
  description: string;
  amount: number; // Positif pour Crédit, Négatif pour Débit
  transactionId?: string; // ID de l'opération liée dans l'app
}

export interface Contribution {
  id: string;
  description: string;
  quantity: number;
  unitValue: number;
  beneficiary: string;
}

export interface Sponsor {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone?: string;
  amountPromised: number;
  amountPaid: number;
  datePaid?: string; // Date du versement réel
  dateSent?: string;
  dateReminder?: string;
  notes?: string;
  lastYearTotal?: number;
  status: 'En attente' | 'Accepté' | 'Refusé';
}

export interface Contact {
  id: string;
  name: string;
  organization?: string;
  email?: string;
  phone?: string;
  role: string;
  notes?: string;
}

export interface Volunteer {
  id: string;
  name: string;
  role: string;
  isOrganizer: boolean;
  createdAt: number;
}

export interface AppEvent {
  id: string;
  name: string;
  date: string;
  color: string;
}

export interface Archive {
  id: string;
  dateArchived: string;
  name: string;
  data: AppData;
}

export interface BudgetLine {
  id: string;
  section: 'RECETTE' | 'DEPENSE' | 'VALORISATION';
  category: string;
  label: string;
  amountNMinus1: number;
  amountN: number;
}

export interface AppData {
  realized: Transaction[];
  provisional: Transaction[];
  contributions: Contribution[];
  sponsors: Sponsor[];
  contacts: Contact[];
  volunteers: Volunteer[]; // Nouveau champ
  budget: BudgetLine[];
  budgetYear: number;
  categoriesRecette: string[];
  categoriesDepense: string[];
  bankLines: BankLine[];
  lastPointedDate?: string;
}

export interface AppState extends AppData {
  archives: Archive[];
  eventsList: AppEvent[]; // Liste globale des événements disponibles
}

export const DEFAULT_CATEGORIES_RECETTE = [
  'Participation des délégations', 'Aides publiques', 'Partenaires', 'Ventes'
];

export const DEFAULT_CATEGORIES_DEPENSE = [
  'Logistique', 'Animation', 'Sécurité', 'Communication'
];

export const DEFAULT_BUDGET_LINES: BudgetLine[] = [
  // RECETTES (Produits)
  { id: 'inc1', section: 'RECETTE', category: 'Participation des délégations', label: 'Inscriptions', amountNMinus1: 0, amountN: 0 },
  { id: 'inc2', section: 'RECETTE', category: 'Participation des délégations', label: 'Hébergement & Restauration', amountNMinus1: 0, amountN: 0 },
  
  { id: 'inc3', section: 'RECETTE', category: 'Aides publiques', label: 'Subvention Mairie', amountNMinus1: 0, amountN: 0 },
  { id: 'inc4', section: 'RECETTE', category: 'Aides publiques', label: 'Subvention Département/Région', amountNMinus1: 0, amountN: 0 },
  { id: 'inc5', section: 'RECETTE', category: 'Aides publiques', label: 'CNDS / ANS', amountNMinus1: 0, amountN: 0 },

  { id: 'inc6', section: 'RECETTE', category: 'Partenaires', label: 'Sponsors Privés', amountNMinus1: 0, amountN: 0 },
  { id: 'inc7', section: 'RECETTE', category: 'Partenaires', label: 'Mécénat', amountNMinus1: 0, amountN: 0 },

  { id: 'inc8', section: 'RECETTE', category: 'Ventes', label: 'Buvette', amountNMinus1: 0, amountN: 0 },
  { id: 'inc9', section: 'RECETTE', category: 'Ventes', label: 'Boutique / Merchandising', amountNMinus1: 0, amountN: 0 },

  // DEPENSES (Charges)
  { id: 'exp1', section: 'DEPENSE', category: 'Logistique', label: 'Location Matériel & Tentes', amountNMinus1: 0, amountN: 0 },
  { id: 'exp2', section: 'DEPENSE', category: 'Logistique', label: 'Fluides (Eau/Elec) & Sanitaires', amountNMinus1: 0, amountN: 0 },
  { id: 'exp3', section: 'DEPENSE', category: 'Logistique', label: 'Alimentation / Ravitaillement', amountNMinus1: 0, amountN: 0 },

  { id: 'exp4', section: 'DEPENSE', category: 'Animation', label: 'Sonorisation / Speaker', amountNMinus1: 0, amountN: 0 },
  { id: 'exp5', section: 'DEPENSE', category: 'Animation', label: 'Trophées & Récompenses', amountNMinus1: 0, amountN: 0 },

  { id: 'exp6', section: 'DEPENSE', category: 'Sécurité', label: 'Dispositif Secours (Croix Rouge...)', amountNMinus1: 0, amountN: 0 },
  { id: 'exp7', section: 'DEPENSE', category: 'Sécurité', label: 'Signalétique & Sécurité parcours', amountNMinus1: 0, amountN: 0 },

  { id: 'exp8', section: 'DEPENSE', category: 'Communication', label: 'Supports (Affiches, Flyers)', amountNMinus1: 0, amountN: 0 },
  { id: 'exp9', section: 'DEPENSE', category: 'Communication', label: 'Publicité & Presse', amountNMinus1: 0, amountN: 0 },

  // VALORISATION
  { id: 'val1', section: 'VALORISATION', category: 'Bénévolat', label: 'Heures Bénévoles', amountNMinus1: 0, amountN: 0 },
  { id: 'val2', section: 'VALORISATION', category: 'Matériel', label: 'Prêt de Véhicules/Matériel', amountNMinus1: 0, amountN: 0 },
  { id: 'val3', section: 'VALORISATION', category: 'Locaux', label: 'Mise à dispo Salles', amountNMinus1: 0, amountN: 0 },
];
