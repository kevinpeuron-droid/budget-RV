
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

export interface SponsorYearlyData {
  amountPromised: number;
  amountPaid: number;
  datePaid?: string;
  dateSent?: string;
  dateReminder?: string;
  status: 'En attente' | 'Accepté' | 'Refusé';
  budgetLineId?: string;
  transactionId?: string;
  notes?: string; // Notes spécifiques à l'année
}

export interface Sponsor {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone?: string;
  notes?: string; // Notes générales sur l'entreprise
  
  // Nouvelle structure : Données par année (ex: "2025": { amountPromised: 500... })
  yearlyData?: Record<string, SponsorYearlyData>;

  // Champs dépréciés (gardés pour compatibilité lors de la migration)
  amountPromised?: number;
  amountPaid?: number;
  datePaid?: string;
  dateSent?: string;
  dateReminder?: string;
  status?: 'En attente' | 'Accepté' | 'Refusé';
  budgetLineId?: string; 
  transactionId?: string; 
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
  'Participation des délégations (Equipes/athlètes)',
  'Aides fédérales',
  'Collectivités territoriales',
  'Autres partenaires public',
  'Partenaires Privés',
  'Public-Spectateurs',
  'Apport Propres',
  'Divers'
];

export const DEFAULT_CATEGORIES_DEPENSE = [
  'Logistique',
  'Matériel Sportif',
  'Frais d\'organisation',
  'Hébergement',
  'Restauration',
  'Transport',
  'Ressources humaines',
  'Information-Communication-Animation',
  'Récompenses',
  'Divers'
];

