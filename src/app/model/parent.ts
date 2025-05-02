export interface Parent {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  userId?: string;
  enfantsIds: string[];
  enfantsNoms?: string[]; // Pour l'affichage
  relationAvecEtudiant: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ParentsDto {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  enfantsIds: string[];
  relationAvecEtudiant: string;
}
