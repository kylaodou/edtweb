export interface Disponibilite {
  id: string;
  jour: string;
  creneauId: string;
  enseignantId: string;
  disponible: boolean;
  commentaire?: string;
  debutSemaine: Date | string;
  finSemaine: Date | string;
  createdAt?: Date | string;
}

export interface DisponibiliteDto {
  jour: string;
  creneauId: string;
  enseignantId: string;
  disponible: boolean;
  commentaire?: string;
  debutSemaine: Date | string;
  finSemaine: Date | string;
  createdAt?: Date | string;
}
