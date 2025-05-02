export interface Etudiant {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  dateNaissance: Date;
  lieuNaissance: string;
  email: string;
  telephone: string;
  sexe: string;
  userId?: string;
  classeId: string;
  classeNom?: string; // Pour l'affichage
  estDelegue?: boolean;
  parentsIds?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface EtudiantsDto {
  matricule: string;
  nom: string;
  prenom: string;
  dateNaissance: Date;
  lieuNaissance: string;
  email: string;
  telephone: string;
  sexe: string;
  classeId: string;
  estDelegue?: boolean;
  parentsIds?: string[];
}
