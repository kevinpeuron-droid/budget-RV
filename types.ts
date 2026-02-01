
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
  budget: BudgetLine[];
  budgetYear: number;
  categoriesRecette: string[];
  categoriesDepense: string[];
  events: AppEvent[];
}

export interface AppState extends AppData {
  archives: Archive[];
}

export const DEFAULT_CATEGORIES_RECETTE = [
  'Adhésions', 'Subventions', 'Vente Produits', 'Dons', 'Bénévolat', 'Sponsoring'
];

export const DEFAULT_CATEGORIES_DEPENSE = [
  'Achats', 'Location', 'Assurance', 'Frais Bancaires', 'Communication', 'Bénévolat'
];

export const DEFAULT_BUDGET_LINES: BudgetLine[] = [
  // RECETTES
  { id: 'r1', section: 'RECETTE', category: 'Participation des délégations', label: 'Inscriptions', amountNMinus1: 0, amountN: 0 },
  { id: 'r2', section: 'RECETTE', category: 'Participation des délégations', label: 'Hébergement', amountNMinus1: 0, amountN: 0 },
  { id: 'r3', section: 'RECETTE', category: 'Participation des délégations', label: 'Restauration', amountNMinus1: 0, amountN: 0 },
  { id: 'r4', section: 'RECETTE', category: 'Aides publiques', label: 'État', amountNMinus1: 0, amountN: 0 },
  { id: 'r5', section: 'RECETTE', category: 'Aides publiques', label: 'Région', amountNMinus1: 0, amountN: 0 },
  { id: 'r6', section: 'RECETTE', category: 'Aides publiques', label: 'Département', amountNMinus1: 0, amountN: 0 },
  { id: 'r7', section: 'RECETTE', category: 'Aides publiques', label: 'Ville', amountNMinus1: 0, amountN: 0 },
  { id: 'r8', section: 'RECETTE', category: 'Partenariats', label: 'Sponsors privés', amountNMinus1: 0, amountN: 0 },
  { id: 'r9', section: 'RECETTE', category: 'Partenariats', label: 'Mécénat', amountNMinus1: 0, amountN: 0 },
  { id: 'r10', section: 'RECETTE', category: 'Ventes', label: 'Buvette', amountNMinus1: 0, amountN: 0 },
  { id: 'r11', section: 'RECETTE', category: 'Ventes', label: 'Boutique', amountNMinus1: 0, amountN: 0 },

  // DEPENSES
  { id: 'd1', section: 'DEPENSE', category: 'Logistique', label: 'Location matériel', amountNMinus1: 0, amountN: 0 },
  { id: 'd2', section: 'DEPENSE', category: 'Logistique', label: 'Tentes', amountNMinus1: 0, amountN: 0 },
  { id: 'd3', section: 'DEPENSE', category: 'Logistique', label: 'Sanitaires', amountNMinus1: 0, amountN: 0 },
  { id: 'd4', section: 'DEPENSE', category: 'Animation & Sport', label: 'Trophées', amountNMinus1: 0, amountN: 0 },
  { id: 'd5', section: 'DEPENSE', category: 'Animation & Sport', label: 'Dossards', amountNMinus1: 0, amountN: 0 },
  { id: 'd6', section: 'DEPENSE', category: 'Animation & Sport', label: 'Sono', amountNMinus1: 0, amountN: 0 },
  { id: 'd7', section: 'DEPENSE', category: 'Sécurité', label: 'Secouristes', amountNMinus1: 0, amountN: 0 },
  { id: 'd8', section: 'DEPENSE', category: 'Sécurité', label: 'Signalétique', amountNMinus1: 0, amountN: 0 },
  { id: 'd9', section: 'DEPENSE', category: 'Communication', label: 'Affiches', amountNMinus1: 0, amountN: 0 },
  { id: 'd10', section: 'DEPENSE', category: 'Communication', label: 'Publicité', amountNMinus1: 0, amountN: 0 },

  // VALORISATION
  { id: 'v1', section: 'VALORISATION', category: 'Bénévolat', label: 'Heures bénévoles', amountNMinus1: 0, amountN: 0 },
  { id: 'v2', section: 'VALORISATION', category: 'Prêt de matériel', label: 'Véhicules', amountNMinus1: 0, amountN: 0 },
  { id: 'v3', section: 'VALORISATION', category: 'Mise à disposition de locaux', label: 'Salles municipales', amountNMinus1: 0, amountN: 0 },
];