export const DEFAULT_BUDGET_LINES: BudgetLine[] = [
  // RECETTES (Produits)
  // Participation des délégations (Equipes/athlètes)
  { id: 'inc_del_1', section: 'RECETTE', category: 'Participation des délégations (Equipes/athlètes)', label: 'Inscriptions/engagement', amountNMinus1: 0, amountN: 0 },
  { id: 'inc_del_2', section: 'RECETTE', category: 'Participation des délégations (Equipes/athlètes)', label: 'Participation hébergement', amountNMinus1: 0, amountN: 0 },
  { id: 'inc_del_3', section: 'RECETTE', category: 'Participation des délégations (Equipes/athlètes)', label: 'Participation restauration', amountNMinus1: 0, amountN: 0 },
  { id: 'inc_del_4', section: 'RECETTE', category: 'Participation des délégations (Equipes/athlètes)', label: 'Autres', amountNMinus1: 0, amountN: 0 },

  // Aides fédérales
  { id: 'inc_fed_1', section: 'RECETTE', category: 'Aides fédérales', label: 'Fédération Internationale/nationale', amountNMinus1: 0, amountN: 0 },
  { id: 'inc_fed_2', section: 'RECETTE', category: 'Aides fédérales', label: 'Ligue régionale', amountNMinus1: 0, amountN: 0 },
  { id: 'inc_fed_3', section: 'RECETTE', category: 'Aides fédérales', label: 'Comité départemental', amountNMinus1: 0, amountN: 0 },
  { id: 'inc_fed_4', section: 'RECETTE', category: 'Aides fédérales', label: 'Club', amountNMinus1: 0, amountN: 0 },

  // Collectivités territoriales
  { id: 'inc_col_1', section: 'RECETTE', category: 'Collectivités territoriales', label: 'Conseil régional', amountNMinus1: 0, amountN: 0 },
  { id: 'inc_col_2', section: 'RECETTE', category: 'Collectivités territoriales', label: 'Conseil départemental 22', amountNMinus1: 0, amountN: 0 },
  { id: 'inc_col_3', section: 'RECETTE', category: 'Collectivités territoriales', label: 'CCKB', amountNMinus1: 0, amountN: 0 },
  { id: 'inc_col_4', section: 'RECETTE', category: 'Collectivités territoriales', label: 'Commune de Glomel', amountNMinus1: 0, amountN: 0 },
  { id: 'inc_col_5', section: 'RECETTE', category: 'Collectivités territoriales', label: 'Autres', amountNMinus1: 0, amountN: 0 },

  // Autres partenaires public
  { id: 'inc_pub_1', section: 'RECETTE', category: 'Autres partenaires public', label: 'Etat', amountNMinus1: 0, amountN: 0 },
  { id: 'inc_pub_2', section: 'RECETTE', category: 'Autres partenaires public', label: 'Agence Nationale du Sport', amountNMinus1: 0, amountN: 0 },
  { id: 'inc_pub_3', section: 'RECETTE', category: 'Autres partenaires public', label: 'Autres', amountNMinus1: 0, amountN: 0 },

  // Partenaires Privés
  { id: 'inc_priv_1', section: 'RECETTE', category: 'Partenaires Privés', label: 'Sponsors/Partenaires', amountNMinus1: 0, amountN: 0 },
  { id: 'inc_priv_2', section: 'RECETTE', category: 'Partenaires Privés', label: 'Vente de prestations', amountNMinus1: 0, amountN: 0 },
  { id: 'inc_priv_3', section: 'RECETTE', category: 'Partenaires Privés', label: 'Village partenaires (stands, ...)', amountNMinus1: 0, amountN: 0 },
  { id: 'inc_priv_4', section: 'RECETTE', category: 'Partenaires Privés', label: 'Autres', amountNMinus1: 0, amountN: 0 },

  // Public-Spectateurs
  { id: 'inc_spec_1', section: 'RECETTE', category: 'Public-Spectateurs', label: 'Billetterie', amountNMinus1: 0, amountN: 0 },
  { id: 'inc_spec_2', section: 'RECETTE', category: 'Public-Spectateurs', label: 'Restauration/buvette', amountNMinus1: 0, amountN: 0 },
  { id: 'inc_spec_3', section: 'RECETTE', category: 'Public-Spectateurs', label: 'Boutique', amountNMinus1: 0, amountN: 0 },

  // Apport Propres
  { id: 'inc_prop_1', section: 'RECETTE', category: 'Apport Propres', label: 'Organisation d\'évènements', amountNMinus1: 0, amountN: 0 },

  // Divers
  { id: 'inc_div_1', section: 'RECETTE', category: 'Divers', label: 'Autres', amountNMinus1: 0, amountN: 0 },

  // DEPENSES (Charges)
  // Logistique
  { id: 'exp_log_1', section: 'DEPENSE', category: 'Logistique', label: 'Location Site', amountNMinus1: 0, amountN: 0 },
  { id: 'exp_log_2', section: 'DEPENSE', category: 'Logistique', label: 'Installation/aménagement/entretien', amountNMinus1: 0, amountN: 0 },
  { id: 'exp_log_3', section: 'DEPENSE', category: 'Logistique', label: 'Achat, location de matériel', amountNMinus1: 0, amountN: 0 },
  { id: 'exp_log_4', section: 'DEPENSE', category: 'Logistique', label: 'Autres', amountNMinus1: 0, amountN: 0 },

  // Matériel Sportif
  { id: 'exp_mat_1', section: 'DEPENSE', category: 'Matériel Sportif', label: 'Transport de matériel', amountNMinus1: 0, amountN: 0 },
  { id: 'exp_mat_2', section: 'DEPENSE', category: 'Matériel Sportif', label: 'Location Achat', amountNMinus1: 0, amountN: 0 },
  { id: 'exp_mat_3', section: 'DEPENSE', category: 'Matériel Sportif', label: 'Autres', amountNMinus1: 0, amountN: 0 },

  // Frais d'organisation
  { id: 'exp_org_1', section: 'DEPENSE', category: 'Frais d\'organisation', label: 'Droits d\'inscription fédéraux', amountNMinus1: 0, amountN: 0 },
  { id: 'exp_org_2', section: 'DEPENSE', category: 'Frais d\'organisation', label: 'Fournitures', amountNMinus1: 0, amountN: 0 },
  { id: 'exp_org_3', section: 'DEPENSE', category: 'Frais d\'organisation', label: 'Sécurité', amountNMinus1: 0, amountN: 0 },
  { id: 'exp_org_4', section: 'DEPENSE', category: 'Frais d\'organisation', label: 'Assurances', amountNMinus1: 0, amountN: 0 },
  { id: 'exp_org_5', section: 'DEPENSE', category: 'Frais d\'organisation', label: 'Impôts/taxes', amountNMinus1: 0, amountN: 0 },
  { id: 'exp_org_6', section: 'DEPENSE', category: 'Frais d\'organisation', label: 'Autres', amountNMinus1: 0, amountN: 0 },

  // Hébergement
  { id: 'exp_heb_1', section: 'DEPENSE', category: 'Hébergement', label: 'Officiel/Bénévoles/VIP', amountNMinus1: 0, amountN: 0 },
  { id: 'exp_heb_2', section: 'DEPENSE', category: 'Hébergement', label: 'Equipes/Athlètes', amountNMinus1: 0, amountN: 0 },

  // Restauration
  { id: 'exp_res_1', section: 'DEPENSE', category: 'Restauration', label: 'Officiels', amountNMinus1: 0, amountN: 0 },
  { id: 'exp_res_2', section: 'DEPENSE', category: 'Restauration', label: 'VIP/bénévoles', amountNMinus1: 0, amountN: 0 },
  { id: 'exp_res_3', section: 'DEPENSE', category: 'Restauration', label: 'Organisation', amountNMinus1: 0, amountN: 0 },
  { id: 'exp_res_4', section: 'DEPENSE', category: 'Restauration', label: 'Achat Restauration/Buvette', amountNMinus1: 0, amountN: 0 },

  // Transport
  { id: 'exp_tra_1', section: 'DEPENSE', category: 'Transport', label: 'Navettes', amountNMinus1: 0, amountN: 0 },
  { id: 'exp_tra_2', section: 'DEPENSE', category: 'Transport', label: 'Déplacement Equipes/athlètes', amountNMinus1: 0, amountN: 0 },
  { id: 'exp_tra_3', section: 'DEPENSE', category: 'Transport', label: 'Organisation', amountNMinus1: 0, amountN: 0 },
  { id: 'exp_tra_4', section: 'DEPENSE', category: 'Transport', label: 'Autres', amountNMinus1: 0, amountN: 0 },

  // Ressources humaines
  { id: 'exp_rh_1', section: 'DEPENSE', category: 'Ressources humaines', label: 'Arbitres/Speaker', amountNMinus1: 0, amountN: 0 },
  { id: 'exp_rh_2', section: 'DEPENSE', category: 'Ressources humaines', label: 'Médecins/Secouristes', amountNMinus1: 0, amountN: 0 },
  { id: 'exp_rh_3', section: 'DEPENSE', category: 'Ressources humaines', label: 'Gratification associations partenaires', amountNMinus1: 0, amountN: 0 },
  { id: 'exp_rh_4', section: 'DEPENSE', category: 'Ressources humaines', label: 'Autres', amountNMinus1: 0, amountN: 0 },

  // Information-Communication-Animation
  { id: 'exp_com_1', section: 'DEPENSE', category: 'Information-Communication-Animation', label: 'Supports de communication (Affiches, flyers, dossards, ...)', amountNMinus1: 0, amountN: 0 },
  { id: 'exp_com_2', section: 'DEPENSE', category: 'Information-Communication-Animation', label: 'Billetterie', amountNMinus1: 0, amountN: 0 },
  { id: 'exp_com_3', section: 'DEPENSE', category: 'Information-Communication-Animation', label: 'Signalétique', amountNMinus1: 0, amountN: 0 },
  { id: 'exp_com_4', section: 'DEPENSE', category: 'Information-Communication-Animation', label: 'Animations', amountNMinus1: 0, amountN: 0 },
  { id: 'exp_com_5', section: 'DEPENSE', category: 'Information-Communication-Animation', label: 'Autres', amountNMinus1: 0, amountN: 0 },

  // Récompenses
  { id: 'exp_rec_1', section: 'DEPENSE', category: 'Récompenses', label: 'Dotations inscription', amountNMinus1: 0, amountN: 0 },
  { id: 'exp_rec_2', section: 'DEPENSE', category: 'Récompenses', label: 'Médailles/goodies', amountNMinus1: 0, amountN: 0 },
  { id: 'exp_rec_3', section: 'DEPENSE', category: 'Récompenses', label: 'Autres', amountNMinus1: 0, amountN: 0 },

  // Divers
  { id: 'exp_div_1', section: 'DEPENSE', category: 'Divers', label: 'Autres', amountNMinus1: 0, amountN: 0 },

  // VALORISATION
  { id: 'val1', section: 'VALORISATION', category: 'Bénévolat', label: 'Heures Bénévoles', amountNMinus1: 0, amountN: 0 },
  { id: 'val2', section: 'VALORISATION', category: 'Matériel', label: 'Prêt de Véhicules/Matériel', amountNMinus1: 0, amountN: 0 },
  { id: 'val3', section: 'VALORISATION', category: 'Locaux', label: 'Mise à dispo Salles', amountNMinus1: 0, amountN: 0 },
];
