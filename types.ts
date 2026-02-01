export type TransactionType = 'RECETTE' | 'DEPENSE';

export interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  type: TransactionType;
  eventId?: string; // Optional link to an event
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
  amountPromised: number;
  amountPaid: number;
  lastYearTotal?: number; // Nouveau champ pour stocker le versé de l'année précédente
  status: 'Prospect' | 'Confirmé' | 'Payé' | 'Perdu';
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

export interface AppData {
  realized: Transaction[];
  provisional: Transaction[];
  contributions: Contribution[];
  sponsors: Sponsor[];
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