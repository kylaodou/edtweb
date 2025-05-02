export interface Classe {
  id: string;
  nom: string;
  filiereId: string;
  filiereName?: string; // Pour l'affichage
  niveau: string;
  delegueId?: string;
  delegueNom?: string; // Pour l'affichage
  effectifs?: number; // Nombre d'étudiants dans la classe
}
