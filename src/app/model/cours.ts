export interface Cours {
  id: string;
  code: string;
  intitule: string;
  vhCT: number;
  vhTP: number;
  vhTD: number;
  restantVhCT: number;
  restantVhTP: number;
  restantVhTD: number;
  vhResume: string;
  credit: number;
  enseignantId: string;
  enseignantNom?: string; // Pour l'affichage
  classeId: string;
  classeNom?: string; // Pour l'affichage
  semestre: string;
  volumeHoraireRestant?: number; // Pour la compatibilité avec le code existant
  createdAt?: Date;
  updatedAt?: Date;
}
